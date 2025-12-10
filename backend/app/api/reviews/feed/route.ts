// app/api/reviews/feed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET /api/reviews/feed
// - latest: 최신 리뷰들
// - topLiked: 공감(좋아요) 많은 리뷰들
export async function GET(_req: NextRequest) {
    const supabase = await createSupabaseServerClient();

    // 최신 리뷰 5개 (전체)
    const { data: latest, error: latestError } = await supabase
        .from("reviews")
        .select(
            `
      id,
      book_id,
      user_id,
      content,
      rating,
      likes_count,
      created_at,
      books!inner (
        id,
        title,
        author,
        cover
      ),
      profiles!inner (
        id,
        nickname
      )
    `
        )
        .order("created_at", { ascending: false })
        .limit(5);

    if (latestError) {
        console.error("reviews feed latest error:", latestError);
    }

    // 공감 많은 리뷰 5개 (likes_count > 0 우선)
    const { data: topLiked, error: topError } = await supabase
        .from("reviews")
        .select(
            `
      id,
      book_id,
      user_id,
      content,
      rating,
      likes_count,
      created_at,
      books!inner (
        id,
        title,
        author,
        cover
      ),
      profiles!inner (
        id,
        nickname
      )
    `
        )
        .gt("likes_count", 0)
        .order("likes_count", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5);

    if (topError) {
        console.error("reviews feed topLiked error:", topError);
    }

    return NextResponse.json({
        latest: latest ?? [],
        topLiked: topLiked ?? [],
    });
}
