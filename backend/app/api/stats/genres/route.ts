// app/api/stats/genres/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest) {
    const supabase = await createSupabaseServerClient();

    // 이번 달 범위 계산 (서버 기준)
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0~11
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);

    const startStr = start.toISOString().slice(0, 10); // YYYY-MM-DD
    const endStr = end.toISOString().slice(0, 10);

    // ✅ 전체 사용자 기준:
    // user_id 필터를 제거하고, 모든 user_books + books.category 를 대상으로 집계
    const { data, error } = await supabase
        .from("user_books")
        .select(
            `
      id,
      status,
      finished_at,
      books (
        category
      )
    `
        )
        .eq("status", "finished")
        .gte("finished_at", startStr)
        .lte("finished_at", endStr);

    if (error) {
        console.error("genre stats query error:", error);
        return NextResponse.json(
            { error: "장르 통계를 불러오는 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }

    const counts: Record<string, number> = {};

    // data가 null일 수 있으니까 안전하게 ?? []
    (data ?? []).forEach((row: any) => {
        // Supabase에서 books(category) 를 함께 가져왔기 때문에
        // row.books?.category 에 장르가 들어있다고 가정
        const raw = (row.books?.category as string | null) ?? null;
        const categoryRaw = raw?.trim();
        const category =
            categoryRaw && categoryRaw.length > 0 ? categoryRaw : "기타";

        counts[category] = (counts[category] ?? 0) + 1;
    });

    const genres = Object.entries(counts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

    return NextResponse.json({
        year,
        month: month + 1,
        totalFinishedThisMonth: data?.length ?? 0,
        genres,
    });
}
