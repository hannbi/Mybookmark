"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [nickname, setNickname] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setMessage("");

    if (!email) {
      setErrorMsg("이메일을 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      });
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      setMessage("인증 코드가 이메일로 전송되었습니다. 메일함을 확인해 주세요.");
      setStep("verify");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyAndRegister(e: FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setMessage("");

    if (!code || code.length < 4) {
      setErrorMsg("이메일로 받은 인증 코드를 입력해 주세요.");
      return;
    }
    if (!pw || pw !== pw2) {
      setErrorMsg("비밀번호가 없거나 일치하지 않습니다.");
      return;
    }
    if (!nickname.trim()) {
      setErrorMsg("닉네임을 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
      });
      if (verifyError || !verifyData?.session) {
        setErrorMsg(verifyError?.message ?? "인증 코드 확인에 실패했습니다.");
        return;
      }

      const { error: pwError } = await supabase.auth.updateUser({
        password: pw,
        // Supabase Auth 메타데이터에도 닉네임을 저장해 콘솔 Display name에 보이도록
        data: {
          nickname: nickname.trim(),
          full_name: nickname.trim(),
        },
      });
      if (pwError) {
        setErrorMsg(pwError.message);
        return;
      }

      await supabase
        .from("profiles")
        .upsert({ id: verifyData.user?.id, nickname: nickname.trim() });

      setMessage("회원가입이 완료되었습니다. 메일 인증을 완료한 뒤 로그인하세요.");
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
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

      {step === "request" && (
        <form onSubmit={handleSendCode} className="space-y-3">
          <input
            type="email"
            className="w-full border p-2 rounded"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full p-2 bg-black text-white rounded"
          >
            {loading ? "코드 전송 중..." : "인증 코드 보내기"}
          </button>
        </form>
      )}

      {step === "verify" && (
        <form onSubmit={handleVerifyAndRegister} className="space-y-3">
          <input
            type="text"
            className="w-full border p-2 rounded"
            placeholder="이메일로 받은 인증 코드"
            value={code}
            onChange={(e) => setCode(e.target.value)}
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
          <input
            type="text"
            className="w-full border p-2 rounded"
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full p-2 bg-black text-white rounded"
          >
            {loading ? "가입 처리 중..." : "인증 및 가입"}
          </button>
        </form>
      )}

      {message && <p className="text-sm text-emerald-600">{message}</p>}
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
