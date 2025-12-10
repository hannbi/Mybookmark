"use client";

import { useState } from "react";

type Props = {
  bookId: number;
  initialStatus: string | null;
};

export default function UserBookSection({ bookId, initialStatus }: Props) {
  const [status, setStatus] = useState<string | null>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function updateStatus(nextStatus: "want" | "finished") {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/user-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, status: nextStatus }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error ?? "상태 변경 중 오류가 발생했습니다.");
      } else {
        setStatus(nextStatus);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">나의 서재</h2>
      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          disabled={loading}
          onClick={() => updateStatus("want")}
          className={`rounded-md border px-3 py-1 ${
            status === "want" ? "bg-zinc-800 text-white" : ""
          }`}
        >
          읽고 싶은 책
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => updateStatus("finished")}
          className={`rounded-md border px-3 py-1 ${
            status === "finished" ? "bg-emerald-600 text-white" : ""
          }`}
        >
          완독 처리
        </button>

        {status && (
          <span className="text-[11px] text-zinc-600">
            현재 상태: {status === "want" ? "읽고 싶은 책" : "완독"}
          </span>
        )}
      </div>
      {errorMsg && (
        <p className="text-[11px] text-red-500">{errorMsg}</p>
      )}
    </section>
  );
}
