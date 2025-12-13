// components/WeeklyBestsellers.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BestSellerBook = {
  id: number | null;
  title: string;
  author: string | null;
  publisher: string | null;
  category: string | null;
  isbn: string | null;
  cover: string | null;
  description?: string | null;
  rank: number | null;
};

export default function WeeklyBestsellers() {
  const [books, setBooks] = useState<BestSellerBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch("/api/books/bestsellers");
        const json = await res.json();

        if (!res.ok) {
          setBooks([]);
          setErrorMsg(json.error ?? "베스트셀러를 불러오는 중 오류가 발생했습니다.");
          return;
        }

        setBooks((json.books ?? []) as BestSellerBook[]);
      } catch (e) {
        console.error("bestsellers fetch error:", e);
        setErrorMsg("네트워크 오류가 발생했습니다.");
        setBooks([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const displayBooks = showAll ? books.slice(0, 12) : books.slice(0, 4);

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Weekly
        </p>
        <h2 className="text-xl font-semibold">Best Sellers</h2>
        <p className="text-xs text-zinc-500">
          이번 주 베스트셀러를 확인해 보세요.
        </p>
      </header>

      {loading && (
        <p className="text-xs text-zinc-500">베스트셀러를 불러오는 중...</p>
      )}
      {errorMsg && !loading && (
        <p className="text-xs text-red-500">{errorMsg}</p>
      )}

      <div
        className="rounded-xl border bg-gradient-to-b from-zinc-50 to-amber-50/30 p-4 transition-all duration-300"
      >
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {displayBooks.map((b, idx) => {
            const cardContent = (
              <>
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="truncate">{b.category ?? "분류 없음"}</span>
                  {b.rank && (
                    <span className="rounded-full bg-amber-100 px-2 py-[2px] text-[10px] text-amber-700 font-semibold">
                      #{b.rank}
                    </span>
                  )}
                </div>
                {b.cover && (
                  <div className="w-full overflow-hidden rounded-md bg-white shadow-sm flex items-center justify-center aspect-[3/4]">
                    <img
                      src={b.cover}
                      alt={b.title}
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
                <div className="font-semibold line-clamp-2">{b.title}</div>
                <div className="text-[11px] text-zinc-600 line-clamp-1">
                  {b.author}
                </div>
                <div className="text-[11px] text-zinc-500 line-clamp-1">
                  {b.publisher}
                </div>
              </>
            );

            const key = `${b.isbn ?? b.title}-${idx}`;

            if (b.id) {
              return (
                <Link
                  key={key}
                  href={`/book?bookId=${b.id}`}
                  className="flex flex-col gap-2 rounded-lg bg-white p-3 text-xs shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  {cardContent}
                </Link>
              );
            }

            return (
              <div
                key={key}
                className="flex flex-col gap-2 rounded-lg bg-white p-3 text-xs opacity-80"
                title="상세 페이지 정보를 준비 중입니다."
              >
                {cardContent}
              </div>
            );
          })}

          {!loading && !errorMsg && books.length === 0 && (
            <div className="col-span-2 text-xs text-zinc-500 md:col-span-4">
              아직 베스트셀러 정보를 불러오지 못했습니다.
            </div>
          )}
        </div>
      </div>

      {books.length > 4 && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="rounded border border-amber-500 px-4 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
          >
            {showAll ? "VIEW LESS" : "VIEW ALL"}
          </button>
        </div>
      )}
    </section>
  );
}
