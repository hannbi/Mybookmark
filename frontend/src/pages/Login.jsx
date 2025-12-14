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


    useEffect(() => {
        const loadUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setUser(user);

            const { data: profile } = await supabase
                .from("profiles")
                .select("nickname")
                .eq("id", user.id)
                .single();

            if (!profile?.nickname) {
                setStep("nickname");
            } else {
                navigate("/");
            }
        };

        loadUser();

        const { data: { subscription } } =
            supabase.auth.onAuthStateChange(() => {
                loadUser();
            });

        return () => subscription.unsubscribe();
    }, []);


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
                redirectTo: window.location.origin
            },
        });

        if (error) {
            setErrorMsg("구글 로그인 중 오류가 발생했습니다.");
        }
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

                                try {
                                    await supabase.auth.updateUser({
                                        data: { nickname, full_name: nickname },
                                    });

                                    await supabase.from("profiles").upsert({
                                        id: user.id,
                                        nickname,
                                    });

                                    navigate("/");
                                } catch {
                                    setErrorMsg("닉네임 저장 중 오류가 발생했습니다.");
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