// app/quotes/liked/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";

type LikedQuote = {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
  nickname: string;
  likes_count: number;
  book: {
    id: number;
    title: string;
    author: string | null;
  } | null;
};

type SortKey = "recent" | "likes" | "title";

export default function LikedQuotesPage() {
  const { user } = useSupabaseUser();
  const [quotes, setQuotes] = useState<LikedQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [showMyAll, setShowMyAll] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch("/api/quotes/liked");
        const json = await res.json();
        if (!res.ok) {
          setErrorMsg(json.error ?? "공감한 구절을 불러오는 중 오류가 발생했습니다.");
          setQuotes([]);
        } else {
          setQuotes((json.quotes ?? []) as LikedQuote[]);
        }
      } catch (e) {
        console.error("liked quotes fetch error:", e);
        setErrorMsg("네트워크 오류가 발생했습니다.");
        setQuotes([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const { myQuotes, otherQuotes } = useMemo(() => {
    const sorted = [...quotes];
    if (sortKey === "recent") {
      sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortKey === "likes") {
      sorted.sort((a, b) => (b.likes_count ?? 0) - (a.likes_count ?? 0));
    } else if (sortKey === "title") {
      sorted.sort((a, b) =>
        (a.book?.title ?? "").localeCompare(b.book?.title ?? "", "ko")
      );
    }
    const mine = sorted.filter((q) => user && q.user_id === user.id);
    const others = sorted.filter((q) => !user || q.user_id !== user.id);
    return { myQuotes: mine, otherQuotes: others };
  }, [quotes, sortKey, user]);

  const visibleMyQuotes = showMyAll ? myQuotes : myQuotes.slice(0, 3);

  if (!user) {
    return (
      <main className="p-6">
        <p>로그인 후 이용할 수 있습니다.</p>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold">공감한 구절 모아보기</h1>
          <p className="text-sm text-zinc-500">
            내가 공감한 책 속 구절을 한곳에서 모아보세요.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-600">정렬</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="border rounded px-2 py-1 text-xs bg-white"
          >
            <option value="recent">최근 순</option>
            <option value="likes">공감 많은 순</option>
            <option value="title">도서 제목 순</option>
          </select>
          <Link
            href="/mylibrary"
            className="flex h-9 items-center rounded border px-3 bg-white hover:bg-zinc-50"
          >
            내 서재 보기
          </Link>
          <Link
            href="/dashboard"
            className="flex h-9 items-center rounded border px-3 bg-white hover:bg-zinc-50"
          >
            대시보드 보기
          </Link>
        </div>
      </header>
<section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">내가 쓴 인용문</h2>
          {myQuotes.length > 3 && (
            <button
              type="button"
              className="text-xs text-amber-600 hover:underline"
              onClick={() => setShowMyAll((p) => !p)}
            >
              {showMyAll ? "접기" : "더 보기"}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {visibleMyQuotes.map((q) => (
            <QuoteCard key={q.id} quote={q} />
          ))}
          {!loading && myQuotes.length === 0 && (
            <p className="text-xs text-zinc-500">내가 쓴 인용문이 없습니다.</p>
          )}
        </div>
      </section>

      {/* 다른 사람 인용문 */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">다른 독자들의 인용문</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {otherQuotes.map((q) => (
            <QuoteCard key={q.id} quote={q} />
          ))}
          {!loading && otherQuotes.length === 0 && (
            <p className="text-xs text-zinc-500">다른 독자들의 인용문이 없습니다.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function QuoteCard({ quote }: { quote: LikedQuote }) {
  return (
    <div className="flex h-full flex-col gap-2 rounded-lg border bg-white p-4 text-sm shadow-sm">
      <div className="text-[11px] text-amber-700 font-semibold">
        {quote.nickname}
      </div>
      <p className="text-sm leading-relaxed text-zinc-800 line-clamp-3">
        {quote.content}
      </p>
      <div className="text-[11px] text-zinc-500">{quote.book?.title}</div>
      <div className="text-[11px] text-zinc-400">
        {(quote.book?.author ?? "").split(/[,(]/)[0]?.trim()}
      </div>
      {quote.book && (
        <Link
          href={`/book?bookId=${quote.book.id}`}
          className="text-[11px] text-amber-600 hover:underline"
        >
          도서 상세 보기
        </Link>
      )}
      <div className="text-[11px] text-zinc-500">공감 {quote.likes_count}</div>
    </div>
  );
}
