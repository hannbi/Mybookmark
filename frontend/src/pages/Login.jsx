import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import supabase from "../lib/supabaseClient";
import "../styles/Auth.css";

export default function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [nickname, setNickname] = useState("");
    const [step, setStep] = useState("login");
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (userError || !user) {
                    setCheckingAuth(false);
                    return;
                }

                setUser(user);

                // profiles 테이블에서 닉네임 확인
                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("nickname")
                    .eq("id", user.id)
                    .single();

                if (profileError || !profile || !profile.nickname) {
                    // 닉네임이 없으면 닉네임 설정 단계로
                    console.log("닉네임 미설정 → 닉네임 입력 단계");
                    setStep("nickname");
                } else {
                    // 닉네임이 있으면 홈으로
                    console.log("이미 로그인된 사용자:", profile.nickname);
                    navigate("/");
                }
            } catch (err) {
                console.error("사용자 로드 중 오류:", err);
            } finally {
                setCheckingAuth(false);
            }
        };

        loadUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Auth 상태 변경:", event);
            if (event === 'SIGNED_IN') {
                loadUser();
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);


    async function handleLogin(e) {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: pw,
        });

        if (error) {
            if (error.message === "Invalid login credentials") {
                setErrorMsg("이메일 또는 비밀번호가 올바르지 않습니다.");
            } else {
                setErrorMsg("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
            }
            setLoading(false);
            return;
        }

        navigate("/"); // Home으로 이동
    }

    async function handleGoogleLogin() {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            },
        });

        if (error) {
            setErrorMsg("구글 로그인 중 오류가 발생했습니다.");
        }
    }
    if (checkingAuth) {
        return (
            <div className="auth-wrapper">
                <div className="auth-card">
                    <h1 className="auth-title">로딩 중...</h1>
                </div>
            </div>
        );
    }
    return (
        <div className="auth-wrapper">
            <div className="auth-card">

                {/* ===== 로그인 화면 ===== */}
                {step === "login" && (
                    <>
                        <h1 className="auth-title">로그인</h1>

                        <form onSubmit={handleLogin}>
                            <input
                                className="auth-input"
                                type="email"
                                placeholder="이메일"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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

                            <p className="auth-forgot">
                                <Link to="/reset-password">비밀번호를 잊으셨나요?</Link>
                            </p>

                            <button className="auth-btn" type="submit" disabled={loading}>
                                {loading ? "로그인 중..." : "로그인"}
                            </button>
                        </form>

                        {errorMsg && <p className="auth-error">{errorMsg}</p>}

                        <button className="auth-google" onClick={handleGoogleLogin}>
                            Google 계정으로 로그인
                        </button>

                        <p className="auth-footer">
                            아직 계정이 없나요? <Link to="/register">회원가입</Link>
                        </p>
                    </>
                )}

                {/* ===== 닉네임 설정 화면 (Google 로그인 후) ===== */}
                {step === "nickname" && (
                    <>
                        <h1 className="auth-title">닉네임 설정</h1>

                        <p className="auth-desc">
                            서비스에서 사용할 닉네임을 입력해주세요
                        </p>

                        <input
                            className="auth-input"
                            placeholder="닉네임"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                        />

                        {errorMsg && <p className="auth-error">{errorMsg}</p>}

                        <button
                            className="auth-btn"
                            onClick={async () => {
                                if (!nickname.trim()) {
                                    setErrorMsg("닉네임을 입력해 주세요.");
                                    return;
                                }

                                setLoading(true);
                                setErrorMsg("");

                                try {
                                    // 1. auth.users의 user_metadata 업데이트
                                    const { error: updateError } = await supabase.auth.updateUser({
                                        data: {
                                            nickname: nickname.trim(),
                                            full_name: nickname.trim()
                                        },
                                    });

                                    if (updateError) throw updateError;

                                    // 2. profiles 테이블에 저장/업데이트
                                    const { error: upsertError } = await supabase
                                        .from("profiles")
                                        .upsert({
                                            id: user.id,
                                            nickname: nickname.trim(),
                                        }, {
                                            onConflict: 'id'
                                        });

                                    if (upsertError) throw upsertError;

                                    console.log("닉네임 저장 완료:", nickname.trim());
                                    navigate("/");
                                } catch (err) {
                                    console.error("닉네임 저장 오류:", err);
                                    setErrorMsg("닉네임 저장 중 오류가 발생했습니다.");
                                } finally {
                                    setLoading(false);
                                }
                            }}
                        >
                            저장하고 시작하기
                        </button>
                    </>
                )}

            </div>
        </div>
    );

}