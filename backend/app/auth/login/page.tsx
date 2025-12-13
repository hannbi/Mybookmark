"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pw,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    router.push("/"); // 성공 시 메인 페이지로 이동
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) setErrorMsg(error.message);
  }

  return (
    <main className="p-6 max-w-sm mx-auto space-y-6">
      <h1 className="text-xl font-bold">로그인</h1>

      <form onSubmit={handleLogin} className="space-y-3">
        <input
          type="email"
          className="w-full border p-2 rounded"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          className="w-full border p-2 rounded"
          placeholder="비밀번호"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 bg-black text-white rounded"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>

      {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}

      <div>
        <button
          onClick={handleGoogleLogin}
          className="w-full p-2 border rounded mt-2"
        >
          Google 계정으로 로그인
        </button>
      </div>

      <p className="text-sm text-zinc-600">
        아직 계정이 없나요?{" "}
        <a href="/auth/register" className="text-blue-600 underline">
          회원가입하기
        </a>
      </p>
    </main>
  );
}
