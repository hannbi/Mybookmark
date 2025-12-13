// app/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Line,
} from "recharts";

type LibraryItem = {
  book_id: number;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  emotion_tag: string | null;
  created_at: string;
  books: {
    id: number;
    title: string;
    author: string | null;
    publisher: string | null;
    category: string | null;
    cover?: string | null;
  } | null;
};

function statusLabel(status?: string | null) {
  if (!status) return "상태 없음";
  if (status === "want") return "읽고 싶어요";
  if (status === "reading") return "읽는 중";
  if (status === "finished") return "다 읽음";
  return status;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useSupabaseUser();
  const [displayName, setDisplayName] = useState<string | null>(null);

  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [goalTarget, setGoalTarget] = useState<number | null>(null);
  const [goalProgress, setGoalProgress] = useState<number>(0);
  const [goalLoading, setGoalLoading] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [goalSaving, setGoalSaving] = useState(false);
  const [trend, setTrend] = useState<
    { month: string; count: number; cumulative: number }[]
  >([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendError, setTrendError] = useState<string | null>(null);

  const STATUS_COLORS = ["#d45c1f", "#e89456", "#f7d8c2"];

  // 로그인 체크
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
    if (user) {
      const supabase = createSupabaseBrowserClient();
      (async () => {
        try {
          const { data } = await supabase
            .from("profiles")
            .select("nickname")
            .eq("id", user.id)
            .maybeSingle();
          if (data?.nickname) {
            setDisplayName(data.nickname);
          } else {
            const meta =
              (user.user_metadata as any)?.nickname ||
              (user.user_metadata as any)?.full_name ||
              user.email;
            setDisplayName(meta);
          }
        } catch {
          setDisplayName(user?.email ?? null);
        }
      })();
    }
  }, [loading, user, router]);

  // 내 서재 데이터 가져오기
  useEffect(() => {
    if (!user) return;

    async function load() {
      setLoadingList(true);
      setErrorMsg(null);
      try {
        const res = await fetch("/api/user-books");
        const json = await res.json();

        if (!res.ok) {
          setErrorMsg(json.error ?? "서재 데이터를 불러오는 중 오류가 발생했습니다.");
          setItems([]);
        } else {
          setItems((json.items ?? []) as LibraryItem[]);
        }
      } catch (e) {
        setErrorMsg("네트워크 오류가 발생했습니다.");
        setItems([]);
      } finally {
        setLoadingList(false);
      }
    }

    load();
  }, [user]);

  // 월별 목표 로드
  useEffect(() => {
    async function loadGoal() {
      if (!user) return;
      setGoalLoading(true);
      setGoalError(null);
      try {
        const res = await fetch("/api/goals/monthly");
        const json = await res.json();
        if (!res.ok) {
          setGoalError(json.error ?? "목표를 불러오는 중 오류가 발생했습니다.");
          return;
        }
        setGoalTarget(
          typeof json.target === "number" ? json.target : null
        );
        setGoalProgress(typeof json.progress === "number" ? json.progress : 0);
      } catch {
        setGoalError("목표를 불러오는 중 네트워크 오류가 발생했습니다.");
      } finally {
        setGoalLoading(false);
      }
    }
    loadGoal();
  }, [user]);

  // 독서량 추세 로드
  useEffect(() => {
    async function loadTrend() {
      if (!user) return;
      setTrendLoading(true);
      setTrendError(null);
      try {
        const res = await fetch("/api/stats/reading-trend");
        const json = await res.json();
        if (!res.ok) {
          setTrendError(json.error ?? "독서량을 불러오는 중 오류가 발생했습니다.");
          return;
        }
        setTrend((json.trend ?? []) as typeof trend);
      } catch {
        setTrendError("독서량을 불러오는 중 네트워크 오류가 발생했습니다.");
      } finally {
        setTrendLoading(false);
      }
    }
    loadTrend();
  }, [user]);
  // 통계
  const stats = useMemo(() => {
    const total = items.length;
    let want = 0,
      reading = 0,
      finished = 0;

    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth(); // 0~11

    let finishedThisYear = 0;
    let finishedThisMonth = 0;
    let readingThisMonth = 0;

    const emotionCount = new Map<string, number>();

    for (const it of items) {
      if (it.status === "want") want++;
      if (it.status === "reading") reading++;
      if (it.status === "finished") finished++;

      if (it.finished_at) {
        const d = new Date(it.finished_at);
        if (d.getFullYear() === thisYear) {
          finishedThisYear++;
          if (d.getMonth() === thisMonth) {
            finishedThisMonth++;
          }
        }
      }

      if (it.status === "reading" && it.started_at) {
        const d = new Date(it.started_at);
        if (d.getFullYear() === thisYear && d.getMonth() === thisMonth) {
          readingThisMonth++;
        }
      }

      if (it.emotion_tag) {
        emotionCount.set(
          it.emotion_tag,
          (emotionCount.get(it.emotion_tag) ?? 0) + 1
        );
      }
    }

    // 감정 태그 상위 3개
    const topEmotions = Array.from(emotionCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag, count]) => ({ tag, count }));

    return {
      total,
      want,
      reading,
      finished,
      finishedThisYear,
      finishedThisMonth,
      readingThisMonth,
      topEmotions,
    };
  }, [items]);

  // 최근 추가한 책 5개
  const recentAdded = useMemo(() => {
    return [...items]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5);
  }, [items]);

  // 최근 완독한 책 5개
  const recentFinished = useMemo(() => {
    return items
      .filter((it) => it.finished_at)
      .sort(
        (a, b) =>
          new Date(b.finished_at || 0).getTime() -
          new Date(a.finished_at || 0).getTime()
      )
      .slice(0, 5);
  }, [items]);

  async function handleSaveGoal() {
    if (goalTarget === null || goalTarget < 0) {
      alert("목표 권수를 올바르게 입력해 주세요.");
      return;
    }
    setGoalSaving(true);
    setGoalError(null);
    try {
      const res = await fetch("/api/goals/monthly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: goalTarget }),
      });
      const json = await res.json();
      if (!res.ok) {
        setGoalError(json.error ?? "목표 저장에 실패했습니다.");
        return;
      }
      setGoalTarget(json.target ?? goalTarget);
    } catch {
      setGoalError("목표 저장 중 네트워크 오류가 발생했습니다.");
    } finally {
      setGoalSaving(false);
    }
  }

  if (loading || (!user && typeof window !== "undefined")) {
    return (
      <main className="p-6">
        <p>로그인 상태 확인 중...</p>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-8">
      <section className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">독서 대시보드</h1>
          <p className="text-sm text-zinc-600 mt-1">
            {(displayName ?? user?.email) ?? ""} 님의 독서 활동 요약입니다.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <Link
            href="/mylibrary"
            className="flex h-9 items-center rounded border px-3 bg-white hover:bg-zinc-50"
          >
            내 서재 보기
          </Link>
          <Link
            href="/quotes/liked"
            className="flex h-9 items-center rounded border px-3 bg-white hover:bg-zinc-50"
          >
            공감한 구절 모아보기
          </Link>
        </div>
      </section>

      {/* 상단 요약 카드 */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-3 text-sm">
          <div className="text-xs text-zinc-500 mb-1">전체 책 수</div>
          <div className="text-2xl font-semibold">{stats.total}</div>
        </div>
        <div className="rounded-lg border bg-white p-3 text-sm">
          <div className="text-xs text-zinc-500 mb-1">읽고 싶어요</div>
          <div className="text-2xl font-semibold">{stats.want}</div>
        </div>
        <div className="rounded-lg border bg-white p-3 text-sm">
          <div className="text-xs text-zinc-500 mb-1">읽는 중</div>
          <div className="text-2xl font-semibold">{stats.reading}</div>
          <div className="text-[11px] text-zinc-500 mt-1">
            이번 달 시작한 책: {stats.readingThisMonth}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-3 text-sm">
          <div className="text-xs text-zinc-500 mb-1">다 읽은 책</div>
          <div className="text-2xl font-semibold">{stats.finished}</div>
          <div className="text-[11px] text-zinc-500 mt-1">
            올해 완독: {stats.finishedThisYear} / 이번 달 완독:{" "}
            {stats.finishedThisMonth}
          </div>
        </div>
      </section>

      {/* 감정 태그 요약 */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 text-sm space-y-2">
          <h2 className="text-base font-semibold">자주 느낀 감정 TOP 3</h2>
          {stats.topEmotions.length === 0 && (
            <p className="text-xs text-zinc-500">
              아직 감정 태그를 남긴 책이 없습니다. 책 상세 페이지에서 감정을
              선택해 보세요.
            </p>
          )}
          {stats.topEmotions.length > 0 && (
            <ul className="space-y-1">
              {stats.topEmotions.map((e) => (
                <li
                  key={e.tag}
                  className="flex items-center justify-between rounded border px-2 py-1 bg-zinc-50"
                >
                  <span>{e.tag}</span>
                  <span className="text-xs text-zinc-600">{e.count}권</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border bg-white p-4 text-sm space-y-2">
          <h2 className="text-base font-semibold">상태별 비율</h2>
          {stats.total === 0 ? (
            <p className="text-xs text-zinc-500">
              아직 서재에 책이 없습니다. 먼저 책을 추가해 보세요.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.1fr_0.9fr] items-center">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "읽고 싶어요", value: stats.want },
                        { name: "읽는 중", value: stats.reading },
                        { name: "다 읽음", value: stats.finished },
                      ]}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="65%"
                    labelLine={false}
                    label={false}
                  >
                      {[stats.want, stats.reading, stats.finished].map((_, idx) => (
                        <Cell
                          key={`status-slice-${idx}`}
                          fill={STATUS_COLORS[idx % STATUS_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `${value}권`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { name: "읽고 싶어요", value: stats.want, color: STATUS_COLORS[0] },
                  { name: "읽는 중", value: stats.reading, color: STATUS_COLORS[1] },
                  { name: "다 읽음", value: stats.finished, color: STATUS_COLORS[2] },
                ].map((row) => {
                  const percent =
                    stats.total > 0 ? Math.round((row.value / stats.total) * 100) : 0;
                  return (
                    <div
                      key={row.name}
                      className="flex items-center justify-between rounded border bg-zinc-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-sm"
                          style={{ backgroundColor: row.color }}
                        />
                        <span>{row.name}</span>
                      </div>
                      <div className="text-zinc-600">
                        {row.value}권 ({percent}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 이번 달 목표 */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 text-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">이번 달 목표</h2>
            <span className="text-xs text-zinc-500">자동 진행률 집계</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              className="w-28 rounded border px-2 py-1 text-sm"
              value={goalTarget ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setGoalTarget(v === "" ? null : Number(v));
              }}
              placeholder="목표 권수"
            />
            <button
              type="button"
              onClick={handleSaveGoal}
              disabled={goalSaving || goalTarget === null || goalTarget < 0}
              className="rounded border px-3 py-1 text-xs bg-white hover:bg-zinc-50 disabled:opacity-60"
            >
              {goalSaving ? "저장 중..." : "목표 저장"}
            </button>
          </div>
          {goalLoading && (
            <p className="text-xs text-zinc-500">목표를 불러오는 중...</p>
          )}
          {goalError && (
            <p className="text-xs text-red-500">{goalError}</p>
          )}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-zinc-600">
              <span>진행률</span>
              <span>
                {goalProgress} / {goalTarget ?? "-"} 권
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded bg-zinc-100">
              <div
                className="h-full bg-amber-500 transition-all"
                style={{
                  width:
                    goalTarget && goalTarget > 0
                      ? `${Math.min(
                          100,
                          Math.round((goalProgress / goalTarget) * 100)
                        )}%`
                      : "0%",
                }}
              />
            </div>
            {goalTarget && goalTarget > 0 && goalProgress >= goalTarget && (
              <p className="text-xs text-emerald-600">🎉 목표 달성!</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 text-sm space-y-2">
          <h2 className="text-base font-semibold">월별 독서량</h2>
          {trendLoading && (
            <p className="text-xs text-zinc-500">독서량을 불러오는 중...</p>
          )}
          {trendError && (
            <p className="text-xs text-red-500">{trendError}</p>
          )}
          {!trendLoading && trend.length === 0 && (
            <p className="text-xs text-zinc-500">
              아직 완독한 책이 없습니다.
            </p>
          )}
          {trend.length > 0 && (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="완독 권수" fill="#e1772d" />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    name="누적 완독"
                    stroke="#d45c1f"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* 최근 활동 */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 text-sm space-y-2">
          <h2 className="text-base font-semibold">최근 추가한 책</h2>
          {recentAdded.length === 0 && (
            <p className="text-xs text-zinc-500">
              서재에 추가한 책이 없습니다. 검색에서 책을 추가해 보세요.
            </p>
          )}
          <ul className="space-y-1">
            {recentAdded.map((it) => {
              const b = it.books;
              if (!b) return null;
              return (
                <li key={it.book_id}>
                  <Link
                    href={`/book?bookId=${b.id}`}
                    className="flex justify-between rounded px-2 py-1 hover:bg-zinc-50"
                  >
                    <div className="truncate">
                      <div className="font-medium text-xs truncate">
                        {b.title}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate">
                        {b.author}
                      </div>
                    </div>
                    <span className="text-[11px] text-zinc-500">
                      {new Date(it.created_at).toISOString().slice(0, 10)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-lg border bg-white p-4 text-sm space-y-2">
          <h2 className="text-base font-semibold">최근 완독한 책</h2>
          {recentFinished.length === 0 && (
            <p className="text-xs text-zinc-500">
              아직 완독한 책이 없습니다. 읽는 중인 책을 끝까지 읽어 보세요.
            </p>
          )}
          <ul className="space-y-1">
            {recentFinished.map((it) => {
              const b = it.books;
              if (!b) return null;
              return (
                <li key={it.book_id}>
                  <Link
                    href={`/book?bookId=${b.id}`}
                    className="flex justify-between rounded px-2 py-1 hover:bg-zinc-50"
                  >
                    <div className="truncate">
                      <div className="font-medium text-xs truncate">
                        {b.title}
                      </div>
                      <div className="text-[11px] text-zinc-500 truncate">
                        {b.author}
                      </div>
                    </div>
                    <span className="text-[11px] text-zinc-500">
                      {it.finished_at &&
                        new Date(it.finished_at)
                          .toISOString()
                          .slice(0, 10)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {loadingList && (
        <p className="text-sm text-zinc-500">데이터를 불러오는 중...</p>
      )}
      {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}
    </main>
  );
}
