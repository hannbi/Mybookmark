// app/api/goals/monthly/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    year,
    month: month + 1,
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

// GET: 현재 달 목표/진행률 조회
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { year, month, start, end } = getMonthRange();

  // 목표 조회
  const { data: goalRow, error: goalError } = await supabase
    .from("monthly_goals")
    .select("target")
    .eq("user_id", user.id)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  if (goalError) {
    console.error("monthly_goals select error:", goalError);
  }

  // 이번 달 완독 수 계산
  const { count: finishedCount, error: finishedError } = await supabase
    .from("user_books")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "finished")
    .gte("finished_at", start)
    .lte("finished_at", end);

  if (finishedError) {
    console.error("user_books count error:", finishedError);
    return NextResponse.json(
      { error: "목표 데이터를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    year,
    month,
    target: goalRow?.target ?? null,
    progress: finishedCount ?? 0,
  });
}

// POST: 이번 달 목표 설정/수정
// body: { target: number }
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const targetRaw = body?.target;
  const target = Number(targetRaw);

  if (!Number.isFinite(target) || target < 0) {
    return NextResponse.json(
      { error: "목표 권수를 올바르게 입력해 주세요." },
      { status: 400 }
    );
  }

  const { year, month } = getMonthRange();

  const { error: upsertError } = await supabase
    .from("monthly_goals")
    .upsert(
      {
        user_id: user.id,
        year,
        month,
        target,
      },
      { onConflict: "user_id,year,month" }
    );

  if (upsertError) {
    console.error("monthly_goals upsert error:", upsertError);
    return NextResponse.json(
      { error: "목표를 저장하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, target });
}
