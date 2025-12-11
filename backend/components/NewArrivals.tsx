// components/NewArrivals.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type NewBook = {
  id: number | null;
  title: string;
  author: string | null;
  cover: string | null;
};

export default function NewArrivals() {
  const [books, setBooks] = useState<NewBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [page, setPage] = useState(0); // 0-based, 4개씩

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch("/api/books/new");
        const json = await res.json();
        if (!res.ok) {
          setBooks([]);
          setErrorMsg(json.error ?? "신간 정보를 불러오는 중 오류가 발생했습니다.");
        } else {
          setBooks((json.books ?? []).slice(0, 12));
          setPage(0);
        }
      } catch (e) {
        console.error("new arrivals fetch error:", e);
        setBooks([]);
        setErrorMsg("네트워크 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span role="img" aria-label="sparkles">
            ✨
          </span>
          이번주 신간
        </h2>
        <p className="text-xs text-zinc-500">새롭게 출간된 책을 만나보세요.</p>
      </div>

      {loading && (
        <p className="text-xs text-zinc-500">신간을 불러오는 중...</p>
      )}
      {errorMsg && !loading && (
        <p className="text-xs text-red-500">{errorMsg}</p>
      )}

      {/* 4개씩 페이지 네이션 */}
      <div className="relative rounded-xl border bg-white p-3">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {books.slice(page * 4, page * 4 + 4).map((b, idx) => {
            const key = `${b.id ?? b.title}-${idx}-${page}`;
            const card = (
              <div className="flex flex-col items-center gap-2 rounded-lg bg-white p-2 text-sm shadow-sm">
                <div className="w-full overflow-hidden rounded-md bg-zinc-100 flex items-center justify-center aspect-[3/4]">
                  {b.cover && (
                    <img
                      src={b.cover}
                      alt={b.title}
                      className="h-full w-full object-contain"
                    />
                  )}
                </div>
                <div className="w-full text-xs font-semibold line-clamp-2 text-center">
                  {b.title}
                </div>
              </div>
            );
            if (b.id) {
              return (
                <Link key={key} href={`/book?bookId=${b.id}`}>
                  {card}
                </Link>
              );
            }
            return (
              <div key={key} className="opacity-80">
                {card}
              </div>
            );
          })}
        </div>

        {!loading && !errorMsg && books.length === 0 && (
          <div className="w-full text-xs text-zinc-500 px-2 py-4">
            아직 신간 정보를 불러오지 못했습니다.
          </div>
        )}

        {/* 좌우 화살표 */}
        {books.length > 4 && (
          <>
            {page > 0 && (
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white shadow px-2 py-2 text-sm font-bold"
                aria-label="이전"
              >
                ‹
              </button>
            )}
            {page < Math.ceil(books.length / 4) - 1 && (
              <button
                type="button"
                onClick={() =>
                  setPage((p) => Math.min(Math.ceil(books.length / 4) - 1, p + 1))
                }
                className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white shadow px-2 py-2 text-sm font-bold"
                aria-label="다음"
              >
                ›
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
