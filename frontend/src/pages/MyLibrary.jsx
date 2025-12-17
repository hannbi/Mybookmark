// src/pages/MyLibrary.jsx

import React, { useState, useEffect } from "react";
import { Search, User, ChevronDown } from "lucide-react";
import "./../styles/MyLibrary.css";
import { useNavigate } from "react-router-dom";

import LogoImg from "../assets/logo.png";
import bookIcon from "../assets/book_icon.png";
import textIcon from "../assets/text_icon.png";
import commentIcon from "../assets/comment_icon.png";
import blankHeart from "../assets/blankheart.png";
import fillHeart from "../assets/fillheart.png";
import blankSave from "../assets/blanksave.png";
import fillSave from "../assets/fillsave.png";
import binIcon from "../assets/bin.png";

import supabase from "../lib/supabaseClient";
import RecordModal from "../components/RecordModal";

export default function MyLibrary() {
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [user, setUser] = useState(null);
    const [nickname, setNickname] = useState("");
    const [myBooks, setMyBooks] = useState([]);

    const [showRecordModal, setShowRecordModal] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);

    const [selectedTab, setSelectedTab] = useState("all");
    const [sortBy, setSortBy] = useState("recent");

    const [monthlyGoal, setMonthlyGoal] = useState(5);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [tempGoal, setTempGoal] = useState(5);
    const [likedMap, setLikedMap] = useState({});
    const [savedQuotes, setSavedQuotes] = useState([]);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [activeQuote, setActiveQuote] = useState(null);
    const [commentInput, setCommentInput] = useState("");
    const [myComments, setMyComments] = useState([]);
    const [myReviews, setMyReviews] = useState([]);
    const [myQuotes, setMyQuotes] = useState([]);

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");

    const showToastMessage = (message) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
    };

    /* 내가 작성한 리뷰 불러오기 */
    const fetchMyReviews = async (userId) => {
        const { data, error } = await supabase
            .from("reviews")
            .select(`
      id,
      content,
      likes_count,
      created_at,
      books (
        title,
        author
      )
    `)
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (!error) setMyReviews(data);
    };


    /* 내가 작성한 책 속 한 문장*/
    const fetchMyQuotes = async (userId) => {
        const { data, error } = await supabase
            .from("quotes")
            .select(`
      id,
      content,
      created_at,
      books (
        title,
        author
      ),
      quote_likes ( id ),
      quote_comments ( id )
    `)
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (!error) setMyQuotes(data);
    };


    useEffect(() => {
        if (!user) return;

        const fetchSavedQuotes = async () => {
            const { data, error } = await supabase
                .from("quote_saves")
                .select(`
                created_at,
                quotes (
                    id,
                    content,
                    books ( title, author ),
                    profiles ( nickname )
                )
            `)
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("저장한 문장 불러오기 실패", error);
                return;
            }

            console.log("불러온 데이터:", data); // 디버깅용

            const formatted = data.map(row => ({
                id: row.quotes.id,
                quote: row.quotes.content,
                book: row.quotes.books?.title || "제목 없음",
                author: row.quotes.books?.author || "저자 미상",
                user: row.quotes.profiles?.nickname || "익명",
            }));

            console.log("포맷된 데이터:", formatted); // 디버깅용
            setSavedQuotes(formatted);
        };

        fetchSavedQuotes();
    }, [user]);


    useEffect(() => {
        if (!user) return;

        const fetchMyComments = async () => {
            const { data, error } = await supabase
                .from("quote_comments")
                .select(`
        id,
        content,
        created_at,
        quotes (
          content,
          books ( title, author )
        )
      `)
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error(error);
                return;
            }

            setMyComments(data || []);
        };

        fetchMyComments();
    }, [user]);

    useEffect(() => {
        let mounted = true;

        const loadUserAndData = async () => {
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

            fetchMyReviews(user.id);
            fetchMyQuotes(user.id);
        };

        loadUserAndData();

        const { data: { subscription } } =
            supabase.auth.onAuthStateChange(() => {
                loadUserAndData();
            });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const removeFromLibrary = async (bookId) => {
        if (!user) return;

        const { error } = await supabase
            .from("user_books")
            .delete()
            .eq("user_id", user.id)
            .eq("book_id", bookId);

        if (error) {
            console.error("삭제 실패", error);
            alert("서재에서 삭제 실패");
            return;
        }

        setMyBooks(prev => prev.filter(b => b.id !== bookId));
    };


    /* 저장 취소 */
    const handleUnsaveQuote = async (quoteId) => {
        if (!user) return;

        const { error } = await supabase
            .from("quote_saves")
            .delete()
            .eq("user_id", user.id)
            .eq("quote_id", quoteId);

        if (error) {
            console.error("저장 취소 실패", error);
            return;
        }

        setSavedQuotes(prev => prev.filter(q => q.id !== quoteId));
        showToastMessage("저장이 취소되었습니다");
    };


    /* 내가 작성한 문장 삭제 */
    const handleDeleteMyQuote = async (quoteId) => {
        if (!user) return;

        const { error } = await supabase
            .from("quotes")
            .delete()
            .eq("id", quoteId)
            .eq("user_id", user.id);

        if (error) {
            console.error("문장 삭제 실패", error);
            return;
        }

        setMyQuotes(prev => prev.filter(q => q.id !== quoteId));
        showToastMessage("문장이 삭제되었습니다");
    };

    /* 내가 작성한 댓글 삭제 */
    const handleDeleteMyComment = async (commentId) => {
        if (!user) return;

        const { error } = await supabase
            .from("quote_comments")
            .delete()
            .eq("id", commentId)
            .eq("user_id", user.id);

        if (error) {
            console.error("댓글 삭제 실패", error);
            return;
        }

        // myComments 다시 불러오기 (id가 없어서)
        const { data } = await supabase
            .from("quote_comments")
            .select(`
      id,
      content,
      created_at,
      quotes (
        content,
        books ( title, author )
      )
    `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        setMyComments(data || []);
        showToastMessage("댓글이 삭제되었습니다");
    };

    /* 내가 작성한 리뷰 삭제 */
    const handleDeleteMyReview = async (reviewId) => {
        if (!user) return;

        const { error } = await supabase
            .from("reviews")
            .delete()
            .eq("id", reviewId)
            .eq("user_id", user.id);

        if (error) {
            console.error("리뷰 삭제 실패", error);
            return;
        }

        setMyReviews(prev => prev.filter(r => r.id !== reviewId));
        showToastMessage("리뷰가 삭제되었습니다");
    };






    // 월별 독서량 데이터 (최근 6개월)
    const monthlyReadingData = [
        { month: "7월", count: 4 },
        { month: "8월", count: 6 },
        { month: "9월", count: 3 },
        { month: "10월", count: 5 },
        { month: "11월", count: 7 },
        { month: "12월", count: 3 }
    ];


    // 책 필터링 및 정렬
    const getFilteredBooks = () => {
        let filtered = myBooks;

        if (selectedTab !== "all") {
            filtered = filtered.filter(book => book.status === selectedTab);
        }

        if (sortBy === "recent") {
            filtered = [...filtered].sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at)
            );
        } else if (sortBy === "title") {
            filtered = [...filtered].sort((a, b) =>
                a.title.localeCompare(b.title)
            );
        }

        return filtered;
    };

    // 대글 작성 함수
    const handleCommentSubmit = async () => {
        if (!user || !activeQuote || !commentInput.trim()) return;

        const { error } = await supabase
            .from("quote_comments")
            .insert({
                user_id: user.id,
                quote_id: activeQuote.id,
                content: commentInput.trim(),
            });

        if (error) {
            console.error("댓글 작성 실패", error);
            return;
        }

        setCommentInput("");
        setShowCommentModal(false);
    };

    // 상태별 개수 계산
    const bookCounts = {
        all: myBooks.length,
        want: myBooks.filter(b => b.status === "want").length,
        reading: myBooks.filter(b => b.status === "reading").length,
        done: myBooks.filter(b => b.status === "done").length
    };

    // 이달의 완독 권수
    const now = new Date();
    const currentMonthDone = myBooks.filter(b =>
        b.status === "done" &&
        b.finished_at &&
        new Date(b.finished_at).getMonth() === now.getMonth() &&
        new Date(b.finished_at).getFullYear() === now.getFullYear()
    ).length;

    // Pie Chart 데이터
    const pieData = [
        { label: "읽고싶어요", value: bookCounts.want, color: "#D65E18" },
        { label: "읽는중", value: bookCounts.reading, color: "#e6986aff" },
        { label: "다 읽음", value: bookCounts.done, color: "#eaba9eff" }
    ];

    const polarToCartesian = (cx, cy, r, angle) => {
        const rad = (angle - 90) * Math.PI / 180;
        return {
            x: cx + r * Math.cos(rad),
            y: cy + r * Math.sin(rad),
        };
    };

    const describeArc = (cx, cy, r, startAngle, endAngle) => {
        const start = polarToCartesian(cx, cy, r, endAngle);
        const end = polarToCartesian(cx, cy, r, startAngle);
        const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

        return `
      M ${cx} ${cy}
      L ${start.x} ${start.y}
      A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}
      Z
    `;
    };

    const toggleLike = (id) => {
        setLikedMap((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const handleGoalSave = () => {
        setMonthlyGoal(tempGoal);
        setIsEditingGoal(false);
    };

    useEffect(() => {
        if (!user) return;

        const fetchMyBooks = async () => {
            const { data, error } = await supabase
                .from("user_books")
                .select(`
        status,
        started_at,
        finished_at,
        created_at,
        books (
          id,
          title,
          author,
          cover,
          category
        )
      `)
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("서재 조회 실패", error);
                return;
            }

            // 프론트에서 쓰기 좋게 평탄화
            const formatted = data.map(row => ({
                id: row.books.id,
                title: row.books.title,
                author: row.books.author,
                cover: row.books.cover,
                category: row.books.category,
                status: row.status,
                started_at: row.started_at,
                finished_at: row.finished_at,
                created_at: row.created_at,
            }));

            setMyBooks(formatted);
        };

        fetchMyBooks();
    }, [user]);

    return (
        <div className="mylibrary-root">
            {/* ===== HEADER ===== */}
            <header className="mylibrary-header">
                <div className="mylibrary-container header-inner">
                    <nav className="header-left">
                        <button className="header-menu" onClick={() => navigate("/")}>
                            Home
                        </button>
                        <button className="header-menu active">My Library</button>
                    </nav>

                    <div className="header-logo">
                        <img src={LogoImg} alt="logo" className="header-logo-img" />
                        <span className="header-logo-text">My Bookmark</span>
                    </div>

                    <div className="header-right">
                        {!user ? (
                            <>
                                <button
                                    className="header-auth-btn"
                                    onClick={() => navigate("/login")}
                                >
                                    로그인
                                </button>
                                <span className="header-divider"> / </span>
                                <button
                                    className="header-auth-btn"
                                    onClick={() => navigate("/register")}
                                >
                                    회원가입
                                </button>
                            </>
                        ) : (
                            <>
                                <User size={18} />
                                <span className="header-username">
                                    {nickname || "사용자"} 님
                                </span>
                                <button
                                    className="header-auth-btn"
                                    onClick={async () => {
                                        await supabase.auth.signOut();
                                        setUser(null);
                                        setNickname("");
                                    }}
                                >
                                    | 로그아웃
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="mylibrary-container header-search-wrap">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="제목이나 저자로 검색할 책을 입력해보세요"
                            className="search-input"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && query.trim()) {
                                    navigate(`/search?q=${encodeURIComponent(query)}`);
                                }
                            }}
                        />
                        <button
                            type="button"
                            className="search-btn"
                            onClick={() => {
                                if (query.trim()) {
                                    navigate(`/search?q=${encodeURIComponent(query)}`);
                                }
                            }}
                        >
                            <Search className="search-icon" />
                        </button>
                    </div>
                </div>
            </header>

            <main>
                {/* ===== 서재 타이틀 ===== */}
                <section className="library-hero">
                    <div className="mylibrary-container">
                        <h1 className="library-hero-title">
                            {nickname || "사용자"} 님의 서재입니다
                        </h1>
                        <p className="library-hero-sub">
                            나만의 책장을 채워나가고, 독서 여정을 기록해보세요
                        </p>
                    </div>
                </section>

                {/* ===== 책 목록 섹션 ===== */}
                <section className="section section-white">
                    <div className="mylibrary-container">
                        <div className="section-title-row">
                            <img src={bookIcon} alt="book" className="section-icon-img" />
                            <h2 className="section-title">나의 책 목록</h2>
                        </div>

                        {/* 탭 + 정렬 */}
                        <div className="book-controls">
                            <div className="book-tabs">
                                <button
                                    className={`book-tab ${selectedTab === "all" ? "active" : ""}`}
                                    onClick={() => setSelectedTab("all")}
                                >
                                    전체 <span className="tab-count">{bookCounts.all}</span>
                                </button>
                                <button
                                    className={`book-tab ${selectedTab === "want" ? "active" : ""}`}
                                    onClick={() => setSelectedTab("want")}
                                >
                                    읽고싶어요 <span className="tab-count">{bookCounts.want}</span>
                                </button>
                                <button
                                    className={`book-tab ${selectedTab === "reading" ? "active" : ""}`}
                                    onClick={() => setSelectedTab("reading")}
                                >
                                    읽는중 <span className="tab-count">{bookCounts.reading}</span>
                                </button>
                                <button
                                    className={`book-tab ${selectedTab === "done" ? "active" : ""}`}
                                    onClick={() => setSelectedTab("done")}
                                >
                                    다 읽음 <span className="tab-count">{bookCounts.done}</span>
                                </button>
                            </div>

                            <div className="book-sort">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="sort-select"
                                >
                                    <option value="recent">최근 추가순</option>
                                    <option value="title">제목순</option>
                                </select>
                            </div>
                        </div>

                        {/* 책 그리드 */}
                        <div className="mybook-grid">
                            {getFilteredBooks().map((book) => (
                                <div
                                    key={book.id}
                                    className="mybook-item"
                                    onClick={() => navigate("/book", { state: { bookId: book.id } })}
                                >
                                    <button
                                        className="remove-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFromLibrary(book.id);
                                        }}
                                    >
                                        ✕
                                    </button>
                                    <div className="mybook-img-wrap">
                                        <img
                                            src={book.cover}
                                            alt={book.title}
                                            className="mybook-img"
                                        />
                                        <div className={`book-status-badge status-${book.status}`}>
                                            {book.status === "want" && "읽고싶어요"}
                                            {book.status === "reading" && "읽는중"}
                                            {book.status === "done" && "완독"}
                                        </div>
                                    </div>
                                    <div className="mybook-info">
                                        <p className="mybook-title">{book.title}</p>
                                        <p className="mybook-author">{book.author}</p>
                                    </div>
                                    {book.status === "done" && (
                                        <button
                                            className="record-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedBook(book);
                                                setShowRecordModal(true);
                                            }}
                                        >
                                            기록하기
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ===== 독서 통계 섹션 ===== */}
                <section className="section section-gray">
                    <div className="mylibrary-container">
                        {/* 섹션 타이틀 추가 */}
                        <div className="section-title-row2">
                            <h2 className="section-title">📈 독서 통계 & 목표</h2>
                            <span className="section-sub">
                                목표 설정부터 독서 현황까지 한눈에 확인해보세요
                            </span>
                        </div>
                        <div className="stats-grid">

                            {/* 이달의 목표 */}
                            <div className="card stat-card">
                                <h3 className="stat-card-title">이달의 목표</h3>
                                <p className="stat-card-sub">이번달 완독 목표를 설정하고 달성해보세요</p>

                                <div className="goal-content">
                                    <div className="goal-header">
                                        {!isEditingGoal ? (
                                            <>
                                                <span className="goal-text">목표: {monthlyGoal}권</span>
                                                <button
                                                    className="goal-edit-btn"
                                                    onClick={() => {
                                                        setTempGoal(monthlyGoal);
                                                        setIsEditingGoal(true);
                                                    }}
                                                >
                                                    수정
                                                </button>
                                            </>
                                        ) : (
                                            <div className="goal-edit-wrap">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="30"
                                                    value={tempGoal}
                                                    onChange={(e) => setTempGoal(Number(e.target.value))}
                                                    className="goal-input"
                                                />
                                                <button className="goal-save-btn" onClick={handleGoalSave}>
                                                    저장
                                                </button>
                                                <button
                                                    className="goal-cancel-btn"
                                                    onClick={() => setIsEditingGoal(false)}
                                                >
                                                    취소
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="goal-progress-wrap">
                                        <div className="goal-progress-bar">
                                            <div
                                                className="goal-progress-fill"
                                                style={{ width: `${Math.min((currentMonthDone / monthlyGoal) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <p className="goal-progress-text">
                                            {currentMonthDone} / {monthlyGoal}권 달성
                                        </p>
                                    </div>

                                    {currentMonthDone >= monthlyGoal && (
                                        <p className="goal-complete-msg">🎉 이달의 목표를 달성했어요!</p>
                                    )}
                                </div>
                            </div>

                            {/* 월별 독서량 */}
                            <div className="card stat-card">
                                <h3 className="stat-card-title">월별 독서량</h3>
                                <p className="stat-card-sub">최근 6개월간의 독서 기록이에요</p>

                                <div className="monthly-chart">
                                    {monthlyReadingData.map((data, idx) => {
                                        const maxCount = Math.max(...monthlyReadingData.map(d => d.count));
                                        const heightPercent = (data.count / maxCount) * 100;

                                        return (
                                            <div key={idx} className="chart-bar-wrap">
                                                <div className="chart-bar-container">
                                                    <div
                                                        className="chart-bar"
                                                        style={{ height: `${heightPercent}%` }}
                                                    >
                                                        <span className="chart-bar-value">{data.count}</span>
                                                    </div>
                                                </div>
                                                <span className="chart-bar-label">{data.month}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 독서 현황 파이 차트 */}
                            <div className="card stat-card">
                                <h3 className="stat-card-title">독서 현황</h3>
                                <p className="stat-card-sub">책 상태별 분포를 한눈에 확인하세요</p>

                                <div className="pie-content">
                                    <div className="pie-chart-wrap">
                                        <svg viewBox="0 0 100 100" className="pie-chart">
                                            {(() => {
                                                const total = pieData.reduce((sum, item) => sum + item.value, 0);
                                                if (total === 0) {
                                                    return <circle cx="50" cy="50" r="40" fill="#f0f0f0" />;
                                                }

                                                let currentAngle = 0;

                                                return pieData.map((item, idx) => {
                                                    if (item.value === 0) return null;

                                                    const angle = (item.value / total) * 360;
                                                    const path = describeArc(50, 50, 40, currentAngle, currentAngle + angle);
                                                    currentAngle += angle;

                                                    return <path key={idx} d={path} fill={item.color} />;
                                                });
                                            })()}
                                        </svg>
                                        <div className="pie-center-text">
                                            <div className="pie-center-number">{bookCounts.all}</div>
                                            <div className="pie-center-label">총 권수</div>
                                        </div>
                                    </div>

                                    <div className="pie-legend">
                                        {pieData.map((item, idx) => {
                                            const total = pieData.reduce((sum, d) => sum + d.value, 0);
                                            const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;

                                            return (
                                                <div className="legend-row" key={idx}>
                                                    <span
                                                        className="legend-dot"
                                                        style={{ backgroundColor: item.color }}
                                                    />
                                                    <span className="legend-text">
                                                        {item.label} · {item.value}권 ({percent}%)
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>


                {/* ===== 저장한 책 속 한 구절 ===== */}
                <section className="section section-white">
                    <div className="mylibrary-container">
                        <div className="section-title-row">
                            <h2 className="section-title">📖 저장한 책 속 한 문장</h2>
                            <span className="section-sub">
                                마음에 담아둔 문장들을 모아봤어요
                            </span>
                        </div>

                        <div className="saved-quotes-grid">
                            {savedQuotes.map((item) => (
                                <div key={item.id} className="card quote-card-saved">
                                    <div className="quote-top">
                                        <span className="quote-writer">{item.user} 님</span>
                                    </div>

                                    <p className="quote-text">"{item.quote}"</p>

                                    <div className="quote-book">
                                        <span className="quote-book-title">{item.book}</span>
                                        <span className="quote-book-author">| {item.author}</span>
                                    </div>

                                    <div className="quote-actions">
                                        <button
                                            type="button"
                                            className="quote-action-item"
                                            onClick={() => {
                                                setActiveQuote(item);
                                                setShowCommentModal(true);
                                            }}
                                        >
                                            <img src={commentIcon} alt="댓글" className="meta-icon" />
                                            <span>댓글</span>
                                        </button>

                                        <button
                                            type="button"
                                            className="quote-action-item save-btn"
                                            onClick={() => handleUnsaveQuote(item.id)}
                                        >
                                            <img src={fillSave} alt="저장됨" className="heart-icon" />
                                            <span>저장됨</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="section section-white">
                    <div className="mylibrary-container">
                        <div className="section-title-row">
                            <h2 className="section-title">📝 내가 작성한 책 속 한 문장</h2>
                            <span className="section-sub">
                                내가 직접 기록한 문장들이에요
                            </span>
                        </div>
                        <div className="saved-quotes-grid">
                            {myQuotes.map((q) => (
                                <div key={q.id} className="card quote-card-saved">

                                    <p className="quote-text">"{q.content}"</p>

                                    <div className="quote-book">
                                        <span className="quote-book-title">{q.books?.title}</span>
                                        <span className="quote-book-author"> | {q.books?.author}</span>
                                    </div>

                                    <div className="quote-actions">
                                        <button className="quote-action-item">
                                            <img src={commentIcon} className="meta-icon" />
                                            <span>{q.quote_comments.length}</span>
                                        </button>

                                        <button className="quote-action-item">
                                            <img src={fillHeart} className="heart-icon" />
                                            <span>{q.quote_likes.length}</span>
                                        </button>

                                        <button
                                            className="quote-action-item delete"
                                            onClick={() => handleDeleteMyQuote(q.id)}
                                        >
                                            <img src={binIcon} className="meta-icon" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>


                <section className="section section-white">
                    <div className="mylibrary-container">
                        <div className="section-title-row">
                            <h2 className="section-title">💬 내가 작성한 댓글</h2>
                            <span className="section-sub">내가 남긴 생각들을 모아봤어요</span>
                        </div>

                        <div className="saved-quotes-grid">
                            {myComments.map((item) => (
                                <div key={item.id} className="card quote-card-saved">

                                    <p className="quote-text">"{item.content}"</p>

                                    <div className="quote-book">
                                        <span className="quote-book-title">
                                            {item.quotes.books.title}
                                        </span>
                                        <span className="quote-book-author">
                                            | {item.quotes.books.author}
                                        </span>

                                        <button
                                            className="quote-action-item delete"
                                            onClick={() => handleDeleteMyComment(item.id)}
                                        >
                                            <img src={binIcon} className="meta-icon" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>


                <section className="section section-white">
                    <div className="mylibrary-container">
                        <div className="section-title-row">
                            <h2 className="section-title">✍️ 내가 작성한 리뷰</h2>
                            <span className="section-sub">
                                책을 읽고 남긴 나의 생각들이에요
                            </span>
                        </div>

                        <div className="saved-quotes-grid">
                            {myReviews.map((r) => (
                                <div key={r.id} className="card quote-card-saved">

                                    <p className="quote-text">{r.content}</p>

                                    <div className="quote-book">
                                        <span className="quote-book-title">{r.books?.title}</span>
                                        <span className="quote-book-author"> | {r.books?.author}</span>
                                    </div>

                                    <div className="quote-actions">
                                        <button type="button" className="quote-action-item">
                                            <img src={fillHeart} alt="좋아요" className="heart-icon" />
                                            <span>{r.likes_count || 0}</span>
                                        </button>

                                         <button
                                            className="quote-action-item delete"
                                            onClick={() => handleDeleteMyReview(r.id)}
                                        >
                                            <img src={binIcon} className="meta-icon" />
                                        </button>
                                    </div>

                                    
                                </div>
                            ))}
                        </div>
                    </div>
                </section>


            </main>

            {
                showRecordModal && (
                    <RecordModal
                        book={selectedBook}
                        onClose={() => setShowRecordModal(false)}
                        onSaved={async () => {
                            // 저장 후 "내 책 목록"만 다시 불러오기 (기존 로직 그대로 활용하고 싶으면 fetchMyBooks를 함수로 빼도 됨)
                            // 여기서는 간단히 새로고침 대신, 네 방식에 맞게 추후 리팩토링 가능.
                        }}
                    />
                )
            }
            {
                showCommentModal && activeQuote && (
                    <div className="modal-backdrop" onClick={() => setShowCommentModal(false)}>
                        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>댓글 작성</h3>
                                <button onClick={() => setShowCommentModal(false)}>✕</button>
                            </div>

                            <input
                                type="text"
                                placeholder="댓글을 입력하세요"
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleCommentSubmit();
                                }}
                                className="comment-input"
                            />

                            <button className="comment-submit-btn" onClick={handleCommentSubmit}>
                                등록
                            </button>
                        </div>
                    </div>
                )
            }
            {showToast && (
                <div className="toast-notification">
                    ✓ {toastMessage}
                </div>
            )}

            {/* ===== FOOTER ===== */}
            <footer className="mylibrary-footer">
                <div className="mylibrary-container footer-inner">
                    <p className="footer-title">My Bookmark</p>
                    <p className="footer-sub">
                        당신의 독서 여정을 차곡차곡 쌓아가는 공간, 나의 책갈피
                    </p>
                </div>
            </footer>
        </div >
    );
}