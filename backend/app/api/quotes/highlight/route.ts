// app/api/quotes/highlight/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();

  // 최근 인용문 12개 정도 가져와 상위 6개만 노출
  const { data: quotes, error } = await supabase
    .from("quotes")
    .select(
      `
      id,
      book_id,
      content,
      page,
      created_at,
      books (
        id,
        title,
        author
      ),
      profiles!quotes_user_id_fkey (
        id,
        nickname
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    console.error("quotes highlight select error:", error);
    return NextResponse.json(
      { error: "인용문을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  const ids = (quotes ?? []).map((q) => q.id);
  let likeCountMap = new Map<number, number>();
  let commentCountMap = new Map<number, number>();

  if (ids.length > 0) {
    const { data: likeRows, error: likeError } = await supabase
      .from("quote_likes")
      .select("quote_id")
      .in("quote_id", ids);

    if (likeError) {
      console.error("quote_likes highlight error:", likeError);
    } else {
      likeRows?.forEach((row) => {
        const qid = row.quote_id as number;
        likeCountMap.set(qid, (likeCountMap.get(qid) ?? 0) + 1);
      });
    }

    const { data: commentRows, error: commentError } = await supabase
      .from("quote_comments")
      .select("quote_id")
      .in("quote_id", ids);

    if (commentError) {
      console.error("quote_comments highlight error:", commentError);
    } else {
      commentRows?.forEach((row) => {
        const qid = row.quote_id as number;
        commentCountMap.set(qid, (commentCountMap.get(qid) ?? 0) + 1);
      });
    }
  }

  const result = (quotes ?? []).slice(0, 6).map((q) => ({
    id: q.id,
    content: q.content,
    created_at: q.created_at,
    book: q.books
      ? {
          id: q.books.id,
          title: q.books.title,
          author: q.books.author,
        }
      : null,
    nickname: q.profiles?.nickname ?? "익명",
    likes_count: likeCountMap.get(q.id) ?? 0,
    comments_count: commentCountMap.get(q.id) ?? 0,
  }));

  return NextResponse.json({ quotes: result });
}
