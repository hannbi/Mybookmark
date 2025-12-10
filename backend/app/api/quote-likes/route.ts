// app/api/quote-likes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// 좋아요 / 좋아요 취소 토글
export async function POST(req: NextRequest) {
    try {
        // 1) 쿠키 기반 서버용 Supabase 클라이언트
        const supabase = await createSupabaseServerClient();

        // 2) 로그인 사용자 확인
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
            console.error("supabase.auth.getUser error:", authError);
        }

        if (!user) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            );
        }

        // 3) body 에서 quote_id 꺼내기
        const body = await req.json().catch(() => null);

        let quote_id: number | null = null;

        // body 에서 먼저 찾기 (quote_id, quoteId 둘 다 허용)
        if (body) {
            const raw =
                (body.quote_id as number | string | undefined) ??
                (body.quoteId as number | string | undefined);

            if (raw !== undefined && raw !== null) {
                const n = Number(raw);
                if (!Number.isNaN(n)) {
                    quote_id = n;
                }
            }
        }

        // 그래도 없으면 쿼리스트링에서 한 번 더 시도 (?quote_id= / ?quoteId=)
        if (quote_id === null) {
            const sp = new URL(req.url).searchParams;
            const raw =
                sp.get("quote_id") ??
                sp.get("quoteId");

            if (raw !== null) {
                const n = Number(raw);
                if (!Number.isNaN(n)) {
                    quote_id = n;
                }
            }
        }

        if (quote_id === null) {
            return NextResponse.json(
                { error: "quote_id missing" },
                { status: 400 }
            );
        }


        // 4) 내가 이미 이 인용문에 좋아요 했는지 확인
        const {
            data: existing,
            error: existingError,
        } = await supabase
            .from("quote_likes")
            .select("id")
            .eq("quote_id", quote_id)
            .eq("user_id", user.id)
            .maybeSingle();

        if (existingError) {
            console.error("select from quote_likes error:", existingError);
            return NextResponse.json(
                { error: "failed to check like" },
                { status: 500 }
            );
        }

        let liked: boolean;

        if (existing) {
            // 5-a) 이미 좋아요 한 상태 → 좋아요 취소
            const { error: deleteError } = await supabase
                .from("quote_likes")
                .delete()
                .eq("id", existing.id);

            if (deleteError) {
                console.error("delete from quote_likes error:", deleteError);
                return NextResponse.json(
                    { error: "failed to unlike" },
                    { status: 500 }
                );
            }

            liked = false;
        } else {
            // 5-b) 아직 좋아요 안 한 상태 → 좋아요 추가
            const { error: insertError } = await supabase
                .from("quote_likes")
                .insert({
                    user_id: user.id,
                    quote_id,
                });

            if (insertError) {
                console.error("insert into quote_likes error:", insertError);
                return NextResponse.json(
                    { error: "failed to like" },
                    { status: 500 }
                );
            }

            liked = true;
        }

        // 6) 현재 좋아요 개수 다시 세어서 quotes.likes_count 갱신
        const {
            count,
            error: countError,
        } = await supabase
            .from("quote_likes")
            .select("*", { count: "exact", head: true })
            .eq("quote_id", quote_id);

        if (countError) {
            console.error("count quote_likes error:", countError);
            // count 실패해도 좋아요 토글 자체는 성공했으니 liked 정보만 보내줌
            return NextResponse.json({ liked });
        }

        const likesCount = count ?? 0;

        const { error: updateError } = await supabase
            .from("quotes")
            .update({ likes_count: likesCount })
            .eq("id", quote_id);

        if (updateError) {
            console.error("update quotes.likes_count error:", updateError);
            // 그래도 좋아요 토글은 성공한 상태
        }

        return NextResponse.json({ liked });
    } catch (e) {
        console.error("POST /api/quote-likes error:", e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
