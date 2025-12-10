// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BookSearchSection from "@/components/BookSearchSection";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import RandomQuoteCard from "@/components/RandomQuoteCard";

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
  "#60a5fa",
  "#34d399",
  "#f97316",
  "#a855f7",
  "#facc15",
  "#f97373",
  "#14b8a6",
  "#fb7185",
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

  return (
    <main className="p-6 space-y-8">
      {/* 베스트셀러 & 도서 검색 */}
      <section>
        <h2 className="text-xl font-semibold mb-3">
          베스트셀러 & 도서 검색
        </h2>
        <BookSearchSection />
      </section>

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
          <h3 className="text-sm font-semibold">공감 많은 리뷰</h3>
          {topLiked.length === 0 && (
            <p className="text-[11px] text-zinc-500">
              아직 공감이 눌린 리뷰가 없습니다.
            </p>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {topLiked.map((r) => (
              <Link
                key={`top-${r.id}`}
                href={`/book?bookId=${r.books.id}`}
                className="flex gap-3 rounded-md border bg_white p-3 text-xs hover:bg-zinc-50"
              >
                <div className="flex flex-col gap-1">
                  <div className="font-semibold line-clamp-2">
                    {r.books.title}
                  </div>
                  <div className="text-[11px] text-zinc-600">
                    {r.profiles?.nickname ?? "익명"} · 공감{" "}
                    {r.likes_count ?? 0}
                  </div>
                  <p className="text-[11px] text-zinc-700 line-clamp-2">
                    {r.content}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 장르 트렌드 + 활동 랭킹 */}
      <section className="grid.grid-cols-1 gap-4 md:grid-cols-2">
        {/* 이달의 장르 트렌드 */}
        <div className="rounded-lg border bg-white p-4 text-sm">
          <h3 className="text-base font-semibold mb-2">이달의 장르 트렌드</h3>

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
            <div className="mt-2 space-y-2">
              <p className="text-[11px] text-zinc-500">
                이번 달 전체 사용자 완독 {genreTotal}권 기준 상위 5개 장르입니다.
              </p>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topGenres}
                      dataKey="count"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius="50%"
                      labelLine={false}
                      label={(entry: any) => {
                        const name = formatGenreLabel(entry?.payload?.category);
                        const count = entry?.payload?.count ?? 0;
                        return `${name}: ${count}권`;
                      }}
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
    </main>
  );
}
