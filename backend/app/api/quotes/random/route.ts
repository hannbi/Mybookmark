// app/api/quotes/random/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // 1) 일단 최근 인용문 몇 개 가져오기 (여기선 30개 정도에서 랜덤)
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
        author,
        cover
      ),
      profiles!quotes_user_id_fkey (
        id,
        nickname
      )
    `
        )
        .order("created_at", { ascending: false })
        .limit(30);

    if (error) {
        console.error("quotes random select error:", error);
        return NextResponse.json(
            { error: "인용문을 불러오는 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }

    if (!quotes || quotes.length === 0) {
        return NextResponse.json({ quote: null });
    }

    // 2) 그 중에서 하나 랜덤 선택
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const base = quotes[randomIndex];
    const quoteId = base.id;

    // 3) 좋아요 수 계산 (quote_likes 기준)
    const { count: likesCount, error: countError } = await supabase
        .from("quote_likes")
        .select("*", { count: "exact", head: true })
        .eq("quote_id", quoteId);

    if (countError) {
        console.error("quote_likes count error:", countError);
        return NextResponse.json(
            { error: "공감 수 계산 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }

    // 4) 내가 공감했는지 여부
    let likedByMe = false;
    if (user) {
        const { data: myLike, error: myLikeError } = await supabase
            .from("quote_likes")
            .select("id")
            .eq("quote_id", quoteId)
            .eq("user_id", user.id)
            .maybeSingle();

        if (myLikeError) {
            console.error("quote_likes myLike error:", myLikeError);
        } else if (myLike) {
            likedByMe = true;
        }
    }

    const quote = {
        id: base.id,
        book_id: base.book_id,
        content: base.content,
        page: base.page,
        created_at: base.created_at,
        books: base.books,
        profiles: base.profiles,
        likes_count: likesCount ?? 0,
        liked_by_me: likedByMe,
    };

    return NextResponse.json({ quote });
}
