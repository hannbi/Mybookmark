// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 로그인 성공 → next 파라미터가 있으면 그쪽으로, 없으면 /
      const redirectUrl = new URL(next, origin);
      return NextResponse.redirect(redirectUrl);
    }

    console.error("exchangeCodeForSession error:", error);
  }

  // code 가 없거나, 세션 교환 중 에러가 난 경우 → 로그인 화면으로 보냄
  return NextResponse.redirect(new URL("/auth/login", origin));
}
