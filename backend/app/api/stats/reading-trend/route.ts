// app/api/stats/reading-trend/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type TrendItem = {
  month: string; // YYYY-MM
  count: number;
};

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 최근 12개월 범위 계산
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const startStr = start.toISOString().slice(0, 10);

  // 완독 데이터 가져오기
  const { data, error } = await supabase
    .from("user_books")
    .select("finished_at")
    .eq("user_id", user.id)
    .eq("status", "finished")
    .gte("finished_at", startStr);

  if (error) {
    console.error("reading-trend select error:", error);
    return NextResponse.json(
      { error: "독서량을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  // 월별 집계
  const counts = new Map<string, number>();
  (data ?? []).forEach((row) => {
    const finished = row.finished_at as string | null;
    if (!finished) return;
    const month = finished.slice(0, 7); // YYYY-MM
    counts.set(month, (counts.get(month) ?? 0) + 1);
  });

  const result: TrendItem[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    result.push({
      month: key,
      count: counts.get(key) ?? 0,
    });
  }

  // 누적 계산
  let cum = 0;
  const withCum = result.map((r) => {
    cum += r.count;
    return { ...r, cumulative: cum };
  });

  return NextResponse.json({ trend: withCum });
}
