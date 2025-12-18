// src/pages/BookDetail.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, User, ChevronDown } from "lucide-react";
import "../styles/BookDetail.css";

import LogoImg from "../assets/logo.png";
import blankGood from "../assets/blankgood.png";
import fillGood from "../assets/fillgood.png";
import blankBad from "../assets/blankbad.png";
import fillBad from "../assets/fillbad.png";

import blankHeart from "../assets/blankheart.png";
import fillHeart from "../assets/fillheart.png";
import blankSave from "../assets/blanksave.png";
import fillSave from "../assets/fillsave.png";
import commentIcon from "../assets/comment_icon.png";
import supabase from "../lib/supabaseClient";


export default function BookDetail() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const bookId = state?.bookId;

    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [nickname, setNickname] = useState("");

    const [showDropdown, setShowDropdown] = useState(false);
    const [reviewLike, setReviewLike] = useState({});
    const [reviewDislike, setReviewDislike] = useState({});
    const [quoteLike, setQuoteLike] = useState({});
    const [quoteSave, setQuoteSave] = useState({});

    const [reviews, setReviews] = useState([]);
    const [quotes, setQuotes] = useState([]);

    /* 해당 책의 리뷰 */
    useEffect(() => {
        if (!book) return;

        const fetchReviews = async () => {
            const { data, error } = await supabase
                .from("reviews")
                .select(`
        id,
        content,
        created_at,
        profiles ( nickname ),
        review_likes ( id, type )
      `)
                .eq("book_id", book.id)
                .order("created_at", { ascending: false });

            if (!error) setReviews(data);
        };

        fetchReviews();
    }, [book]);

    /* 해당 책의 한문장 */
    useEffect(() => {
        if (!book) return;

        const fetchQuotes = async () => {
            const { data, error } = await supabase
                .from("quotes")
                .select(`
        id,
        content,
        created_at,
        profiles ( nickname ),
        quote_likes ( id ),
        quote_comments ( id ),
        quote_saves ( id )
      `)
                .eq("book_id", book.id)
                .order("created_at", { ascending: false });

            if (!error) setQuotes(data);
        };

        fetchQuotes();
    }, [book]);


    useEffect(() => {
        if (!bookId) {
            setLoading(false);
            return;
        }

        const fetchBook = async () => {
            const { data, error } = await supabase
                .from("books")
                .select("*")
                .eq("id", bookId)
                .single();

            if (error) {
                console.error("책 조회 실패", error);
                setLoading(false);
                return;
            }

            setBook(data);
            setLoading(false);
        };

        fetchBook();
    }, [bookId]);


    useEffect(() => {
        let mounted = true;

        const loadUser = async () => {
            if (!mounted) return;

            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (!user) {
                setNickname("");
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("nickname")
                .eq("id", user.id)
                .maybeSingle();

            if (profile?.nickname) {
                setNickname(profile.nickname);
            }
        };

        loadUser();

        const { data: { subscription } } =
            supabase.auth.onAuthStateChange(() => {
                loadUser();
            });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    if (loading) {
        return <div className="detail-empty">불러오는 중...</div>;
    }

    if (!book) {
        return <div className="detail-empty">책 정보가 없습니다.</div>;
    }

    const saveToLibrary = async (status) => {
        if (!user) {
            alert("로그인이 필요합니다");
            navigate("/login");
            return;
        }

        const payload = {
            user_id: user.id,
            book_id: book.id,
            status,
        };

        if (status === "reading") {
            payload.started_at = new Date().toISOString().slice(0, 10);
        }

        if (status === "done") {
            const today = new Date().toISOString().slice(0, 10);
            payload.started_at = today;
            payload.finished_at = today;
        }

        const { error } = await supabase
            .from("user_books")
            .upsert(payload, {
                onConflict: "user_id,book_id",
            });

        if (error) {
            console.error(error);
            alert("서재 저장 실패");
            return;
        }

        navigate("/mylibrary");
    };



    return (
        <div className="detail-root">
            {/* ===== HEADER (Home과 동일 + 검색바) ===== */}
            <header className="home-header">
                <div className="home-container header-inner">
                    <nav className="header-left">
                        <button className="header-menu" onClick={() => navigate("/")}>
                            Home
                        </button>
                        <button className="header-menu" onClick={() => navigate("/mylibrary")}>
                            My Library
                        </button>
                    </nav>

                    <div className="header-logo">
                        <img src={LogoImg} alt="logo" className="header-logo-img" />
                        <span className="header-logo-text">My Bookmark</span>
                    </div>

                    <div className="header-right">
                        {!user ? (
                            <>
                                <button onClick={() => navigate("/login")}>로그인</button>
                                <span> / </span>
                                <button onClick={() => navigate("/register")}>회원가입</button>
                            </>
                        ) : (
                            <>
                                <User className="header-user-icon" />
                                <span>{nickname || "사용자"} 님</span>
                                <button
                                    className="header-auth-btn"
                                    onClick={async () => {
                                        await supabase.auth.signOut();
                                        setUser(null);
                                        setNickname("");
                                        navigate("/");
                                    }}
                                >
                                    | 로그아웃
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* 검색바 */}
                <div className="home-container header-search-wrap">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="제목이나 저자로 검색할 책을 입력해보세요"
                            className="search-input"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    navigate("/search");
                                }
                            }}
                        />
                        <button
                            type="button"
                            className="search-btn"
                            onClick={() => navigate("/search")}
                        >
                            <Search className="search-icon" />
                        </button>
                    </div>
                </div>
            </header>

            {/* ===== MAIN ===== */}
            <main className="detail-main">
                <div className="home-container detail-grid">
                    {/* ===== LEFT : BOOK IMAGE ===== */}
                    <div className="detail-left">
                        <div className="detail-book-card">
                            <img
                                src={book.cover}
                                alt={book.title}
                                className="detail-book-img"
                            />
                        </div>

                        {/* ISBN */}
                        <p className="detail-isbn">ISBN {book.isbn}</p>
                    </div>

                    {/* ===== RIGHT : INFO ===== */}
                    <div className="detail-right">
                        <span className="detail-category">{book.category}</span>
                        <h1 className="detail-title">{book.title}</h1>
                        <p className="detail-author">{book.author}</p>

                        <p className="detail-desc">
                            {book.description || "책 설명이 준비 중입니다."}
                        </p>

                        {/* ===== ACTION BUTTONS ===== */}
                        <div className="detail-buttons">
                            <button
                                className="btn-primary"
                                onClick={() => saveToLibrary("want")}
                            >
                                읽고 싶은 책
                            </button>

                            <div className="library-dropdown">
                                <button
                                    className="btn-outline dropdown-btn"
                                    onClick={() => setShowDropdown((prev) => !prev)}
                                >
                                    내 서재에 추가
                                    <ChevronDown size={16} />
                                </button>

                                {showDropdown && (
                                    <div className="dropdown-menu">
                                        <button onClick={() => saveToLibrary("reading")}>읽는 중</button>
                                        <button onClick={() => saveToLibrary("done")}>다 읽음</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <section className="detail-review-section">
                    <div className="home-container">
                        <h2 className="detail-section-title">이 책의 리뷰</h2>

                        <div className="detail-card-grid">
                            {reviews.map((r) => (
                                <div key={r.id} className="detail-card">
                                    <span className="detail-user">
                                        {r.profiles?.nickname || "익명"} 님
                                    </span>

                                    <p className="detail-text">“{r.content}”</p>

                                    <div className="detail-divider" />

                                    <div className="detail-actions">
                                        {/* 👍 좋아요 */}
                                        <button className="icon-btn">
                                            <img src={blankGood} alt="like" />
                                            <span>
                                                {r.review_likes?.filter(l => l.type === "like").length || 0}
                                            </span>
                                        </button>

                                        {/* 👎 싫어요 */}
                                        <button className="icon-btn">
                                            <img src={blankBad} alt="dislike" />
                                            <span>
                                                {r.review_likes?.filter(l => l.type === "dislike").length || 0}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="detail-more-btn">리뷰 더보기</div>
                    </div>
                </section>

                <section className="detail-quote-section">
                    <div className="home-container">
                        <h2 className="detail-section-title">책 속 한 구절</h2>

                        <div className="detail-card-grid">
                            {quotes.map((q) => (
                                <div key={q.id} className="detail-card">
                                    <span className="detail-user">
                                        {q.profiles?.nickname || "익명"} 님
                                    </span>

                                    <p className="detail-text">“{q.content}”</p>

                                    <div className="detail-divider" />

                                    <div className="detail-actions">
                                        {/* 댓글 */}
                                        <button
                                            className="icon-btn"
                                            onClick={() => {
                                                setActiveQuote(q);
                                                setShowCommentModal(true);
                                            }}
                                        >
                                            <img src={commentIcon} alt="comment" />
                                            <span>{q.quote_comments?.length || 0}</span>
                                        </button>

                                        {/* 좋아요 */}
                                        <button className="icon-btn">
                                            <img src={blankHeart} alt="heart" />
                                            <span>{q.quote_likes?.length || 0}</span>
                                        </button>

                                        {/* 저장 */}
                                        <button className="icon-btn">
                                            <img src={blankSave} alt="save" />
                                            <span>저장</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="detail-more-btn">문장 더보기</div>
                    </div>
                </section>
            </main>
        </div>
    );
}
