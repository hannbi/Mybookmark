// app/api/quote-likes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createSupabaseServerClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
            console.error("quote-likes getUser error:", userError);
            return NextResponse.json(
                { error: "인증 정보를 가져오지 못했습니다." },
                { status: 500 }
            );
        }

        if (!user) {
            return NextResponse.json(
                { error: "로그인이 필요합니다." },
                { status: 401 }
            );
        }

        const body = await req.json().catch(() => null);

        // 프론트에서 오는 이름을 모두 수용
        const rawId = body?.quote_id ?? body?.quoteId ?? body?.id;
        const quoteId = rawId ? Number(rawId) : null;

        if (!quoteId || Number.isNaN(quoteId)) {
            return NextResponse.json(
                { error: "quote_id missing" },
                { status: 400 }
            );
        }

        // 이미 내가 공감했는지 확인
        const { data: existing, error: existingError } = await supabase
            .from("quote_likes")
            .select("id")
            .eq("user_id", user.id)
            .eq("quote_id", quoteId)
            .maybeSingle();

        if (existingError) {
            console.error("quote_likes select error:", existingError);
            return NextResponse.json(
                { error: "공감 상태 조회 중 오류가 발생했습니다." },
                { status: 500 }
            );
        }

        let liked: boolean;

        if (existing) {
            // 공감 취소
            const { error: delError } = await supabase
                .from("quote_likes")
                .delete()
                .eq("id", existing.id);

            if (delError) {
                console.error("quote_likes delete error:", delError);
                return NextResponse.json(
                    { error: "공감 해제 중 오류가 발생했습니다." },
                    { status: 500 }
                );
            }
            liked = false;
        } else {
            // 새 공감 추가
            const { error: insError } = await supabase
                .from("quote_likes")
                .insert({ user_id: user.id, quote_id: quoteId });

            if (insError) {
                console.error("quote_likes insert error:", insError);
                return NextResponse.json(
                    { error: "공감 추가 중 오류가 발생했습니다." },
                    { status: 500 }
                );
            }
            liked = true;
        }

        // 최신 공감 수 계산 (quote_likes 기준)
        const { count, error: countError } = await supabase
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

        const likesCount = count ?? 0;

        // 다양한 프론트 코드와 호환되도록 여러 필드 이름으로 응답
        return NextResponse.json({
            liked,                 // boolean
            liked_by_me: liked,    // boolean (snake_case)
            likesCount,            // camelCase
            likes_count: likesCount, // snake_case
        });
    } catch (e) {
        console.error("quote-likes POST unexpected error:", e);
        return NextResponse.json(
            { error: "알 수 없는 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
