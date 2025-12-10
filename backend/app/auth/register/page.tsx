"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (pw !== pw2) {
      setErrorMsg("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password: pw,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    alert("회원가입 완료! 이메일을 확인하세요.");
    router.push("/auth/login");
  }

  async function handleGoogleRegister() {
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
      <h1 className="text-xl font-bold">회원가입</h1>

      <form onSubmit={handleRegister} className="space-y-3">
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

        <input
          type="password"
          className="w-full border p-2 rounded"
          placeholder="비밀번호 확인"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 bg-black text-white rounded"
        >
          {loading ? "가입 중..." : "회원가입"}
        </button>
      </form>

      {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}

      <div>
        <button
          onClick={handleGoogleRegister}
          className="w-full p-2 border rounded mt-2"
        >
          Google 계정으로 가입하기
        </button>
      </div>

      <p className="text-sm text-zinc-600">
        이미 계정이 있나요?{" "}
        <a href="/auth/login" className="text-blue-600 underline">
          로그인하기
        </a>
      </p>
    </main>
  );
}
