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
