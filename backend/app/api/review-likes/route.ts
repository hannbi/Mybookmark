import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
        console.error("auth getUser error in POST /api/review-likes:", userError);
    }

    if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // ✅ review_likes.user_id 가 profiles.id 를 바라보고 있으므로
    //    좋아요 누르기 전에 profiles 레코드를 만들어 둔다.
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
            console.error(
                "profiles upsert error before inserting review_like:",
                profileError
            );
            return NextResponse.json(
                { error: "Failed to prepare user profile for like" },
                { status: 500 }
            );
        }
    } catch (e) {
        console.error("profiles upsert exception in review-likes:", e);
        return NextResponse.json(
            { error: "Failed to prepare user profile for like" },
            { status: 500 }
        );
    }
    
    const body = (await request.json().catch(() => null)) as {
        reviewId?: number;
    } | null;

    const reviewId = body?.reviewId;
    if (!reviewId) {
        return NextResponse.json(
            { error: "reviewId is required" },
            { status: 400 }
        );
    }

    // 이미 좋아요 했는지 확인
    const { data: existing, error: existingError } = await supabase
        .from("review_likes")
        .select("id")
        .eq("review_id", reviewId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (existingError) {
        console.error("review_likes select error:", existingError);
        return NextResponse.json(
            { error: "Failed to toggle like" },
            { status: 500 }
        );
    }

    let liked: boolean;

    if (existing) {
        // 이미 좋아요 → 삭제 (취소)
        const { error: delError } = await supabase
            .from("review_likes")
            .delete()
            .eq("id", existing.id);

        if (delError) {
            console.error("review_likes delete error:", delError);
            return NextResponse.json(
                { error: "Failed to remove like" },
                { status: 500 }
            );
        }
        liked = false;
    } else {
        // 아직 안 눌렀으면 추가
        const { error: insError } = await supabase
            .from("review_likes")
            .insert({
                review_id: reviewId,
                user_id: user.id,
            });

        if (insError) {
            console.error("review_likes insert error:", insError);
            return NextResponse.json(
                { error: "Failed to add like" },
                { status: 500 }
            );
        }
        liked = true;
    }

    // 최신 좋아요 개수 다시 계산 → reviews.likes_count 업데이트
    const { count, error: countError } = await supabase
        .from("review_likes")
        .select("review_id", { count: "exact", head: true })
        .eq("review_id", reviewId);

    if (countError) {
        console.error("review_likes count error:", countError);
        return NextResponse.json(
            { error: "Failed to update like count" },
            { status: 500 }
        );
    }

    const likesCount = count ?? 0;

    const { error: updateError } = await supabase
        .from("reviews")
        .update({ likes_count: likesCount })
        .eq("id", reviewId);

    if (updateError) {
        console.error("reviews likes_count update error:", updateError);
        // 그래도 클라이언트에는 최신 count 를 돌려준다
    }

    return NextResponse.json({
        liked,
        likesCount,
    });
}
