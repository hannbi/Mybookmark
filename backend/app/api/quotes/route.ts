// app/api/quotes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET /api/quotes?bookId=123
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const { searchParams } = new URL(req.url);
  const bookIdParam = searchParams.get("bookId");
  const bookId = bookIdParam ? Number(bookIdParam) : NaN;

  if (!bookIdParam || Number.isNaN(bookId)) {
    return NextResponse.json(
      { error: "bookId 가 필요합니다." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("quotes")
    .select(
      `
      id,
      user_id,
      book_id,
      content,
      page,
      likes_count,
      created_at,
      profiles (
        id,
        nickname
      )
    `
    )
    .eq("book_id", bookId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("GET /api/quotes error:", error);
    return NextResponse.json(
      { error: "인용문을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ quotes: data ?? [] });
}

// POST /api/quotes  { bookId, content, page? }
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("POST /api/quotes getUser error:", userError);
  }

  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const body = await req.json();
  const bookId = Number(body.bookId);
  const content = (body.content ?? "").trim();
  const page = body.page ?? null;

  if (!bookId || Number.isNaN(bookId) || !content) {
    return NextResponse.json(
      { error: "bookId 와 content 는 필수입니다." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("quotes")
    .insert({
      user_id: user.id,
      book_id: bookId,
      content,
      page,
    })
    .select(
      `
      id,
      user_id,
      book_id,
      content,
      page,
      likes_count,
      created_at,
      profiles (
        id,
        nickname
      )
    `
    )
    .single();

  if (error) {
    console.error("POST /api/quotes insert error:", error);
    return NextResponse.json(
      { error: "인용문 등록에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ quote: data }, { status: 201 });
}

// DELETE /api/quotes?id=123
export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id missing" }, { status: 400 });
  }

  const quoteId = Number(id);
  if (Number.isNaN(quoteId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  try {
    // 1) 먼저 이 인용문에 달린 좋아요 전부 삭제
    const { error: likesError } = await supabase
      .from("quote_likes")
      .delete()
      .eq("quote_id", quoteId);

    if (likesError) {
      console.error("DELETE quote_likes error:", likesError);
      // 좋아요 삭제에 실패하면 인용문 삭제도 중단
      return NextResponse.json(
        { error: "failed to delete quote likes" },
        { status: 500 }
      );
    }

    // 2) 이제 인용문 삭제
    const { error: quoteError } = await supabase
      .from("quotes")
      .delete()
      .eq("id", quoteId);

    if (quoteError) {
      console.error("DELETE quotes error:", quoteError);
      return NextResponse.json(
        { error: "failed to delete quote" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/quotes unexpected error:", e);
    return NextResponse.json(
      { error: "failed to delete quote" },
      { status: 500 }
    );
  }
}
