// app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET /api/reviews?bookId=123  → 해당 책의 리뷰 목록
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");

  if (!bookId) {
    return NextResponse.json(
      { error: "bookId is required" },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();

  // 먼저 현재 유저 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 리뷰 목록 + likes_count
  const { data, error } = await supabase
    .from("reviews")
    .select("id, user_id, content, rating, likes_count, created_at")
    .eq("book_id", Number(bookId))
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json(
      { error: "Failed to load reviews" },
      { status: 500 }
    );
  }

  let likedSet = new Set<number>();

  // 로그인 상태라면 내가 좋아요 찍은 리뷰 목록 조회
  if (user && data && data.length > 0) {
    const ids = data.map((r) => r.id);

    const { data: likedRows, error: likedError } = await supabase
      .from("review_likes")
      .select("review_id")
      .eq("user_id", user.id)
      .in("review_id", ids);

    if (likedError) {
      console.error("review_likes select error:", likedError);
    } else if (likedRows) {
      likedSet = new Set(likedRows.map((r) => r.review_id as number));
    }
  }

  const result = (data ?? []).map((r) => ({
    ...r,
    likedByMe: likedSet.has(r.id),
  }));

  return NextResponse.json({ reviews: result });
}


// body: { bookId: number, rating: number(1~5), content: string }
// POST /api/reviews
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("auth getUser error in POST /api/reviews:", userError);
  }

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // ✅ FK 가 profiles.id 를 바라보므로, 닉네임까지 포함해서 프로필을 보장
  try {
    const defaultNickname =
      user.user_metadata?.full_name ||
      user.email ||
      "사용자";

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          nickname: defaultNickname, // ⭐ NOT NULL 컬럼 채우기
        },
        { onConflict: "id" }
      );

    if (profileError) {
      console.error(
        "profiles upsert error before inserting review:",
        profileError
      );
      return NextResponse.json(
        { error: "Failed to prepare user profile for review" },
        { status: 500 }
      );
    }
  } catch (e) {
    console.error("profiles upsert exception:", e);
    return NextResponse.json(
      { error: "Failed to prepare user profile for review" },
      { status: 500 }
    );
  }

  // ↓↓↓ 아래부터는 그대로 (기존 POST 로직) ↓↓↓
  const body = (await request.json().catch(() => null)) as {
    bookId?: number | string;
    rating?: number;
    content?: string;
  } | null;

  const bookIdRaw = body?.bookId;
  const rating = body?.rating;
  const content = body?.content?.trim();

  if (!bookIdRaw || !rating || !content) {
    return NextResponse.json(
      { error: "bookId, rating, and content are required" },
      { status: 400 }
    );
  }

  const bookId = Number(bookIdRaw);
  if (!Number.isFinite(bookId)) {
    return NextResponse.json({ error: "Invalid bookId" }, { status: 400 });
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "rating must be between 1 and 5" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      user_id: user.id,
      book_id: bookId,
      rating,
      content,
    })
    .select("id, user_id, content, rating, created_at")
    .single();

  if (error) {
    console.error("POST /api/reviews insert error:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }

  return NextResponse.json({ review: data }, { status: 201 });
}


// DELETE /api/reviews
// body: { reviewId: number }
export async function DELETE(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("auth getUser error in DELETE /api/reviews:", userError);
  }

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    reviewId?: number;
  } | null;

  const reviewId = body?.reviewId;

  if (!reviewId) {
    return NextResponse.json(
      { error: "reviewId is required" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", user.id);

  if (error) {
    console.error("DELETE /api/reviews error:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}


// body: { reviewId: number, content: string, rating: number(1~5) }
// PATCH /api/reviews
export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseServerClient();

  // 로그인 유저 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("reviews PATCH getUser error:", userError);
  }

  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  // 요청 바디 파싱
  const body = await req.json().catch(() => null);
  const { reviewId, content, rating } = body ?? {};

  if (!reviewId || !content || !rating) {
    return NextResponse.json(
      { error: "필수 값이 누락되었습니다." },
      { status: 400 }
    );
  }

  // 본인 리뷰만 수정
  const { data, error } = await supabase
    .from("reviews")
    .update({
      content,
      rating,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .eq("user_id", user.id)
    .select(
      `
      id,
      user_id,
      book_id,
      content,
      rating,
      likes_count,
      created_at,
      updated_at
    `
    )
    .single();

  if (error || !data) {
    console.error("reviews PATCH error:", error);
    return NextResponse.json(
      { error: "리뷰 수정에 실패했습니다." },
      { status: 500 }
    );
  }

  // 프론트에서 res.json() 으로 받을 수 있게 JSON 반환
  return NextResponse.json({ review: data });
}