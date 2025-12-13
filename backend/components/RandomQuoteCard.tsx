// components/RandomQuoteCard.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type RandomQuote = {
    id: number;
    content: string;
    page: number | null;
    likes_count: number;
    created_at: string;
    books?: {
        id: number;
        title: string;
        author: string | null;
        cover?: string | null;
    } | null;
    profiles?: {
        id: string;
        nickname: string | null;
    } | null;
};

export default function RandomQuoteCard() {
    const [quote, setQuote] = useState<RandomQuote | null>(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        async function loadRandomQuote() {
            setLoading(true);
            setErrorMsg(null);
            try {
                const res = await fetch("/api/quotes/random");
                const json = await res.json();

                if (!res.ok) {
                    setErrorMsg(
                        json.error ?? "책 속 한 구절을 불러오는 중 오류가 발생했습니다."
                    );
                    setQuote(null);
                } else {
                    setQuote((json.quote ?? null) as RandomQuote | null);
                }
            } catch (e) {
                console.error("GET /api/quotes/random error:", e);
                setErrorMsg("네트워크 오류가 발생했습니다.");
                setQuote(null);
            } finally {
                setLoading(false);
            }
        }

        loadRandomQuote();
    }, []);

    // 공감 클릭
    async function handleLikeClick() {
        if (!quote) return;

        try {
            const res = await fetch("/api/quote-likes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ quote_id: quote.id }),
            });

            const json = await res.json().catch(() => null);

            if (!res.ok || !json) {
                alert(json?.error || "공감 처리 중 오류가 발생했습니다.");
                return;
            }

            const liked = !!json.liked;
            const serverLikes =
                typeof json.likes_count === "number" ? json.likes_count : null;

            setQuote((prev) =>
                prev
                    ? {
                        ...prev,
                        likes_count:
                            serverLikes !== null
                                ? serverLikes
                                : Math.max(0, prev.likes_count + (liked ? 1 : -1)),
                    }
                    : prev
            );
        } catch (e) {
            console.error("POST /api/quote-likes error:", e);
            alert("공감 처리 중 오류가 발생했습니다.");
        }
    }

    if (loading) {
        return (
            <div className="rounded-lg border.bg-white p-4 text-sm">
                <p className="text-xs text-zinc-500">
                    인상 깊은 문장을 불러오는 중...
                </p>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="rounded-lg border bg-white p-4 text-sm">
                <p className="text-xs text-red-500">{errorMsg}</p>
            </div>
        );
    }

    if (!quote) {
        return (
            <div className="rounded-lg border bg-white p-4 text-sm">
                <p className="text-xs text-zinc-500">
                    아직 등록된 한 구절이 없습니다. 첫 문장을 남겨 보세요.
                </p>
            </div>
        );
    }

    const book = quote.books;

    return (
        <div className="rounded-lg border bg-white p-4 text-sm">
            <p className="mb-3 text-xs text-zinc-500">오늘의 책 속 한 구절</p>
            <p className="mb-3 text-sm leading-relaxed whitespace-pre-wrap">
                “{quote.content}”
            </p>
            <div className="flex items-center justify-between text-[11px] text-zinc-500">
                <div className="flex flex-col">
                    {book && (
                        <Link
                            href={`/book?bookId=${book.id}`}
                            className="font-semibold text-zinc-800 hover:underline"
                        >
                            {book.title}
                        </Link>
                    )}
                    <span>
                        {quote.profiles?.nickname ?? "익명"}
                        {quote.page && ` · p.${quote.page}`}
                    </span>

                    <button
                        type="button"
                        onClick={handleLikeClick}
                        className="mt-1 flex items-center.gap-1 text-xs text-orange-600 hover:underline"
                    >
                        <span>공감</span>
                        <span>{quote.likes_count}</span>
                    </button>
                </div>

                {book?.cover && (
                    <div className="h-16 w-12 overflow-hidden rounded bg-zinc-100">
                        <img
                            src={book.cover}
                            alt={book.title}
                            className="h-full w-full object-cover"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
