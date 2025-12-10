// lib/hooks/useSupabaseUser.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 매 렌더마다 새 클라이언트 만드는 것 방지
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    let ignore = false;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!ignore) {
        setUser(data.user ?? null);
        setLoading(false);
      }
    }

    load();

    // 로그인/로그아웃/갱신 시 자동으로 user 상태 업데이트
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!ignore) {
          setUser(session?.user ?? null);
        }
      }
    );

    return () => {
      ignore = true;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  return { user, loading };
}
