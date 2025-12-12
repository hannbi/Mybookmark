// app/book/page.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";
import BookQuotesSection from "@/components/BookQuotesSection";

type Book = {
  id: number;
  title: string;
  author: string | null;
  publisher: string | null;
  category: string | null;
  isbn?: string | null;
  cover?: string | null;
  description?: string | null;
};

type LibraryItemInfo = {
  status: string;
  started_at: string | null;
  finished_at: string | null;
  emotion_tag: string | null;
};

type Review = {
  id: number;
  user_id: string;
  content: string;
  rating: number;
  created_at: string;
  likes_count?: number;
  likedByMe?: boolean;
};

// 인용문 타입 (Quote 전용)
type BookQuote = {
  id: number;
  book_id: number;
  content: string;
  page: number | null;
  likes_count: number;
  liked_by_me: boolean; // ← 서버에서 내려주는 내 공감 여부
  created_at: string;
  profiles?: {
    nickname: string | null;
  } | null;
};

function statusLabel(status?: string | null) {
  if (!status) return "미지정";
  if (status === "want") return "읽고 싶어요";
  if (status === "reading") return "읽는 중";
  if (status === "finished") return "다 읽음";
  return status;
}

const emotionOptions = [
  "",
  "재밌었어요",
  "감동적이에요",
  "슬펐어요",
  "어려웠어요",
  "지루했어요",
  "생각이 많아졌어요",
];

export default function BookPage() {
  const { user } = useSupabaseUser();
  const searchParams = useSearchParams();
  const bookId = searchParams.get("bookId");
  const focusTarget = searchParams.get("focus");
  const quoteIdParam = searchParams.get("quoteId");
  const initialQuoteId =
    quoteIdParam && !Number.isNaN(Number(quoteIdParam))
      ? Number(quoteIdParam)
      : null;
  const reviewSectionRef = useRef<HTMLElement | null>(null);
  const quotesSectionRef = useRef<HTMLElement | null>(null);
  const [highlightReviews, setHighlightReviews] = useState(false);

  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [inLibrary, setInLibrary] = useState<boolean | null>(null);
  const [libraryInfo, setLibraryInfo] = useState<LibraryItemInfo | null>(null);
  const [toggling, setToggling] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // 리뷰 관련 상태
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [newRating, setNewRating] = useState<number>(0);
  const [newContent, setNewContent] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [likingReviewId, setLikingReviewId] = useState<number | null>(null);

  // 책 상세 정보
  useEffect(() => {
    if (!bookId) return;

    async function fetchBook() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/books/${bookId}`);
        if (!res.ok) {
          setError(`API 에러: ${res.status}`);
          return;
        }
        const data = await res.json();
        setBook(data);
      } catch (e) {
        setError("불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchBook();
  }, [bookId]);

  // 내 서재 여부 + 상태/감정 조회
  useEffect(() => {
    if (!bookId) return;

    async function checkInLibrary() {
      try {
        const res = await fetch(`/api/user-books?bookId=${bookId}`);
        if (res.status === 401) {
          setInLibrary(false);
          setLibraryInfo(null);
          return;
        }

        const json = await res.json();

        if (!res.ok) {
          console.error("GET /api/user-books error:", json);
          setInLibrary(null);
          setLibraryInfo(null);
          return;
        }

        if (json.exists) {
          setInLibrary(true);
          setLibraryInfo({
            status: json.item?.status ?? "want",
            started_at: json.item?.started_at ?? null,
            finished_at: json.item?.finished_at ?? null,
            emotion_tag: json.item?.emotion_tag ?? null,
          });
        } else {
          setInLibrary(false);
          setLibraryInfo(null);
        }
      } catch (e) {
        console.error("checkInLibrary error:", e);
        setInLibrary(null);
        setLibraryInfo(null);
      }
    }

    checkInLibrary();
  }, [bookId]);

  // 리뷰 목록 불러오기
  useEffect(() => {
    if (!bookId) return;

    async function fetchReviews() {
      try {
        setReviewsLoading(true);
        setReviewsError(null);
        const res = await fetch(`/api/reviews?bookId=${bookId}`);
        const json = await res.json();
        if (!res.ok) {
          console.error("GET /api/reviews error:", json);
          setReviews([]);
          setReviewsError(json.error ?? "리뷰를 불러오는 중 오류가 발생했습니다.");
        } else {
          setReviews((json.reviews ?? []) as Review[]);
        }
      } catch (e) {
        console.error("fetch reviews error:", e);
        setReviews([]);
        setReviewsError("네트워크 오류가 발생했습니다.");
      } finally {
        setReviewsLoading(false);
      }
    }

    fetchReviews();
  }, [bookId]);

  useEffect(() => {
    if (focusTarget !== "reviews") return;
    if (!reviewSectionRef.current) return;

    reviewSectionRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setHighlightReviews(true);

    const timer = setTimeout(() => setHighlightReviews(false), 2000);
    return () => clearTimeout(timer);
  }, [focusTarget]);

  useEffect(() => {
    if (focusTarget !== "quote-comments" && !initialQuoteId) return;
    if (!quotesSectionRef.current) return;
    quotesSectionRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [focusTarget, initialQuoteId]);

  async function handleToggleLibrary() {
    if (!bookId) return;

    setToggling(true);
    try {
      if (inLibrary) {
        const res = await fetch(`/api/user-books?bookId=${bookId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setInLibrary(false);
          setLibraryInfo(null);
        } else {
          console.error("DELETE /api/user-books failed", await res.json());
        }
      } else {
        const res = await fetch("/api/user-books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId: Number(bookId) }),
        });
        if (res.ok) {
          setInLibrary(true);
          setLibraryInfo({
            status: "want",
            started_at: null,
            finished_at: null,
            emotion_tag: null,
          });
        } else {
          console.error("POST /api/user-books failed", await res.json());
        }
      }
    } finally {
      setToggling(false);
    }
  }

  async function handleStatusChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    if (!bookId || !inLibrary || !libraryInfo) return;

    const newStatus = e.target.value;
    setStatusUpdating(true);

    try {
      const res = await fetch("/api/user-books", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: Number(bookId),
          status: newStatus,
          emotionTag: libraryInfo.emotion_tag ?? undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("PATCH status /api/user-books failed", json);
        return;
      }

      setLibraryInfo((prev) =>
        prev
          ? {
            ...prev,
            status: json.status ?? newStatus,
            started_at: json.started_at ?? prev.started_at,
            finished_at: json.finished_at ?? prev.finished_at,
            emotion_tag: json.emotion_tag ?? prev.emotion_tag,
          }
          : prev
      );
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleEmotionChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    if (!bookId || !inLibrary || !libraryInfo) return;

    const newEmotion = e.target.value;
    setStatusUpdating(true);

    try {
      const res = await fetch("/api/user-books", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: Number(bookId),
          status: libraryInfo.status,
          emotionTag: newEmotion,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("PATCH emotion /api/user-books failed", json);
        return;
      }

      setLibraryInfo((prev) =>
        prev
          ? {
            ...prev,
            emotion_tag: (json.emotion_tag ?? newEmotion) || null,
            started_at: json.started_at ?? prev.started_at,
            finished_at: json.finished_at ?? prev.finished_at,
          }
          : prev
      );
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!bookId || !user) return;

    if (!newRating || newRating < 1 || newRating > 5) {
      alert("별점은 1~5 사이에서 선택해 주세요.");
      return;
    }
    if (!newContent.trim()) {
      alert("리뷰 내용을 입력해 주세요.");
      return;
    }

    setSubmittingReview(true);
    try {
      if (editingReviewId === null) {
        // 새 리뷰 작성
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookId: Number(bookId),
            rating: newRating,
            content: newContent.trim(),
          }),
        });

        const json = await res.json();

        if (!res.ok) {
          console.error("POST /api/reviews error:", json);
          alert(json.error ?? "리뷰 작성 중 오류가 발생했습니다.");
          return;
        }

        setReviews((prev) => [json.review as Review, ...prev]);
      } else {
        // 기존 리뷰 수정
        const res = await fetch("/api/reviews", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewId: editingReviewId,
            rating: newRating,
            content: newContent.trim(),
          }),
        });

        const json = await res.json();

        if (!res.ok) {
          console.error("PATCH /api/reviews error:", json);
          alert(json.error ?? "리뷰 수정 중 오류가 발생했습니다.");
          return;
        }

        setReviews((prev) =>
          prev.map((r) =>
            r.id === editingReviewId ? (json.review as Review) : r
          )
        );
      }

      // 폼 초기화
      setNewRating(0);
      setNewContent("");
      setEditingReviewId(null);
    } finally {
      setSubmittingReview(false);
    }
  }

  function handleEditClick(review: Review) {
    setEditingReviewId(review.id);
    setNewRating(review.rating);
    setNewContent(review.content);
  }

  async function handleDeleteReview(reviewId: number) {
    if (!confirm("이 리뷰를 삭제하시겠습니까?")) return;

    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("DELETE /api/reviews error:", json);
        alert(json.error ?? "리뷰 삭제 중 오류가 발생했습니다.");
        return;
      }

      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      if (editingReviewId === reviewId) {
        setEditingReviewId(null);
        setNewRating(0);
        setNewContent("");
      }
    } finally {
      setSubmittingReview(false);
    }
  }

  // 리뷰 공감 처리 (Quote와는 별개)
  async function handleToggleLike(review: Review) {
    if (!user) {
      alert("로그인 후 공감할 수 있습니다.");
      return;
    }

    setLikingReviewId(review.id);
    try {
      const res = await fetch("/api/review-likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: review.id }),
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("POST /api/review-likes error:", json);
        alert(json.error ?? "공감 처리 중 오류가 발생했습니다.");
        return;
      }

      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id
            ? {
              ...r,
              likedByMe: json.liked as boolean,
              likes_count: json.likesCount as number,
            }
            : r
        )
      );
    } finally {
      setLikingReviewId(null);
    }
  }

  if (!bookId) {
    return (
      <main className="p-6">
        <p>bookId 파라미터가 없습니다.</p>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6">
      {loading && <p>불러오는 중...</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {book && (
        <>
          {/* 기본 정보: 표지 + 텍스트 */}
          <section className="flex flex-col gap-4 md:flex-row">
            {book.cover && (
              <div className="w-full max-w-[180px] md:w-[180px]">
                <div className="overflow-hidden rounded-md border bg-zinc-100">
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 space-y-2">
              <h1 className="text-2xl font-bold">{book.title}</h1>
              <p className="text-sm text-zinc-700">{book.author}</p>
              <p className="text-sm text-zinc-600">
                {book.publisher && <span>{book.publisher}</span>}
                {book.publisher && book.category && <span> · </span>}
                {book.category && <span>{book.category}</span>}
              </p>
              {book.isbn && (
                <p className="text-xs text-zinc-500">ISBN: {book.isbn}</p>
              )}
              {book.description && (
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-zinc-700">
                  {book.description}
                </p>
              )}
            </div>
          </section>

          {/* 내 서재 / 상태 / 감정 */}
          <section className="mt-4 flex flex-col gap-3">
            <button
              onClick={handleToggleLibrary}
              disabled={toggling || inLibrary === null}
              className="w-40 rounded border px-3 py-2 text-sm bg-white hover:bg-zinc-50"
            >
              {inLibrary === null
                ? "확인 중..."
                : inLibrary
                  ? "내 서재에서 제거"
                  : "내 서재에 추가"}
            </button>

            {inLibrary && libraryInfo && (
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span>읽기 상태:</span>
                  <select
                    value={libraryInfo.status}
                    onChange={handleStatusChange}
                    disabled={statusUpdating}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="want">읽고 싶어요</option>
                    <option value="reading">읽는 중</option>
                    <option value="finished">다 읽음</option>
                  </select>

                  <span className="text-xs text-zinc-500">
                    {libraryInfo.started_at &&
                      `시작: ${libraryInfo.started_at} `}
                    {libraryInfo.finished_at &&
                      `완료: ${libraryInfo.finished_at}`}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span>이 책의 느낌:</span>
                  <select
                    value={libraryInfo.emotion_tag ?? ""}
                    onChange={handleEmotionChange}
                    disabled={statusUpdating}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    {emotionOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt === "" ? "선택 안 함" : opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* 리뷰 섹션 */}
          <section
            id="reviews"
            ref={reviewSectionRef}
            className={`mt-8 space-y-4 ${
              highlightReviews ? "ring-2 ring-amber-300 ring-offset-2 ring-offset-white" : ""
            }`}
          >
            <h2 className="text-lg font-semibold">리뷰</h2>

            {/* 작성 / 수정 폼 */}
            {user ? (
              <form
                onSubmit={handleSubmitReview}
                className="space-y-2 text-sm rounded border bg-white p-3"
              >
                <div className="flex items-center gap-2">
                  <label className="text-xs text-zinc-600">별점</label>
                  <select
                    value={newRating || ""}
                    onChange={(e) => setNewRating(Number(e.target.value))}
                    className="border rounded px-2 py-1 text-xs bg-white"
                  >
                    <option value="">선택</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}점
                      </option>
                    ))}
                  </select>
                  {editingReviewId && (
                    <span className="text-[11px] text-amber-700">
                      내 리뷰 수정 중...
                    </span>
                  )}
                </div>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={3}
                  placeholder="이 책에 대한 생각을 자유롭게 남겨보세요."
                  className="w-full border rounded px-3 py-2 text-sm"
                />
                <div className="flex justify-between items-center">
                  {editingReviewId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReviewId(null);
                        setNewRating(0);
                        setNewContent("");
                      }}
                      className="text-[11px] text-zinc-500 hover:underline"
                    >
                      수정 취소
                    </button>
                  )}
                  <div className="flex-1" />
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="rounded border px-3 py-1 text-xs bg-white hover:bg-zinc-50"
                  >
                    {submittingReview
                      ? editingReviewId
                        ? "수정 중..."
                        : "작성 중..."
                      : editingReviewId
                        ? "리뷰 수정"
                        : "리뷰 남기기"}
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-zinc-500">
                로그인 후 리뷰를 작성할 수 있습니다.
              </p>
            )}

            {/* 리뷰 목록 */}
            {reviewsLoading && (
              <p className="text-xs text-zinc-500">리뷰를 불러오는 중...</p>
            )}
            {reviewsError && (
              <p className="text-xs text-red-500">{reviewsError}</p>
            )}

            <div className="space-y-3">
              {reviews.map((r) => {
                const isMine = user && r.user_id === user.id;

                return (
                  <div
                    key={r.id}
                    className="rounded border bg-white px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="text-amber-500">
                          {"★".repeat(r.rating)}
                          {"☆".repeat(5 - r.rating)}
                        </div>
                        {isMine && (
                          <span className="text-[11px] text-amber-700">
                            내 리뷰
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {new Date(r.created_at)
                          .toISOString()
                          .slice(0, 10)}
                      </div>
                    </div>

                    <p className="whitespace-pre-wrap.leading-relaxed mb-2">
                      {r.content}
                    </p>

                    {/* 공감 + 수정/삭제 영역 */}
                    <div className="flex items-center justify-between mt-1">
                      {/* 왼쪽: 공감 버튼 */}
                      <button
                        type="button"
                        onClick={() => handleToggleLike(r)}
                        disabled={likingReviewId === r.id}
                        className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-amber-600"
                      >
                        <span>{r.likedByMe ? "♥" : "♡"}</span>
                        <span>{r.likes_count ?? 0}</span>
                      </button>

                      {/* 오른쪽: 내 리뷰일 때만 수정/삭제 */}
                      {isMine && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditClick(r)}
                            className="text-[11px] text-zinc-600 hover:underline"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(r.id)}
                            className="text-[11px] text-red-500 hover:underline"
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {!reviewsLoading &&
                !reviewsError &&
                reviews.length === 0 && (
                  <p className="text-xs text-zinc-500">
                    아직 등록된 리뷰가 없습니다. 첫 리뷰를 남겨보세요.
                  </p>
                )}
            </div>
          </section>

          {/* 책 속 한 구절(Quote) 섹션 - Quote 전용 컴포넌트 사용 */}
          <section ref={quotesSectionRef}>
            <BookQuotesSection
              bookId={Number(bookId)}
              initialOpenQuoteId={initialQuoteId}
            />
          </section>
        </>
      )}
    </main>
  );
}
