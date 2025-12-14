import { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../lib/supabaseClient";
import "../styles/Auth.css";

export default function UpdatePassword() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleUpdate(e) {
    e.preventDefault();

    if (pw !== pw2) {
      setErrorMsg("비밀번호가 일치하지 않습니다.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: pw,
    });

    if (error) {
      setErrorMsg("비밀번호 변경에 실패했습니다.");
      return;
    }

    navigate("/login");
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">새 비밀번호 설정</h1>

        <form onSubmit={handleUpdate}>
          <input
            className="auth-input"
            type="password"
            placeholder="새 비밀번호"
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

          <button className="auth-btn" type="submit">
            비밀번호 변경
          </button>
        </form>

        {errorMsg && <p className="auth-error">{errorMsg}</p>}
      </div>
    </div>
  );
}
