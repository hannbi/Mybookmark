import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import supabase from "../lib/supabaseClient";
import "../styles/Auth.css";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [nickname, setNickname] = useState("");

  const [step, setStep] = useState("request");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [message, setMessage] = useState("");

  // 🔹 인증 코드 보내기
  async function handleSendCode(e) {
    e.preventDefault();
    setErrorMsg("");
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setMessage("인증 코드가 이메일로 전송되었습니다.");
    setStep("verify");
  }

  // 🔹 인증 + 회원가입
  async function handleVerify(e) {
    e.preventDefault();
    setErrorMsg("");
    setMessage("");
    setLoading(true);

    if (pw !== pw2) {
      setErrorMsg("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "signup",
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    // 비밀번호 + 닉네임 저장
    await supabase.auth.updateUser({
      password: pw,
      data: {
        nickname,
        full_name: nickname,
      },
    });

    // profiles 테이블 저장
    await supabase.from("profiles").upsert({
      id: data.user.id,
      nickname,
    });

    setLoading(false);
    navigate("/login");
  }

  // 🔹 Google 회원가입
  async function handleGoogleRegister() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) setErrorMsg(error.message);
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">회원가입</h1>

        {step === "request" && (
          <form onSubmit={handleSendCode}>
            <input
              className="auth-input"
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "코드 전송 중..." : "인증 코드 보내기"}
            </button>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={handleVerify}>
            <input
              className="auth-input"
              placeholder="이메일 인증 코드"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />

            <input
              className="auth-input"
              type="password"
              placeholder="비밀번호"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              required
            />

            <input
              className="auth-input"
              type="password"
              placeholder="비밀번호 확인"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              required
            />

            <input
              className="auth-input"
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? "가입 처리 중..." : "인증 및 가입"}
            </button>
          </form>
        )}

        {message && <p className="auth-success">{message}</p>}
        {errorMsg && <p className="auth-error">{errorMsg}</p>}

        <button className="auth-google" onClick={handleGoogleRegister}>
          Google 계정으로 가입하기
        </button>

        <p className="auth-footer">
          이미 계정이 있나요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  );
}
