"use client";

import { useState } from "react";

type Review = {
  id: number;
  book_id: number;
  content: string;
  rating: number | null;
  created_at: string;
};

type Props = {
  bookId: number;
  initialReviews: Review[];
};

export default function ReviewSection({ bookId, initialReviews }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          content: trimmed,
          rating,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error ?? "리뷰 저장 중 오류가 발생했습니다.");
      } else {
        setReviews((prev) => [json.review as Review, ...prev]);
        setContent("");
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">리뷰</h2>

      {/* 작성 폼 */}
      <form onSubmit={handleSubmit} className="space-y-2 text-sm">
        <textarea
          className="w-full rounded-md border px-3 py-2 text-sm"
          rows={3}
          placeholder="이 책에 대한 한 줄 또는 짧은 리뷰를 남겨보세요."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-1 text-xs text-zinc-600">
            평점:
            <select
              className="rounded border px-1 py-[2px] text-xs"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md border px-3 py-1 text-xs"
          >
            {loading ? "저장 중..." : "리뷰 작성"}
          </button>
        </div>
        {errorMsg && (
          <p className="text-xs text-red-500">{errorMsg}</p>
        )}
      </form>

      {/* 리뷰 목록 */}
      <div className="space-y-2 text-sm">
        {reviews.map((r) => (
          <div
            key={r.id}
            className="rounded-md border p-3 text-xs leading-relaxed"
          >
            <div className="mb-1 text-[11px] text-zinc-500">
              ★ {r.rating ?? "-"} ·{" "}
              {new Date(r.created_at).toLocaleDateString()}
            </div>
            <p>{r.content}</p>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-xs text-zinc-500">아직 작성된 리뷰가 없습니다.</p>
        )}
      </div>
    </section>
  );
}
