// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BookSearchSection from "@/components/BookSearchSection";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import RandomQuoteCard from "@/components/RandomQuoteCard";
import WeeklyBestsellers from "@/components/WeeklyBestsellers";
import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";
import NewArrivals from "@/components/NewArrivals";

type FeedReview = {
  id: number;
  book_id: number;
  user_id: string;
  content: string;
  rating: number;
  likes_count: number | null;
  created_at: string;
  books: {
    id: number;
    title: string;
    author: string | null;
    cover: string | null;
  };
  profiles: {
    id: string;
    nickname: string;
  };
};

type GenreStat = {
  category: string;
  count: number;
};

const GENRE_COLORS = [
  "#d45c1f",
  "#e1772d",
  "#e89456",
  "#f0b98a",
  "#f7d8c2",
  "#f9e8dc",
];

// 장르 라벨 줄이기
function formatGenreLabel(raw: string | null | undefined) {
  if (!raw) return "기타";
  const parts = raw.split(">");
  const last = (parts[parts.length - 1] || raw).trim();
  const maxLen = 8;
  return last.length > maxLen ? last.slice(0, maxLen) + "…" : last;
}

export default function HomePage() {
  // 리뷰 피드 상태
  const [latest, setLatest] = useState<FeedReview[]>([]);
  const [topLiked, setTopLiked] = useState<FeedReview[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);

  // 장르 통계 상태
  const [genreStats, setGenreStats] = useState<GenreStat[]>([]);
  const [genreTotal, setGenreTotal] = useState(0);
  const [genreLoading, setGenreLoading] = useState(false);
  const [genreError, setGenreError] = useState<string | null>(null);

  const { user } = useSupabaseUser();

  // 리뷰 피드 로딩
  useEffect(() => {
    async function loadFeed() {
      setLoadingFeed(true);
      setFeedError(null);
      try {
        const res = await fetch("/api/reviews/feed");
        const json = await res.json();

        if (!res.ok) {
          console.error("reviews feed error:", json);
          setFeedError(
            json.error ?? "리뷰 피드를 불러오는 중 오류가 발생했습니다."
          );
          setLatest([]);
          setTopLiked([]);
        } else {
          setLatest((json.latest ?? []) as FeedReview[]);
          setTopLiked((json.topLiked ?? []) as FeedReview[]);
        }
      } catch (e) {
        console.error("reviews feed fetch error:", e);
        setFeedError("네트워크 오류가 발생했습니다.");
        setLatest([]);
        setTopLiked([]);
      } finally {
        setLoadingFeed(false);
      }
    }

    loadFeed();
  }, []);

  // 장르 통계 로딩
  useEffect(() => {
    async function loadGenres() {
      setGenreLoading(true);
      setGenreError(null);
      try {
        const res = await fetch("/api/stats/genres");
        const json = await res.json();

        if (res.status === 401) {
          setGenreError("로그인하면 이번 달 나의 장르 통계를 볼 수 있습니다.");
          setGenreStats([]);
          setGenreTotal(0);
          return;
        }

        if (!res.ok) {
          console.error("genre stats error:", json);
          setGenreError(
            json.error ?? "장르 통계를 불러오는 중 오류가 발생했습니다."
          );
          setGenreStats([]);
          setGenreTotal(0);
        } else {
          setGenreStats((json.genres ?? []) as GenreStat[]);
          setGenreTotal(json.totalFinishedThisMonth ?? 0);
        }
      } catch (e) {
        console.error("genre stats fetch error:", e);
        setGenreError("네트워크 오류가 발생했습니다.");
        setGenreStats([]);
        setGenreTotal(0);
      } finally {
        setGenreLoading(false);
      }
    }

    loadGenres();
  }, []);

  // 상위 5개 장르
  const topGenres = [...genreStats]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 공감 많은 리뷰 캐러셀 상태
  const [slideIndex, setSlideIndex] = useState(0);

  // 자동 슬라이드
  useEffect(() => {
    if (topLiked.length <= 1) return;
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % topLiked.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [topLiked.length]);

  return (
    <main className="p-6 space-y-8">
      {/* 도서 검색 */}
      <section>
        <BookSearchSection />
      </section>

      {/* 이번 주 베스트셀러 */}
      <WeeklyBestsellers />

      {/* 최근 리뷰 */}
      <section className="space-y-3">
        <div className="flex items-center justify_between">
          <h2 className="text-xl font-semibold">최근 리뷰</h2>
        </div>

        {loadingFeed && (
          <p className="text-xs text-zinc-500">리뷰를 불러오는 중...</p>
        )}
        {feedError && !loadingFeed && (
          <p className="text-xs text-red-500">{feedError}</p>
        )}

        {!loadingFeed && !feedError && latest.length === 0 && (
          <p className="text-xs text-zinc-500">
            아직 등록된 리뷰가 없습니다. 첫 리뷰를 남겨보세요!
          </p>
        )}

        {/* 최신 리뷰 리스트 */}
        <div className="grid gap-3 md:grid-cols-2">
          {latest.map((r) => (
            <Link
              key={`latest-${r.id}`}
              href={`/book?bookId=${r.books.id}`}
              className="flex gap-3 rounded-md border bg-white p-3 text-xs hover:bg-zinc-50"
            >
              {r.books.cover && (
                <div className="h-20 w-16 flex-shrink-0 overflow-hidden rounded-sm bg-zinc-100">
                  <img
                    src={r.books.cover}
                    alt={r.books.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1">
                <div className="font-semibold line-clamp-2">
                  {r.books.title}
                </div>
                <div className="text-[11px] text-zinc-600 line-clamp-1">
                  {r.books.author}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                  <span>{r.profiles?.nickname ?? "익명"}</span>
                  <span>|</span>
                  <span>
                    {"★".repeat(r.rating)}
                    {"☆".repeat(5 - r.rating)}
                  </span>
                  <span>| 공감 {r.likes_count ?? 0}</span>
                </div>
                <p className="text-[11px] text-zinc-700 line-clamp-2">
                  {r.content}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* 공감 많은 리뷰 */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-3">
            <h3 className="text-sm font-semibold">공감 많은 리뷰</h3>
            <p className="text-[11px] text-zinc-500">
              독자들이 가장 공감한 리뷰를 모았어요.
            </p>
          </div>
          {topLiked.length === 0 && (
            <p className="text-[11px] text-zinc-500">
              아직 공감이 눌린 리뷰가 없습니다.
            </p>
          )}

          {topLiked.length > 0 && (
            <div className="relative overflow-hidden rounded-md border bg-white p-3">
              <div className="relative h-[300px] overflow-hidden">
                {[-1, 0, 1].map((offset) => {
                  const idx =
                    (slideIndex + offset + topLiked.length) % topLiked.length;
                  const r = topLiked[idx];
                  const isActive = offset === 0;
                  const opacity = isActive ? 1 : 0.7;
                  const scale = isActive ? 1 : 0.92;
                  const translateX = offset * 115; // 좌우 위치

                  return (
                    <div
                      key={`top-${r.id}-pos-${offset}`}
                      className="absolute left-1/2 top-1/2 w-[340px] sm:w-[380px] lg:w-[420px] h-[250px]"
                      style={{
                        opacity,
                        transform: `translate(-50%, -50%) translateX(${translateX}%) scale(${scale})`,
                        transition: "transform 500ms ease, opacity 500ms ease",
                        transformOrigin: "center center",
                      }}
                    >
                      <div className="flex h-full items-stretch gap-3 rounded-lg border bg-white p-3 shadow-sm">
                        {r.books.cover && (
                          <div className="w-40 flex-shrink-0 overflow-hidden rounded-md bg-zinc-100 h-full">
                            <img
                              src={r.books.cover}
                              alt={r.books.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex min-h-[150px] flex-1 flex-col justify-between">
                          <div className="flex flex-col gap-1 text-sm">
                            <div className="font-semibold line-clamp-2">
                              {r.books.title}
                            </div>
                            <div className="text-[11px] text-zinc-600">
                              {(r.books.author ?? "").split(/[,(]/)[0]?.trim()}
                            </div>
                            <div className="mt-1 space-y-1 border-l border-zinc-400 pl-3">
                              <p className="text-[12px] text-zinc-700 line-clamp-3 leading-relaxed">
                                {`“${r.content}”`}
                              </p>
                              <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                                <span>
                                  {new Date(r.created_at)
                                    .toISOString()
                                    .slice(0, 10)}
                                </span>
                                <span>{r.profiles?.nickname ?? "익명"}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-amber-600">
                                <span>공감</span>
                                <span>{r.likes_count ?? 0}</span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                            <Link
                              href={`/book?bookId=${r.books.id}`}
                              className="rounded border border-amber-500 px-2 py-1 text-amber-600 hover:bg-amber-50"
                            >
                              리뷰 더보기
                            </Link>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!user) {
                                  alert("로그인 후 사용할 수 있습니다.");
                                  return;
                                }
                                try {
                                  await fetch("/api/user-books", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      bookId: r.books.id,
                                      status: "want",
                                    }),
                                  });
                                  alert("읽고 싶은 책으로 추가했습니다.");
                                } catch (e) {
                                  alert("추가 중 오류가 발생했습니다.");
                                }
                              }}
                              className="rounded border border-emerald-600 px-2 py-1 text-emerald-700 hover:bg-emerald-50"
                            >
                              읽고 싶은 책
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 인디케이터 */}
              <div className="mt-3 flex items-center justify-center gap-2">
                {topLiked.map((_, idx) => (
                  <button
                    key={`dot-${idx}`}
                    onClick={() => setSlideIndex(idx)}
                    className={`h-2.5 w-2.5 rounded-full transition ${
                      slideIndex === idx
                        ? "bg-amber-500"
                        : "bg-zinc-300 hover:bg-zinc-400"
                    }`}
                    aria-label={`리뷰 ${idx + 1}번 보기`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 장르 트렌드 + 활동 랭킹 */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* 이달의 장르 트렌드 */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm text-sm">
          <div className="mb-3 space-y-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span role="img" aria-label="books">
                📚
              </span>
              이달의 장르 트렌드
            </h3>
            <p className="text-xs text-zinc-500">
              이번 달 독자들이 선택한 장르 비율을 보여줘요.
            </p>
          </div>

          {genreLoading && (
            <p className="text-xs text-zinc-500">장르 통계를 불러오는 중...</p>
          )}

          {genreError && !genreLoading && (
            <p className="text-xs text-red-500">{genreError}</p>
          )}

          {!genreLoading && !genreError && genreStats.length === 0 && (
            <p className="text-xs text-zinc-500">
              이번 달에 완독된 책이 아직 없거나, 통계에 포함될 데이터가
              없습니다.
            </p>
          )}

          {!genreLoading && !genreError && topGenres.length > 0 && (
            <div className="mt-3 grid gap-4 lg:grid-cols-[1.2fr_1fr] items-center">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topGenres}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius="60%"
                      stroke="#f8f7f5"
                      strokeWidth={2}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {topGenres.map((entry, index) => (
                        <Cell
                          key={`genre-slice-${entry.category}-${index}`}
                          fill={GENRE_COLORS[index % GENRE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, _name, props: any) => [
                        `${value}권`,
                        formatGenreLabel(props?.payload?.category),
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                {topGenres.map((g, idx) => (
                  <div
                    key={`legend-${g.category}-${idx}`}
                    className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-4 w-4 rounded-sm"
                        style={{
                          backgroundColor: GENRE_COLORS[idx % GENRE_COLORS.length],
                        }}
                      />
                      <span className="text-sm font-medium">
                        {formatGenreLabel(g.category)}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-600">{g.count}권</span>
                  </div>
                ))}
                <p className="text-[11px] text-zinc-500">
                  이번 달 완독 {genreTotal}권 기준 상위 장르입니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 활동 랭킹 카드 */}
        <div className="rounded-lg border bg-white p-4 text-sm">
          <h3 className="text-base font-semibold mb-2">활동 랭킹</h3>
          <p className="text-xs text-zinc-500">
            완독 수 / 공감 / 리뷰 수 기반 랭킹 영역 (추후 구현 예정)
          </p>
        </div>
      </section>

      {/* 책 속 한 구절 */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">책 속 한 구절</h2>
        <RandomQuoteCard />
      </section>

      {/* 이번주 신간 */}
      <NewArrivals />
    </main>
  );
}
