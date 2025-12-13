// components/BookQuotesSection.tsx
"use client";

import { useEffect, useState } from "react";
import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";

type Quote = {
    id: number;
    user_id: string;
    book_id: number;
    content: string;
    page: number | null;
    likes_count: number;
    created_at: string;
    profiles?: {
        id: string;
        nickname: string | null;
    } | null;
};

type QuoteComment = {
    id: number;
    quote_id: number;
    user_id: string;
    content: string;
    created_at: string;
    profiles?: {
        id: string;
        nickname: string | null;
    } | null;
};

type Props = {
    bookId: number;
    initialOpenQuoteId?: number | null;
};

export default function BookQuotesSection({ bookId, initialOpenQuoteId = null }: Props) {
    const { user } = useSupabaseUser();

    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [content, setContent] = useState("");
    const [page, setPage] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);
    const [openQuoteId, setOpenQuoteId] = useState<number | null>(initialOpenQuoteId);
    const [commentState, setCommentState] = useState<
        Record<
            number,
            { items: QuoteComment[]; loading: boolean; error: string | null }
        >
    >({});
    const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
    const [commentSubmittingId, setCommentSubmittingId] = useState<number | null>(null);

    // 목록 불러오기
    useEffect(() => {
        if (!bookId) return;

        async function loadQuotes() {
            setLoading(true);
            setErrorMsg(null);
            try {
                const res = await fetch(`/api/quotes?bookId=${bookId}`);
                const json = await res.json();

                if (!res.ok) {
                    setErrorMsg(json.error ?? "인용문을 불러오는 중 오류가 발생했습니다.");
                    setQuotes([]);
                } else {
                    setQuotes((json.quotes ?? []) as Quote[]);
                }
            } catch (e) {
                console.error("GET /api/quotes error:", e);
                setErrorMsg("네트워크 오류가 발생했습니다.");
                setQuotes([]);
            } finally {
                setLoading(false);
            }
        }

        loadQuotes();
    }, [bookId]);

    // 처음 들어올 때 특정 구절의 댓글을 펼치기
    useEffect(() => {
        if (!initialOpenQuoteId) return;
        const target = quotes.find((q) => q.id === initialOpenQuoteId);
        if (!target) return;
        setOpenQuoteId(initialOpenQuoteId);
        fetchComments(initialOpenQuoteId);
        const el = document.getElementById(`quote-card-${initialOpenQuoteId}`);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [initialOpenQuoteId, quotes]);

    async function fetchComments(quoteId: number) {
        setCommentState((prev) => ({
            ...prev,
            [quoteId]: { items: prev[quoteId]?.items ?? [], loading: true, error: null },
        }));
        try {
            const res = await fetch(`/api/quote-comments?quoteId=${quoteId}`);
            const json = await res.json();
            if (!res.ok) {
                setCommentState((prev) => ({
                    ...prev,
                    [quoteId]: {
                        items: [],
                        loading: false,
                        error: json.error ?? "댓글을 불러오는 중 오류가 발생했습니다.",
                    },
                }));
                return;
            }
            setCommentState((prev) => ({
                ...prev,
                [quoteId]: { items: (json.comments ?? []) as QuoteComment[], loading: false, error: null },
            }));
        } catch (e) {
            console.error("quote comments fetch error:", e);
            setCommentState((prev) => ({
                ...prev,
                [quoteId]: {
                    items: [],
                    loading: false,
                    error: "네트워크 오류가 발생했습니다.",
                },
            }));
        }
    }

    function handleToggleComments(quoteId: number) {
        if (openQuoteId === quoteId) {
            setOpenQuoteId(null);
            return;
        }
        setOpenQuoteId(quoteId);
        if (!commentState[quoteId]) {
            fetchComments(quoteId);
        }
    }

    async function handleSubmitComment(quoteId: number) {
        if (!user) {
            alert("로그인 후 댓글을 남길 수 있습니다.");
            return;
        }
        const text = (commentInputs[quoteId] ?? "").trim();
        if (!text) {
            alert("댓글 내용을 입력해 주세요.");
            return;
        }

        setCommentSubmittingId(quoteId);
        try {
            const res = await fetch("/api/quote-comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quoteId, content: text }),
            });
            const json = await res.json();
            if (!res.ok) {
                alert(json.error ?? "댓글 작성 중 오류가 발생했습니다.");
                return;
            }

            setCommentState((prev) => {
                const existing = prev[quoteId]?.items ?? [];
                return {
                    ...prev,
                    [quoteId]: {
                        items: [json.comment as QuoteComment, ...existing],
                        loading: false,
                        error: null,
                    },
                };
            });
            setCommentInputs((prev) => ({ ...prev, [quoteId]: "" }));
        } catch (e) {
            console.error("quote comments post error:", e);
            alert("댓글 작성 중 오류가 발생했습니다.");
        } finally {
            setCommentSubmittingId(null);
        }
    }

    // 인용문 등록
    async function handleAddQuote(e: React.FormEvent) {
        e.preventDefault();
        if (!user) {
            alert("로그인이 필요합니다.");
            return;
        }
        const trimmed = content.trim();
        if (!trimmed) {
            alert("내용을 입력해 주세요.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/quotes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookId,
                    content: trimmed,
                    page: page ? Number(page) : null,
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                console.error("POST /api/quotes error:", json);
                alert(json.error ?? "인용문 등록에 실패했습니다.");
                return;
            }

            const newQuote = json.quote as Quote;
            setQuotes((prev) => [newQuote, ...prev]);
            setContent("");
            setPage("");
        } catch (e) {
            console.error("POST /api/quotes fetch error:", e);
            alert("네트워크 오류가 발생했습니다.");
        } finally {
            setSubmitting(false);
        }
    }

    // 인용문 삭제 (내가 쓴 것만)
    async function handleDeleteQuote(id: number) {
        if (!user) return;
        if (!confirm("이 인용문을 삭제할까요?")) return;

        try {
            const res = await fetch(`/api/quotes?id=${id}`, {
                method: "DELETE",
            });
            const json = await res.json();

            if (!res.ok) {
                console.error("DELETE /api/quotes error:", json);
                alert(json.error ?? "삭제에 실패했습니다.");
                return;
            }

            setQuotes((prev) => prev.filter((q) => q.id !== id));
        } catch (e) {
            console.error("DELETE /api/quotes fetch error:", e);
            alert("네트워크 오류가 발생했습니다.");
        }
    }

    // 좋아요 토글
    async function handleToggleLike(id: number) {
        if (!user) {
            alert("로그인이 필요합니다.");
            return;
        }

        try {
            const res = await fetch("/api/quote-likes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quoteId: id }),
            });

            const json = await res.json();

            if (!res.ok) {
                console.error("POST /api/quote-likes error:", json);
                alert(json.error ?? "공감 처리에 실패했습니다.");
                return;
            }

            const { likesCount } = json as { likesCount: number };

            setQuotes((prev) =>
                prev.map((q) =>
                    q.id === id ? { ...q, likes_count: likesCount } : q
                )
            );
        } catch (e) {
            console.error("POST /api/quote-likes fetch error:", e);
            alert("네트워크 오류가 발생했습니다.");
        }
    }

    return (
        <section className="mt-6 space-y-3">
            <h2 className="text-lg font-semibold">책 속 한 구절</h2>

            {/* 등록 폼 */}
            <form onSubmit={handleAddQuote} className="space-y-2">
                <textarea
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    rows={3}
                    placeholder="마음에 남는 문장을 적어 보세요."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500">페이지(선택)</span>
                        <input
                            type="number"
                            min={1}
                            className="w-20 rounded-md border px-2 py-1 text-xs"
                            value={page}
                            onChange={(e) => setPage(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-md bg-emerald-600 px-3 py-1 text-xs text-white disabled:opacity-60"
                    >
                        {submitting ? "등록 중..." : "한 구절 추가"}
                    </button>
                </div>
            </form>

            {/* 상태 메시지 */}
            {loading && (
                <p className="text-xs text-zinc-500">인용문을 불러오는 중...</p>
            )}
            {errorMsg && (
                <p className="text-xs text-red-500">{errorMsg}</p>
            )}

            {/* 목록 */}
            <div className="space-y-2">
                {quotes.map((q) => {
                    const isMine = user && q.user_id === user.id;
                    const isOpen = openQuoteId === q.id;
                    const comments = commentState[q.id];
                    return (
                        <div
                            key={q.id}
                            id={`quote-card-${q.id}`}
                            className="rounded-md border bg-white px-3 py-2 text-xs"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                                    <span>{q.profiles?.nickname ?? "익명"}</span>
                                    {q.page && <span>· p.{q.page}</span>}
                                    <span>
                                        · {new Date(q.created_at).toISOString().slice(0, 10)}
                                    </span>
                                </div>
                                {isMine && (
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteQuote(q.id)}
                                        className="text-[11px] text-red-500 hover:underline"
                                    >
                                        삭제
                                    </button>
                                )}
                            </div>
                            <p className="whitespace-pre-wrap leading-relaxed mb-1">
                                {q.content}
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-600">
                                <button
                                    type="button"
                                    onClick={() => handleToggleComments(q.id)}
                                    className="flex items-center gap-1 rounded px-2 py-1 hover:bg-zinc-50"
                                >
                                    {isOpen ? "댓글 접기" : "댓글 보기"}
                                    {comments && comments.items.length > 0
                                        ? `(${comments.items.length})`
                                        : ""}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleToggleLike(q.id)}
                                    className="flex items-center gap-1 rounded px-2 py-1 hover:bg-zinc-50 text-amber-600"
                                >
                                    공감 {q.likes_count ?? 0}
                                </button>
                            </div>

                            {isOpen && (
                                <div className="mt-2 space-y-2 border-t pt-2 text-[11px]">
                                    {comments?.loading && (
                                        <p className="text-zinc-500">댓글을 불러오는 중...</p>
                                    )}
                                    {comments?.error && (comments?.items?.length ?? 0) > 0 && (
                                        <p className="text-red-500">{comments.error}</p>
                                    )}

                                    {user ? (
                                        <div className="space-y-1">
                                            <textarea
                                                className="w-full rounded border px-2 py-1 text-[11px]"
                                                rows={2}
                                                placeholder="구절에 대한 생각을 남겨 보세요."
                                                value={commentInputs[q.id] ?? ""}
                                                onChange={(e) =>
                                                    setCommentInputs((prev) => ({
                                                        ...prev,
                                                        [q.id]: e.target.value,
                                                    }))
                                                }
                                            />
                                            <div className="flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSubmitComment(q.id)}
                                                    disabled={commentSubmittingId === q.id}
                                                    className="rounded border px-2 py-1 text-[11px] bg-white hover:bg-zinc-50 disabled:opacity-60"
                                                >
                                                    {commentSubmittingId === q.id ? "등록 중..." : "댓글 남기기"}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-zinc-500">로그인 후 댓글을 남길 수 있습니다.</p>
                                    )}

                                    <div className="space-y-1">
                                        {(comments?.items ?? []).map((c) => (
                                            <div
                                                key={c.id}
                                                className="rounded border bg-zinc-50 px-2 py-1"
                                            >
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-[11px]">
                                                        {c.profiles?.nickname ?? "익명"}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-500">
                                                        {new Date(c.created_at).toISOString().slice(0, 10)}
                                                    </span>
                                                </div>
                                                <p className="whitespace-pre-wrap leading-relaxed text-[11px] mt-1">
                                                    {c.content}
                                                </p>
                                            </div>
                                        ))}

                                        {comments && comments.items.length === 0 && !comments.loading && !comments.error && (
                                            <p className="text-zinc-500">첫 댓글을 남겨 보세요.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {!loading && !errorMsg && quotes.length === 0 && (
                    <p className="text-[11px] text-zinc-500">
                        아직 등록된 한 구절이 없습니다. 첫 문장을 남겨 보세요.
                    </p>
                )}
            </div>
        </section>
    );
}
