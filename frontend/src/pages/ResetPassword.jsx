import { useState } from "react";
import supabase from "../lib/supabaseClient";
import "../styles/Auth.css";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      setErrorMsg("비밀번호 재설정 메일 전송에 실패했습니다.");
      setLoading(false);
      return;
    }

    setMessage("비밀번호 재설정 메일을 보냈습니다. 메일함을 확인해 주세요.");
    setLoading(false);
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">비밀번호 찾기</h1>

        <form onSubmit={handleReset}>
          <input
            className="auth-input"
            type="email"
            placeholder="가입한 이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "전송 중..." : "비밀번호 재설정 메일 전송"}
          </button>
        </form>

        {message && <p className="auth-success">{message}</p>}
        {errorMsg && <p className="auth-error">{errorMsg}</p>}
      </div>
    </div>
  );
}
