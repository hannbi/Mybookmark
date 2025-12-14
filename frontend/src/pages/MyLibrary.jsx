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

    // 책 필터링 상태
    const [selectedTab, setSelectedTab] = useState("all"); // all, want, reading, done
    const [sortBy, setSortBy] = useState("recent"); // recent, title

    // 이달의 목표
    const [monthlyGoal, setMonthlyGoal] = useState(5);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [tempGoal, setTempGoal] = useState(5);

    // 저장한 문장 좋아요 상태
    const [likedMap, setLikedMap] = useState({});

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

    // 월별 독서량 데이터 (최근 6개월)
    const monthlyReadingData = [
        { month: "7월", count: 4 },
        { month: "8월", count: 6 },
        { month: "9월", count: 3 },
        { month: "10월", count: 5 },
        { month: "11월", count: 7 },
        { month: "12월", count: 3 }
    ];

    // 저장한 문장 데이터
    const savedQuotes = [
        {
            id: 1,
            user: "민수",
            quote: "책의 깊이와 감동이 오래도록 남습니다.",
            book: "문장의 온도",
            author: "이기주",
            comments: 12,
            likes: 105,
        },
        {
            id: 2,
            user: "한비",
            quote: "내 마음은 언제나 메마른 언덕이었다.",
            book: "어른의 문장",
            author: "김소연",
            comments: 12,
            likes: 103,
        },
        {
            id: 3,
            user: "수현",
            quote: "사람의 마음은 쉽게 무너지지 않지만, 한 번 금이 가면 오래 남는다.",
            book: "마음의 결",
            author: "박지은",
            comments: 8,
            likes: 97,
        }
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
                            <h2 className="section-title">📖 저장한 책 속 한 구절</h2>
                            <span className="section-sub">
                                마음에 담아둔 문장들을 모아봤어요
                            </span>
                        </div>

                        <div className="saved-quotes-grid">
                            {savedQuotes.map((item) => {
                                const isLiked = !!likedMap[item.id];

                                return (
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
                                            <div className="quote-action-item">
                                                <img src={commentIcon} alt="댓글" className="meta-icon" />
                                                <span>{item.comments}</span>
                                            </div>

                                            <button
                                                type="button"
                                                className={`quote-action-item like-btn ${isLiked ? "liked" : ""}`}
                                                onClick={() => toggleLike(item.id)}
                                            >
                                                <img
                                                    src={isLiked ? fillHeart : blankHeart}
                                                    alt="공감"
                                                    className="heart-icon"
                                                />
                                                <span>{item.likes + (isLiked ? 1 : 0)}</span>
                                            </button>

                                            <button
                                                type="button"
                                                className="quote-action-item save-btn saved"
                                            >
                                                <img src={fillSave} alt="저장됨" className="heart-icon" />
                                                <span>저장됨</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="quote-more-btn">문장 더보기</div>
                    </div>
                </section>

            </main>

            {showRecordModal && (
                <RecordModal
                    book={selectedBook}
                    onClose={() => setShowRecordModal(false)}
                />
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
        </div>
    );
}