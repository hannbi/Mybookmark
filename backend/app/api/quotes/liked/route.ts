// app/api/quotes/liked/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// 내가 공감한 인용문 목록
export async function GET() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 내가 공감한 quote 목록
  const { data, error } = await supabase
    .from("quote_likes")
    .select(
      `
      quotes (
        id,
        user_id,
        content,
        created_at,
        books (
          id,
          title,
          author
        ),
        profiles!quotes_user_id_fkey (
          nickname
        )
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("liked quotes select error:", error);
    return NextResponse.json(
      { error: "공감한 구절을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  const quotes = (data ?? []).map((row: any) => row.quotes).filter(Boolean);
  const ids = quotes.map((q: any) => q.id);

  // 공감 수 집계
  const likeCountMap = new Map<number, number>();
  if (ids.length > 0) {
    const { data: likesRows, error: likesError } = await supabase
      .from("quote_likes")
      .select("quote_id")
      .in("quote_id", ids);

    if (likesError) {
      console.error("liked quotes count error:", likesError);
    } else {
      likesRows?.forEach((row) => {
        const qid = row.quote_id as number;
        likeCountMap.set(qid, (likeCountMap.get(qid) ?? 0) + 1);
      });
    }
  }

  const result = quotes.map((q: any) => ({
    id: q.id,
    user_id: q.user_id as string,
    content: q.content as string,
    created_at: q.created_at as string,
    book: q.books
      ? {
          id: q.books.id as number,
          title: q.books.title as string,
          author: q.books.author as string | null,
        }
      : null,
    nickname: q.profiles?.nickname ?? "익명",
    likes_count: likeCountMap.get(q.id) ?? 0,
  }));

  return NextResponse.json({ quotes: result });
}
