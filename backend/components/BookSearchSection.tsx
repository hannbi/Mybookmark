// components/BookSearchSection.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

type Book = {
  id: number;                 // 이제 반드시 필요
  title: string;
  author: string | null;
  publisher: string | null;
  category: string | null;
  isbn?: string | null;
  cover?: string | null;
};

export default function BookSearchSection() {
  const [keyword, setKeyword] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function searchBooks(search: string) {
    const q = search.trim();
    if (!q) {
      setBooks([]);
      setErrorMsg(null);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(
        `/api/books/search?q=${encodeURIComponent(q)}`
      );
      const json = await res.json();

      if (!res.ok) {
        console.error("Search API error:", json.error);
        setBooks([]);
        setErrorMsg(json.error ?? "검색 중 오류가 발생했습니다.");
      } else {
        setBooks((json.books ?? []) as Book[]);
      }
    } catch (e) {
      console.error("Fetch error:", e);
      setBooks([]);
      setErrorMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    searchBooks(keyword);
  }

  return (
    <section className="space-y-4">

      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="제목/저자/키워드로 책 검색"
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button
          type="submit"
          className="whitespace-nowrap rounded-md border px-3 py-2 text-sm"
        >
          검색
        </button>
      </form>

      {loading && (
        <p className="text-xs text-zinc-500">
          알라딘에서 도서 정보를 불러오는 중...
        </p>
      )}
      {errorMsg && !loading && (
        <p className="text-xs text-red-500">{errorMsg}</p>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {books.map((book) => (
          <Link
            key={book.id}
            href={`/book?bookId=${book.id}`}
            className="flex h-40 flex-col justify-between rounded-md border p-2 text-xs hover:bg-zinc-50"
          >
            {book.cover && (
              <div className="mb-1 h-20 overflow-hidden rounded-sm bg-zinc-100">
                <img
                  src={book.cover}
                  alt={book.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="font-semibold line-clamp-2">{book.title}</div>
            <div className="text-[11px] text-zinc-600 line-clamp-1">
              {book.author}
            </div>
            <div className="text-[11px] text-zinc-500 line-clamp-1">
              {book.publisher}
            </div>
            <div className="text-[11px] text-zinc-500 line-clamp-1">
              {book.category}
            </div>
          </Link>
        ))}

        {!loading && !errorMsg && books.length === 0 && keyword && (
          <div className="col-span-2 text-xs text-zinc-500 md:col-span-4">
            검색 결과가 없습니다.
          </div>
        )}
      </div>
    </section>
  );
}
