"use client";

import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";

export default function AuthTestPage() {
  const { user, loading } = useSupabaseUser();

  if (loading) {
    return <main className="p-4">로그인 상태 확인 중...</main>;
  }

  if (!user) {
    return <main className="p-4">로그인되어 있지 않습니다.</main>;
  }

  return (
    <main className="p-4 space-y-2">
      <div>로그인됨</div>
      <div>사용자 ID: {user.id}</div>
      <div>이메일: {user.email}</div>
    </main>
  );
}
