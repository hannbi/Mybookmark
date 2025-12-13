// app/api/user-books/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/user-books
 *   - ?bookId=1  → 해당 책이 내 서재에 있는지 여부 + 상태 등
 *   - (쿼리 없음) → 내 서재 전체 목록 (books 테이블과 조인)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookIdParam = searchParams.get("bookId");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 1) 특정 bookId에 대해 "내 서재에 있는지 + 상태" 확인
  if (bookIdParam) {
    const bookId = Number(bookIdParam);

    const { data, error } = await supabase
      .from("user_books")
      .select("id, status, started_at, finished_at, emotion_tag")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .maybeSingle();

    if (error) {
      console.error("user_books check error:", error);
      return NextResponse.json(
        { error: "Failed to check user_books" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exists: !!data,
      item: data ?? null,
    });
  }

  // 2) 내 서재 전체 목록 (books 테이블과 조인해서 책 정보까지 포함)
  const { data, error } = await supabase
    .from("user_books")
    .select(
      `
      book_id,
      status,
      started_at,
      finished_at,
      emotion_tag,
      created_at,
      books (
        id,
        title,
        author,
        publisher,
        category,
        cover
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("user_books list error:", error);
    return NextResponse.json(
      { error: "Failed to load user library" },
      { status: 500 }
    );
  }

  return NextResponse.json({ items: data ?? [] });
}

/**
 * POST /api/user-books
 * body: { bookId, status?, startedAt?, finishedAt?, emotionTag? }
 * - 없으면 status 는 테이블 기본값('want') 사용
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const bookId = body?.bookId;

  if (!bookId) {
    return NextResponse.json(
      { error: "bookId is required" },
      { status: 400 }
    );
  }

  type InsertPayload = {
    user_id: string;
    book_id: number;
    status?: string;
    started_at?: string | null;
    finished_at?: string | null;
    emotion_tag?: string | null;
  };

  const payload: InsertPayload = {
    user_id: user.id,
    book_id: Number(bookId),
  };

  if (body.status) payload.status = body.status;
  if (body.startedAt) payload.started_at = body.startedAt;
  if (body.finishedAt) payload.finished_at = body.finishedAt;
  if (body.emotionTag) payload.emotion_tag = body.emotionTag;

  const { error } = await supabase.from("user_books").upsert(payload);

  if (error) {
    console.error("user_books upsert error:", error);
    return NextResponse.json(
      { error: "Failed to add/update book in library" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/user-books?bookId=1
 * - 내 서재에서 해당 책을 제거
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookIdParam = searchParams.get("bookId");

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!bookIdParam) {
    return NextResponse.json(
      { error: "bookId is required" },
      { status: 400 }
    );
  }

  const bookId = Number(bookIdParam);

  const { error } = await supabase
    .from("user_books")
    .delete()
    .eq("user_id", user.id)
    .eq("book_id", bookId);

  if (error) {
    console.error("user_books delete error:", error);
    return NextResponse.json(
      { error: "Failed to remove book from library" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

// app/api/user-books/route.ts 중 아래에 추가
// app/api/user-books/route.ts 안의 PATCH 전체를 이걸로 교체

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const bookId = body?.bookId;
  const newStatus = body?.status as string | undefined;
  const newEmotionTag = body?.emotionTag as string | undefined; // 추가된 부분

  if (!bookId || !newStatus) {
    return NextResponse.json(
      { error: "bookId and status are required" },
      { status: 400 }
    );
  }

  const bookIdNum = Number(bookId);

  // 기존 row 가져오기
  const { data: existing, error: selectError } = await supabase
    .from("user_books")
    .select("id, status, started_at, finished_at, emotion_tag")
    .eq("user_id", user.id)
    .eq("book_id", bookIdNum)
    .maybeSingle();

  if (selectError) {
    console.error("user_books select for PATCH error:", selectError);
    return NextResponse.json(
      { error: "Failed to load user_books item" },
      { status: 500 }
    );
  }

  if (!existing) {
    return NextResponse.json(
      { error: "Book not in user library" },
      { status: 404 }
    );
  }

  let startedAt = existing.started_at as string | null;
  let finishedAt = existing.finished_at as string | null;
  let emotionTag = existing.emotion_tag as string | null;

  // 오늘 날짜 (YYYY-MM-DD)
  const today = new Date().toISOString().slice(0, 10);

  // 상태 변경에 따른 날짜 자동 처리
  if (newStatus === "reading") {
    if (!startedAt) startedAt = today;
  } else if (newStatus === "finished") {
    if (!startedAt) startedAt = today;
    finishedAt = today;
  } else if (newStatus === "want") {
    startedAt = null;
    finishedAt = null;
  }

  // 감정 태그 변경
  if (newEmotionTag !== undefined) {
    // 빈 문자열이면 null로 저장
    emotionTag = newEmotionTag || null;
  }

  const { error: updateError } = await supabase
    .from("user_books")
    .update({
      status: newStatus,
      started_at: startedAt,
      finished_at: finishedAt,
      emotion_tag: emotionTag,
    })
    .eq("id", existing.id);

  if (updateError) {
    console.error("user_books PATCH update error:", updateError);
    return NextResponse.json(
      { error: "Failed to update status/emotion" },
      { status: 500 }
    );
  }

  // ── 목표(월별) 최신 진행률 포함 응답 ──
  // 이번 달 범위
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based
  const start = new Date(year, month, 1).toISOString().slice(0, 10);
  const end = new Date(year, month + 1, 0).toISOString().slice(0, 10);

  // 이번 달 완독 수
  const { count: finishedCount, error: finishedError } = await supabase
    .from("user_books")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "finished")
    .gte("finished_at", start)
    .lte("finished_at", end);

  if (finishedError) {
    console.error("user_books finished count error:", finishedError);
  }

  // 이번 달 목표
  const { data: goalRow, error: goalError } = await supabase
    .from("monthly_goals")
    .select("target")
    .eq("user_id", user.id)
    .eq("year", year)
    .eq("month", month + 1)
    .maybeSingle();

  if (goalError) {
    console.error("monthly_goals select in PATCH error:", goalError);
  }

  return NextResponse.json({
    ok: true,
    status: newStatus,
    started_at: startedAt,
    finished_at: finishedAt,
    emotion_tag: emotionTag,
    goal: {
      year,
      month: month + 1,
      target: goalRow?.target ?? null,
      progress: finishedCount ?? 0,
    },
  });
}
