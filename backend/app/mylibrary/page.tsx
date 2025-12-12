// app/mylibrary/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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

export default function MyLibraryPage() {
  const router = useRouter();
  const { user, loading } = useSupabaseUser();
  const [displayName, setDisplayName] = useState<string | null>(null);

  const [items, setItems] = useState<LibraryItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 필터/정렬 상태
  const [statusFilter, setStatusFilter] = useState<
    "all" | "want" | "reading" | "finished"
  >("all");
  const [emotionFilter, setEmotionFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<"recent" | "title" | "started" | "finished">(
    "recent"
  );

  // 로그인 안 되어 있으면 로그인 페이지로
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

  // 내 서재 목록 불러오기
  useEffect(() => {
    if (!user) return;

    async function loadLibrary() {
      setListLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch("/api/user-books");
        const json = await res.json();
        if (!res.ok) {
          setErrorMsg(json.error ?? "내 서재를 불러오는 중 오류가 발생했습니다.");
          setItems([]);
        } else {
          setItems((json.items ?? []) as LibraryItem[]);
        }
      } catch (e) {
        setErrorMsg("네트워크 오류가 발생했습니다.");
        setItems([]);
      } finally {
        setListLoading(false);
      }
    }

    loadLibrary();
  }, [user]);

  // 사용 가능한 감정 태그 목록 (필터용) – hook 아님
  const emotionOptions: string[] = (() => {
    const set = new Set<string>();
    items.forEach((it) => {
      if (it.emotion_tag) set.add(it.emotion_tag);
    });
    return ["all", ...Array.from(set)];
  })();

  // 통계 계산
  const stats = useMemo(() => {
    const total = items.length;
    let want = 0,
      reading = 0,
      finished = 0;

    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth(); // 0–11

    let finishedThisYear = 0;
    let readingThisMonth = 0;

    for (const item of items) {
      if (item.status === "want") want++;
      if (item.status === "reading") reading++;
      if (item.status === "finished") finished++;

      if (item.finished_at) {
        const d = new Date(item.finished_at);
        if (d.getFullYear() === thisYear) {
          finishedThisYear++;
        }
      }

      if (item.status === "reading" && item.started_at) {
        const d = new Date(item.started_at);
        if (d.getFullYear() === thisYear && d.getMonth() === thisMonth) {
          readingThisMonth++;
        }
      }
    }

    return {
      total,
      want,
      reading,
      finished,
      finishedThisYear,
      readingThisMonth,
    };
  }, [items]);

  const statusCardClass = (status: "all" | "want" | "reading" | "finished") =>
    `rounded-lg border bg-white p-3 text-sm cursor-pointer transition ${
      statusFilter === status ? "ring-2 ring-amber-500 border-amber-500" : ""
    }`;

  // 필터 + 정렬 적용된 목록
  const filteredSortedItems = useMemo(() => {
    let result = [...items];

    // 상태 필터
    if (statusFilter !== "all") {
      result = result.filter((it) => it.status === statusFilter);
    }

    // 감정 필터
    if (emotionFilter !== "all") {
      result = result.filter((it) => it.emotion_tag === emotionFilter);
    }

    // 정렬
    result.sort((a, b) => {
      if (sortKey === "recent") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortKey === "title") {
        const ta = a.books?.title ?? "";
        const tb = b.books?.title ?? "";
        return ta.localeCompare(tb, "ko");
      }
      if (sortKey === "started") {
        const sa = a.started_at ? new Date(a.started_at).getTime() : 0;
        const sb = b.started_at ? new Date(b.started_at).getTime() : 0;
        return sb - sa; // 최근 시작일 우선
      }
      if (sortKey === "finished") {
        const fa = a.finished_at ? new Date(a.finished_at).getTime() : 0;
        const fb = b.finished_at ? new Date(b.finished_at).getTime() : 0;
        return fb - fa; // 최근 완료일 우선
      }
      return 0;
    });

    return result;
  }, [items, statusFilter, emotionFilter, sortKey]);

  // 여기서는 hook을 더 이상 호출하지 않음
  if (loading || (!user && typeof window !== "undefined")) {
    return (
      <main className="p-6">
        <p>로그인 상태 확인 중...</p>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <section className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Library</h1>
          <p className="text-sm text-zinc-600 mt-1">
            {(displayName ?? user?.email) ?? ""} 님의 서재입니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard"
            className="flex h-9 items-center rounded border px-3 text-xs bg-white hover:bg-zinc-50"
          >
            대시보드 보기
          </Link>
          <Link
            href="/quotes/liked"
            className="flex h-9 items-center rounded border px-3 text-xs bg-white hover:bg-zinc-50"
          >
            공감한 구절 모아보기
          </Link>
        </div>
      </section>

      {/* 간단 통계 카드 */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div
          className={statusCardClass("all")}
          onClick={() => setStatusFilter("all")}
        >
          <div className="text-xs text-zinc-500 mb-1">전체 책</div>
          <div className="text-xl font-semibold">{stats.total}</div>
        </div>
        <div
          className={statusCardClass("want")}
          onClick={() => setStatusFilter("want")}
        >
          <div className="text-xs text-zinc-500 mb-1">읽고 싶어요</div>
          <div className="text-xl font-semibold">{stats.want}</div>
        </div>
        <div
          className={statusCardClass("reading")}
          onClick={() => setStatusFilter("reading")}
        >
          <div className="text-xs text-zinc-500 mb-1">읽는 중</div>
          <div className="text-xl font-semibold">{stats.reading}</div>
          <div className="text-[11px] text-zinc-500 mt-1">
            이번 달 진행 중: {stats.readingThisMonth}
          </div>
        </div>
        <div
          className={statusCardClass("finished")}
          onClick={() => setStatusFilter("finished")}
        >
          <div className="text-xs text-zinc-500 mb-1">다 읽음</div>
          <div className="text-xl font-semibold">{stats.finished}</div>
          <div className="text-[11px] text-zinc-500 mt-1">
            올해 완독: {stats.finishedThisYear}
          </div>
        </div>
      </section>

      {/* 필터 / 정렬 컨트롤 */}
      <section className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600">상태</span>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as "all" | "want" | "reading" | "finished"
              )
            }
            className="border rounded px-2 py-1 text-xs bg-white"
          >
            <option value="all">전체</option>
            <option value="want">읽고 싶어요</option>
            <option value="reading">읽는 중</option>
            <option value="finished">다 읽음</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600">감정</span>
          <select
            value={emotionFilter}
            onChange={(e) => setEmotionFilter(e.target.value)}
            className="border rounded px-2 py-1 text-xs bg-white"
          >
            {emotionOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === "all" ? "전체" : opt}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-600">정렬</span>
          <select
            value={sortKey}
            onChange={(e) =>
              setSortKey(
                e.target.value as "recent" | "title" | "started" | "finished"
              )
            }
            className="border rounded px-2 py-1 text-xs bg-white"
          >
            <option value="recent">최근 추가순</option>
            <option value="title">제목순</option>
            <option value="started">시작일 최신순</option>
            <option value="finished">완료일 최신순</option>
          </select>
        </div>
      </section>

      {listLoading && <p className="text-sm text-zinc-500">불러오는 중...</p>}
      {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}

      {/* 필터/정렬 적용된 목록 */}
      <section className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSortedItems.map((item) => {
          const b = item.books;
          if (!b) return null;

          return (
            <Link
              key={item.book_id}
              href={`/book?bookId=${b.id}`}
              className="flex flex-row gap-3 rounded-md border bg-white p-3 text-xs hover:bg-zinc-50"
            >
              {b.cover && (
                <div className="w-24 sm:w-28 md:w-32 flex-shrink-0 overflow-hidden rounded-sm bg-zinc-100 flex items-center justify-center">
                  <img
                    src={b.cover}
                    alt={b.title}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}

              <div className="flex flex-1 flex-col justify-between gap-1">
                <div className="font-semibold line-clamp-2">{b.title}</div>
                <div className="text-[11px] text-zinc-600 line-clamp-1">
                  {b.author}
                </div>
                <div className="text-[11px] text-zinc-500 line-clamp-1">
                  {b.publisher}
                </div>
                <div className="text-[11px] text-zinc-500 line-clamp-1">
                  {b.category}
                </div>

                <div className="text-[11px] text-zinc-500 line-clamp-1">
                  {statusLabel(item.status)}
                </div>

                {item.emotion_tag && (
                  <div className="text-[11px] text-amber-700 line-clamp-1">
                    느낌: {item.emotion_tag}
                  </div>
                )}

                {(item.started_at || item.finished_at) && (
                  <div className="text-[11px] text-zinc-400 line-clamp-1">
                    {item.started_at && `시작: ${item.started_at} `}
                    {item.finished_at && `완료: ${item.finished_at}`}
                  </div>
                )}
              </div>
            </Link>
          );
        })}

        {!listLoading &&
          !errorMsg &&
          filteredSortedItems.length === 0 &&
          items.length > 0 && (
            <div className="col-span-2 text-xs text-zinc-500 md:col-span-4">
              선택한 필터에 해당하는 책이 없습니다.
            </div>
          )}

        {!listLoading && !errorMsg && items.length === 0 && (
          <div className="col-span-2 text-xs text-zinc-500 md:col-span-4">
            아직 내 서재에 추가한 책이 없습니다. 검색에서 책을 추가해 보세요.
          </div>
        )}
      </section>
    </main>
  );
}
