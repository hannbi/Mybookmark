// app/api/quotes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const { searchParams } = new URL(req.url);
  const bookIdParam = searchParams.get("bookId");
  const bookId = bookIdParam ? Number(bookIdParam) : NaN;

  if (!bookId || Number.isNaN(bookId)) {
    return NextResponse.json(
      { error: "bookId 가 필요합니다." },
      { status: 400 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1) 이 책의 인용문 목록 기본 정보
  const { data: quotes, error } = await supabase
    .from("quotes")
    .select(
      `
      id,
      book_id,
      content,
      page,
      created_at,
      profiles!quotes_user_id_fkey (
        id,
        nickname
      )
    `
    )
    .eq("book_id", bookId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("quotes list select error:", error);
    return NextResponse.json(
      { error: "인용문을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  if (!quotes || quotes.length === 0) {
    return NextResponse.json({ quotes: [] });
  }

  const ids = quotes.map((q) => q.id);

  // 2) quote_likes 에서 각 quote 별 좋아요 수와 내가 누른 것 계산
  const { data: likesRows, error: likesError } = await supabase
    .from("quote_likes")
    .select("quote_id, user_id")
    .in("quote_id", ids);

  if (likesError) {
    console.error("quote_likes list error:", likesError);
    return NextResponse.json(
      { error: "공감 정보를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  const likeCountMap = new Map<number, number>();
  const likedByMeSet = new Set<number>();

  (likesRows ?? []).forEach((row) => {
    const qid = row.quote_id as number;
    likeCountMap.set(qid, (likeCountMap.get(qid) ?? 0) + 1);
    if (user && row.user_id === user.id) {
      likedByMeSet.add(qid);
    }
  });

  const result = quotes.map((q) => ({
    id: q.id,
    book_id: q.book_id,
    content: q.content,
    page: q.page,
    created_at: q.created_at,
    profiles: q.profiles,
    likes_count: likeCountMap.get(q.id) ?? 0,
    liked_by_me: likedByMeSet.has(q.id),
  }));

  return NextResponse.json({ quotes: result });
}

// POST /api/quotes
// body: { bookId|book_id, content|text, page? }
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("quotes POST getUser error:", userError);
  }

  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  // profiles FK 가 있으므로 닉네임 기본값을 준비
  try {
    const defaultNickname =
      user.user_metadata?.full_name || user.email || "사용자";

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          nickname: defaultNickname,
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.error("quotes POST profiles upsert error:", profileError);
      return NextResponse.json(
        { error: "사용자 정보를 준비하는 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }
  } catch (e) {
    console.error("quotes POST profiles upsert exception:", e);
    return NextResponse.json(
      { error: "사용자 정보를 준비하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const rawBookId = body?.bookId ?? body?.book_id;
  const rawContent = body?.content ?? body?.text;
  const rawPage = body?.page;

  const bookId = rawBookId ? Number(rawBookId) : NaN;
  const content = typeof rawContent === "string" ? rawContent.trim() : "";
  const page =
    rawPage === undefined || rawPage === null || `${rawPage}`.trim() === ""
      ? null
      : Number(rawPage);

  if (!bookId || Number.isNaN(bookId)) {
    return NextResponse.json(
      { error: "bookId 가 필요합니다." },
      { status: 400 }
    );
  }

  if (!content) {
    return NextResponse.json(
      { error: "내용을 입력해 주세요." },
      { status: 400 }
    );
  }

  if (page !== null && (!Number.isFinite(page) || page < 1)) {
    return NextResponse.json(
      { error: "page 값이 올바르지 않습니다." },
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
        created_at,
        profiles!quotes_user_id_fkey (
          id,
          nickname
        )
      `
    )
    .single();

  if (error || !data) {
    console.error("quotes POST insert error:", error);
    return NextResponse.json(
      { error: "인용문 등록에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      quote: {
        ...data,
        likes_count: 0,
        liked_by_me: false,
      },
    },
    { status: 201 }
  );
}

// DELETE /api/quotes?id=123
export async function DELETE(req: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("quotes DELETE getUser error:", userError);
  }

  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get("id");
  const quoteId = idParam ? Number(idParam) : NaN;

  if (!quoteId || Number.isNaN(quoteId)) {
    return NextResponse.json(
      { error: "id 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  const { data: existing, error: selectError } = await supabase
    .from("quotes")
    .select("id, user_id")
    .eq("id", quoteId)
    .maybeSingle();

  if (selectError) {
    console.error("quotes DELETE select error:", selectError);
    return NextResponse.json(
      { error: "인용문을 조회하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  if (!existing) {
    return NextResponse.json(
      { error: "해당 인용문을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  if (existing.user_id !== user.id) {
    return NextResponse.json(
      { error: "본인이 작성한 인용문만 삭제할 수 있습니다." },
      { status: 403 }
    );
  }

  // 좋아요가 FK로 묶여 있지 않을 가능성에 대비해 먼저 제거
  const { error: likesError } = await supabase
    .from("quote_likes")
    .delete()
    .eq("quote_id", quoteId);

  if (likesError) {
    console.error("quotes DELETE quote_likes delete error:", likesError);
    // 계속 진행 (하위 테이블이 없을 수도 있음)
  }

  const { error: deleteError } = await supabase
    .from("quotes")
    .delete()
    .eq("id", quoteId);

  if (deleteError) {
    console.error("quotes DELETE delete error:", deleteError);
    return NextResponse.json(
      { error: "인용문 삭제에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
