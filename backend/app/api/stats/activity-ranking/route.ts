// app/api/stats/activity-ranking/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ActivityStat = {
  userId: string;
  finishedCount: number;
  likeCount: number;
  commentCount: number;
  nickname: string;
  score: number;
};

const WEIGHTS = {
  finished: 0.5,
  comments: 0.3,
  likes: 0.2,
};

export async function GET() {
  const supabase = await createSupabaseServerClient();

  // 이번 달 범위 (서버 시간 기준)
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const startIso = start.toISOString();
  const nextMonthIso = nextMonth.toISOString();

  // 이번 달 완독 집계
  const { data: finishedRows, error: finishedError } = await supabase
    .from("user_books")
    .select("user_id")
    .eq("status", "finished")
    .gte("finished_at", startIso)
    .lt("finished_at", nextMonthIso);

  if (finishedError) {
    console.error("activity-ranking finished select error:", finishedError);
    return NextResponse.json(
      { error: "활동 랭킹을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  // 이번 달 공감(좋아요) 집계 - 인용문 공감 기준
  const { data: likeRows, error: likesError } = await supabase
    .from("quote_likes")
    .select("user_id")
    .gte("created_at", startIso)
    .lt("created_at", nextMonthIso);

  if (likesError) {
    console.error("activity-ranking likes select error:", likesError);
    return NextResponse.json(
      { error: "활동 랭킹을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  // 이번 달 댓글 집계 - 인용문 댓글 기준
  const { data: commentRows, error: commentsError } = await supabase
    .from("quote_comments")
    .select("user_id")
    .gte("created_at", startIso)
    .lt("created_at", nextMonthIso);

  if (commentsError) {
    console.error("activity-ranking comments select error:", commentsError);
    return NextResponse.json(
      { error: "활동 랭킹을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  // 유저별로 합산
  const map = new Map<
    string,
    { finished: number; likes: number; comments: number }
  >();

  (finishedRows ?? []).forEach((row) => {
    const uid = row.user_id as string | null;
    if (!uid) return;
    const stat = map.get(uid) ?? { finished: 0, likes: 0, comments: 0 };
    stat.finished += 1;
    map.set(uid, stat);
  });

  (likeRows ?? []).forEach((row) => {
    const uid = row.user_id as string | null;
    if (!uid) return;
    const stat = map.get(uid) ?? { finished: 0, likes: 0, comments: 0 };
    stat.likes += 1;
    map.set(uid, stat);
  });

  (commentRows ?? []).forEach((row) => {
    const uid = row.user_id as string | null;
    if (!uid) return;
    const stat = map.get(uid) ?? { finished: 0, likes: 0, comments: 0 };
    stat.comments += 1;
    map.set(uid, stat);
  });

  const userIds = Array.from(map.keys());
  let nicknameMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profileRows, error: profileError } = await supabase
      .from("profiles")
      .select("id, nickname")
      .in("id", userIds);

    if (profileError) {
      console.error("activity-ranking profiles select error:", profileError);
    } else {
      nicknameMap = new Map(
        (profileRows ?? []).map((row) => [
          row.id as string,
          (row.nickname as string | null) ?? "익명",
        ])
      );
    }
  }

  const ranks: ActivityStat[] = Array.from(map.entries())
    .map(([userId, stat]) => {
      const score =
        stat.finished * WEIGHTS.finished +
        stat.comments * WEIGHTS.comments +
        stat.likes * WEIGHTS.likes;
      return {
        userId,
        finishedCount: stat.finished,
        likeCount: stat.likes,
        commentCount: stat.comments,
        nickname: nicknameMap.get(userId) ?? "익명",
        score,
      };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.finishedCount !== a.finishedCount)
        return b.finishedCount - a.finishedCount;
      if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
      return b.commentCount - a.commentCount;
    })
    .slice(0, 5);

  return NextResponse.json({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    ranks,
    weights: WEIGHTS,
  });
}
