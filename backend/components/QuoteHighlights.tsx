// components/QuoteHighlights.tsx
"use client";

import type { MouseEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";

type HighlightQuote = {
  id: number;
  content: string;
  created_at: string;
  nickname: string;
  likes_count: number;
  comments_count?: number;
  book: {
    id: number;
    title: string;
    author: string | null;
  } | null;
};

export default function QuoteHighlights() {
  const [quotes, setQuotes] = useState<HighlightQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [likingId, setLikingId] = useState<number | null>(null);
  const { user } = useSupabaseUser();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch("/api/quotes/highlight");
        const json = await res.json();
        if (!res.ok) {
          setQuotes([]);
          setErrorMsg(json.error ?? "인용문을 불러오는 중 오류가 발생했습니다.");
        } else {
          setQuotes((json.quotes ?? []) as HighlightQuote[]);
        }
      } catch (e) {
        console.error("quote highlight fetch error:", e);
        setErrorMsg("네트워크 오류가 발생했습니다.");
        setQuotes([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleCardOpen(quote: HighlightQuote) {
    const bookId = quote.book?.id;
    if (!bookId) return;
    router.push(`/book?bookId=${bookId}`);
  }

  function handleCommentClick(e: MouseEvent, quote: HighlightQuote) {
    e.stopPropagation();
    const bookId = quote.book?.id;
    if (!bookId) return;
    router.push(`/book?bookId=${bookId}&focus=quote-comments&quoteId=${quote.id}`);
  }

  async function handleLike(id: number) {
    if (!user) {
      alert("로그인 후 공감할 수 있습니다.");
      return;
    }
    setLikingId(id);
    try {
      const res = await fetch("/api/quote-likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote_id: id }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error ?? "공감 처리 중 오류가 발생했습니다.");
        return;
      }
      const likes =
        typeof json.likes_count === "number"
          ? json.likes_count
          : typeof json.likesCount === "number"
          ? json.likesCount
          : null;

      setQuotes((prev) =>
        prev.map((q) =>
          q.id === id
            ? { ...q, likes_count: likes !== null ? likes : q.likes_count }
            : q
        )
      );
    } catch (e) {
      alert("공감 처리 중 오류가 발생했습니다.");
    } finally {
      setLikingId(null);
    }
  }

  const rows = [
    quotes.slice(0, 3),
    quotes.slice(3, 6),
  ].filter((row) => row.length > 0);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span role="img" aria-label="quote">
            💬
          </span>
          책 속 한 구절
        </h2>
        <p className="text-xs text-zinc-500">
          독자들이 공유한 책 속 문장을 둘러보세요.
        </p>
      </div>

      {loading && (
        <p className="text-xs text-zinc-500">불러오는 중...</p>
      )}
      {errorMsg && !loading && (
        <p className="text-xs text-red-500">{errorMsg}</p>
      )}

      <div className="space-y-4">
        {rows.map((row, rowIdx) => (
          <div
            key={`row-${rowIdx}`}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {row.map((q) => (
              <div
                key={q.id}
                role="button"
                tabIndex={0}
                onClick={() => handleCardOpen(q)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCardOpen(q);
                  }
                }}
                className="flex h-full flex-col gap-2 rounded-xl border bg-white p-4 shadow-sm cursor-pointer transition hover:border-amber-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between text-[11px] text-amber-700 font-semibold">
                  <span>{q.nickname}</span>
                </div>
                <p className="text-sm leading-relaxed text-zinc-800 line-clamp-3">
                  {q.content}
                </p>
                <div className="text-[11px] text-zinc-500">
                  {q.book?.title}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {(q.book?.author ?? "").split(/[,(]/)[0]?.trim()}
                </div>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-600">
                  <button
                    type="button"
                    onClick={(e) => handleCommentClick(e, q)}
                    className="flex items-center gap-1 rounded px-2 py-1 hover:bg-zinc-50"
                  >
                    댓글 보기 {typeof q.comments_count === "number" ? `(${q.comments_count})` : ""}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(q.id);
                    }}
                    disabled={likingId === q.id}
                    className="flex items-center gap-1 rounded px-2 py-1 hover:bg-zinc-50 disabled:opacity-60"
                  >
                    공감 {q.likes_count}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
