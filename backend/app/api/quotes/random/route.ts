// app/api/quotes/random/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest) {
    const supabase = await createSupabaseServerClient();

    // 최근 N개 중에서 랜덤 1개 뽑기 (직접 랜덤 인덱스 선택)
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
      books (
        id,
        title,
        author,
        cover
      ),
      profiles (
        id,
        nickname
      )
    `
        )
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
        console.error("GET /api/quotes/random error:", error);
        return NextResponse.json(
            { error: "인용문을 불러오는 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }

    if (!data || data.length === 0) {
        return NextResponse.json({ quote: null });
    }

    const idx = Math.floor(Math.random() * data.length);
    const quote = data[idx];

    return NextResponse.json({ quote });
}
