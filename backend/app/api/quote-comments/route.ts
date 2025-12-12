// app/api/quote-comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(req.url);
  const quoteIdParam = searchParams.get("quoteId");
  const quoteId = quoteIdParam ? Number(quoteIdParam) : NaN;

  if (!quoteId || Number.isNaN(quoteId)) {
    return NextResponse.json(
      { error: "quoteId 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("quote_comments")
    .select(
      `
        id,
        quote_id,
        user_id,
        content,
        created_at,
        profiles!quote_comments_user_id_fkey (
          id,
          nickname
        )
      `
    )
    .eq("quote_id", quoteId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("quote_comments GET error:", error);
    return NextResponse.json(
      { error: "댓글을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("quote_comments POST getUser error:", userError);
  }

  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const rawQuoteId = body?.quoteId ?? body?.quote_id;
  const rawContent = body?.content ?? body?.text;

  const quoteId = rawQuoteId ? Number(rawQuoteId) : NaN;
  const content = typeof rawContent === "string" ? rawContent.trim() : "";

  if (!quoteId || Number.isNaN(quoteId)) {
    return NextResponse.json(
      { error: "quoteId가 올바르지 않습니다." },
      { status: 400 }
    );
  }

  if (!content) {
    return NextResponse.json(
      { error: "댓글 내용을 입력해 주세요." },
      { status: 400 }
    );
  }

  // 프로필 기본값 세팅 (닉네임 누락 대비)
  try {
    const defaultNickname =
      (user.user_metadata as any)?.full_name ||
      (user.user_metadata as any)?.nickname ||
      user.email ||
      "익명";

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        { id: user.id, nickname: defaultNickname },
        { onConflict: "id" }
      );

    if (profileError) {
      console.error("quote_comments POST profile upsert error:", profileError);
    }
  } catch (e) {
    console.error("quote_comments POST profile upsert exception:", e);
  }

  const { data, error } = await supabase
    .from("quote_comments")
    .insert({
      quote_id: quoteId,
      user_id: user.id,
      content,
    })
    .select(
      `
        id,
        quote_id,
        user_id,
        content,
        created_at,
        profiles!quote_comments_user_id_fkey (
          id,
          nickname
        )
      `
    )
    .single();

  if (error || !data) {
    console.error("quote_comments POST insert error:", error);
    return NextResponse.json(
      { error: "댓글 작성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ comment: data }, { status: 201 });
}
