// src/pages/AuthCallback.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../lib/supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 1. 현재 로그인된 사용자 가져오기
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("사용자 정보 로드 실패:", userError);
          navigate("/login");
          return;
        }

        // 2. profiles 테이블에서 닉네임 확인
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", user.id)
          .single();

        // 3. 닉네임이 없으면 로그인 페이지로 (닉네임 설정 단계로)
        if (profileError || !profile || !profile.nickname) {
          console.log("닉네임 미설정 → 로그인 페이지로 이동");
          navigate("/login");
          return;
        }

        // 4. 닉네임이 있으면 홈으로
        console.log("닉네임 확인 완료:", profile.nickname);
        navigate("/");

      } catch (err) {
        console.error("콜백 처리 중 오류:", err);
        navigate("/login");
      } finally {
        setChecking(false);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1 className="auth-title">
          {checking ? "로그인 처리 중..." : "리디렉션 중..."}
        </h1>
        <p style={{ textAlign: "center", color: "#7b6f64" }}>
          잠시만 기다려 주세요
        </p>
      </div>
    </div>
  );
}