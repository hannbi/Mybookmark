// components/AppHeader.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type NavItem = {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Home",
    isActive: (pathname) => pathname === "/",
  },
  {
    href: "/mylibrary",
    label: "My Library",
    isActive: (pathname) => pathname.startsWith("/mylibrary"),
  },
];

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = item.isActive(pathname);
  return (
    <Link
      href={item.href}
      className={`text-xs md:text-sm px-2 py-1 rounded ${
        active
          ? "font-semibold text-zinc-900 bg-zinc-100"
          : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
      }`}
    >
      {item.label}
    </Link>
  );
}

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSupabaseUser();
  const [signingOut, setSigningOut] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);

  // 닉네임 불러오기 (profiles.nickname 우선)
  // 닉네임 불러오기 (profiles.nickname 우선)
  useEffect(() => {
    if (!user) {
      setDisplayName(null);
      return;
    }
    const supabase = createSupabaseBrowserClient();
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", user.id)
          .maybeSingle();

        if (data?.nickname) {
          setDisplayName(data.nickname);
        } else {
          const metaName =
            (user.user_metadata as any)?.nickname ||
            (user.user_metadata as any)?.full_name ||
            user.email;
          setDisplayName(metaName);
        }
      } catch (err) {
        setDisplayName(user?.email ?? null);
      }
    })();
  }, [user]);

  async function handleLogout() {
    try {
      setSigningOut(true);
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.refresh(); // 서버 컴포넌트들 갱신
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {/* 왼쪽: 네비게이션 */}
        <nav className="flex items-center gap-3">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        {/* 가운데: 로고/서비스명 */}
        <Link
          href="/"
          className="flex items-center gap-2 text-base md:text-lg font-semibold tracking-tight text-amber-700"
        >
          📚 <span>My Bookmark</span>
        </Link>

        {/* 오른쪽: 로그인 상태 */}
        <div className="flex items-center gap-2 text-xs md:text-sm">
          {user ? (
            <>
              <span className="hidden sm:inline text-zinc-600 max-w-[160px] truncate">
                {displayName ?? user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={signingOut}
                className="rounded border px-2 py-1 bg-white hover:bg-zinc-50"
              >
                {signingOut ? "로그아웃 중..." : "로그아웃"}
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-zinc-700 hover:underline">
                로그인
              </Link>
              <span className="text-zinc-300">/</span>
              <Link href="/auth/register" className="text-zinc-700 hover:underline">
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
