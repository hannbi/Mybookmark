// app/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";

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

  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 로그인 체크
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
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

  if (loading || (!user && typeof window !== "undefined")) {
    return (
      <main className="p-6">
        <p>로그인 상태 확인 중...</p>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-8">
      <section className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">독서 대시보드</h1>
          <p className="text-sm text-zinc-600 mt-1">
            {user?.email} 님의 독서 활동 요약입니다.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <Link
            href="/mylibrary"
            className="rounded border px-3 py-1 bg-white hover:bg-zinc-50"
          >
            내 서재 보기
          </Link>
          <Link
            href="/"
            className="rounded border px-3 py-1 bg-white hover:bg-zinc-50"
          >
            책 검색하기
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
            <ul className="space-y-1">
              <li className="flex justify-between">
                <span>읽고 싶어요</span>
                <span className="text-xs text-zinc-600">
                  {stats.want}권 (
                  {Math.round((stats.want / stats.total) * 100)}
                  %)
                </span>
              </li>
              <li className="flex justify-between">
                <span>읽는 중</span>
                <span className="text-xs text-zinc-600">
                  {stats.reading}권 (
                  {Math.round((stats.reading / stats.total) * 100)}
                  %)
                </span>
              </li>
              <li className="flex justify-between">
                <span>다 읽음</span>
                <span className="text-xs text-zinc-600">
                  {stats.finished}권 (
                  {Math.round((stats.finished / stats.total) * 100)}
                  %)
                </span>
              </li>
            </ul>
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
                      <span className="font-medium text-xs">
                        {b.title}
                      </span>
                      <span className="text-[11px] text-zinc-500 ml-1">
                        {b.author}
                      </span>
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
                      <span className="font-medium text-xs">
                        {b.title}
                      </span>
                      <span className="text-[11px] text-zinc-500 ml-1">
                        {b.author}
                      </span>
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
