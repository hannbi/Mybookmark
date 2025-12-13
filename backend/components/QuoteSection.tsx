//C:\dev\my-bookmark\components\QuoteSection.tsx
"use client";

import { useState } from "react";

type Quote = {
  id: number;
  book_id: number;
  text: string;
  created_at: string;
};

type Props = {
  bookId: number;
  initialQuotes: Quote[];
};

export default function QuoteSection({ bookId, initialQuotes }: Props) {
  const [quotes, setQuotes] = useState<Quote[]>(initialQuotes);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, text: trimmed }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error ?? "저장 중 오류가 발생했습니다.");
      } else {
        setQuotes((prev) => [json.quote as Quote, ...prev]);
        setText("");
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
      <h2 className="text-lg font-semibold">책 속 한 구절</h2>

      {/* 작성 폼 */}
      <form onSubmit={handleSubmit} className="space-y-2 text-sm">
        <textarea
          className="w-full rounded-md border px-3 py-2 text-sm"
          rows={2}
          placeholder="마음에 남는 문장을 남겨보세요."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md border px-3 py-1 text-xs"
          >
            {loading ? "저장 중..." : "한 구절 기록"}
          </button>
          {errorMsg && (
            <p className="text-xs text-red-500">{errorMsg}</p>
          )}
        </div>
      </form>

      {/* 목록 */}
      <div className="space-y-2 text-sm">
        {quotes.map((q) => (
          <div
            key={q.id}
            className="rounded-md border p-3 text-xs leading-relaxed"
          >
            <p className="mb-1">“{q.text}”</p>
            <p className="text-[11px] text-zinc-500">
              {new Date(q.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
        {quotes.length === 0 && (
          <p className="text-xs text-zinc-500">
            아직 등록된 한 구절이 없습니다.
          </p>
        )}
      </div>
    </section>
  );
}
