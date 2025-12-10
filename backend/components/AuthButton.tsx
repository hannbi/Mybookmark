// components/AuthButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";

export default function AuthButton() {
  const router = useRouter();
  const { user, loading } = useSupabaseUser();
  const supabase = createSupabaseBrowserClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/");   // 로그아웃 후 원하는 곳으로 이동
  }

  if (loading) {
    return <span className="text-sm text-zinc-500">확인 중...</span>;
  }

  if (!user) {
    // 로그인 안 된 상태
    return (
      <div className="flex items-center gap-2 text-sm">
        <a href="/auth/login" className="underline">
          로그인
        </a>
        <span>/</span>
        <a href="/auth/register" className="underline">
          회원가입
        </a>
      </div>
    );
  }

  // 로그인 된 상태
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-zinc-600">{user.email}</span>
      <button
        onClick={handleLogout}
        className="rounded border px-2 py-1 text-xs"
      >
        로그아웃
      </button>
    </div>
  );
}
