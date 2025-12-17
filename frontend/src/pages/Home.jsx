// src/pages/Home.jsx

import React, { useState, useRef, useEffect } from "react";
import { Search, User } from "lucide-react";
import "./../styles/Home.css";
import { useNavigate } from "react-router-dom";

import LogoImg from "../assets/logo.png";
import book1 from "../assets/bestbook1.png";
import book2 from "../assets/bestbook2.png";
import goodIcon from "../assets/good_icon.png";
import goodIconOrange from "../assets/good_icon_orange.png";
import bookIcon from "../assets/book_icon.png";
import rankIcon from "../assets/rank_icon.png";
import textIcon from "../assets/text_icon.png";
import commentIcon from "../assets/comment_icon.png";
import blankHeart from "../assets/blankheart.png";
import fillHeart from "../assets/fillheart.png";
import blankSave from "../assets/blanksave.png";
import fillSave from "../assets/fillsave.png";

import supabase from "../lib/supabaseClient";

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [user, setUser] = useState(null);
  const [nickname, setNickname] = useState("");
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [activeQuote, setActiveQuote] = useState(null);
  const [commentInput, setCommentInput] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [quotes, setQuotes] = useState([]);
  

  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };
  const saveToLibrary = async (status, bookId) => {
    if (!user) {
      alert("로그인이 필요합니다");
      navigate("/login");
      return;
    }

    const payload = {
      user_id: user.id,
      book_id: bookId,
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

    showToastMessage("서재에 추가되었습니다");
  };

  useEffect(() => {
    const fetchTopQuotes = async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select(`
        id,
        content,
        created_at,
        profiles: user_id ( nickname ),
        books: book_id ( title, author ),
        quote_likes ( id ),
        quote_comments ( id )
      `);

      if (error) {
        console.error("문장 불러오기 실패:", error);
        return;
      }

      // 좋아요+댓글 수 계산
      const scored = data.map(q => ({
        id: q.id,
        quote: q.content,
        user: q.profiles?.nickname ?? "익명",
        book: q.books?.title ?? "",
        author: q.books?.author ?? "",
        likes: q.quote_likes.length,
        comments: q.quote_comments.length,
        score: q.quote_likes.length + q.quote_comments.length
      }));

      // 계산된 TOP 8 책 속 한문장
      const top8 = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);

      setQuotes(top8);
    };

    fetchTopQuotes();
  }, []);


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



  /* Best Sellers API*/
  const [bestsellers, setBestsellers] = useState([]);
  const topReviewBooks = bestsellers.slice(5, 10);
  useEffect(() => {
    fetch("http://localhost:3000/api/books/bestsellers")
      .then((res) => res.json())
      .then((data) => {
        setBestsellers(data.books ?? []);
      })
      .catch((err) => {
        console.error("베스트셀러 불러오기 실패:", err);
      });
  }, []);

  /* New book API*/
  const [newReleases, setNewReleases] = useState([]);
  useEffect(() => {
    fetch("http://localhost:3000/api/books/new")
      .then((res) => res.json())
      .then((data) => {
        setNewReleases(data.books ?? []);
      })
      .catch((err) => {
        console.error("신간 불러오기 실패:", err);
      });
  }, []);

  // 2. 댓글 작성 함수
  const handleCommentSubmit = async () => {
    if (!user) {
      alert("로그인이 필요합니다");
      navigate("/login");
      return;
    }

    if (!commentInput.trim()) return;

    const { error } = await supabase
      .from("quote_comments")
      .insert({
        user_id: user.id,
        quote_id: activeQuote.id,
        content: commentInput.trim(),
      });

    if (error) {
      console.error("댓글 등록 실패", error);
      alert("댓글 등록에 실패했습니다");
      return;
    }

    showToastMessage("댓글이 등록되었습니다");
    setCommentInput("");
    // 실시간으로 댓글을 추가하려면 dummyComments를 state로 변경하고 여기서 업데이트
  };

  const ranking = [
    { rank: 1, name: "한비 님", score: "공감 930회" },
    { rank: 2, name: "민수 님", score: "공감 802회" },
    { rank: 3, name: "지아 님", score: "공감 745회" },
    { rank: 4, name: "하늘 님", score: "공감 668회" },
    { rank: 5, name: "정수 님", score: "공감 612회" },
  ];

  const reviews = [
    {
      bookTitle: "트렌드 코리아 2026",
      author: "저자",
      review: "대학생이 인문학을 시작하기 딱 좋은 책이다. 일상과 상처를 다루지만 무겁지 않아서 술술 읽힌다…",
      likes: 48,
      thumbClass: "thumb-beige"
    },
    {
      bookTitle: "스토너",
      author: "저자",
      review: "너무 조용해서 오히려 강렬하다. 평범한 삶이 사실은 얼마나 비극적인지 보여주는 소설…",
      likes: 42,
      thumbClass: "thumb-blue"
    },
    {
      bookTitle: "존재의 무게를 말하는 문장들",
      author: "철학자123",
      review: "짧은 문장들 안에 삶 전체가 들어있다. 밑줄 치다가 책 한 권을 다 칠해버렸다…",
      likes: 38,
      thumbClass: "thumb-beige"
    },
    {
      bookTitle: "달러구트 꿈 백화점",
      author: "책벌레",
      review: "따뜻하고 포근한 위로를 받은 느낌. 잠들기 전에 읽기 좋은 책이었어요…",
      likes: 35,
      thumbClass: "thumb-yellow"
    },
    {
      bookTitle: "미드나잇 라이브러리",
      author: "독서왕",
      review: "선택과 후회에 대한 이야기. 읽고 나서 한동안 여운이 남았던 책…",
      likes: 31,
      thumbClass: "thumb-purple"
    }
  ];

  const [selectedReview, setSelectedReview] = useState(0); // 1번째 카드가 기본 선택
  const [likedMap, setLikedMap] = useState({});
  const [savedMap, setSavedMap] = useState({});

  const toggleLike = (id) => {
    setLikedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  const handleQuoteSave = async (quoteId) => {
    if (!user) {
      alert("로그인이 필요합니다");
      navigate("/login");
      return;
    }

    const isSaved = savedMap[quoteId];

    if (isSaved) {
      // 저장 취소
      const { error } = await supabase
        .from("quote_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("quote_id", quoteId);

      if (error) {
        console.error("저장 취소 실패", error);
        return;
      }

      setSavedMap((prev) => ({ ...prev, [quoteId]: false }));
      showToastMessage("저장이 취소되었습니다");
    } else {
      // 저장
      const { error } = await supabase
        .from("quote_likes")
        .insert({
          user_id: user.id,
          quote_id: quoteId,
        });

      if (error) {
        console.error("저장 실패", error);
        return;
      }

      setSavedMap((prev) => ({ ...prev, [quoteId]: true }));
      showToastMessage("문장이 저장되었습니다");
    }
  };

  const carouselRef = useRef(null);
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const handleMouseDown = (e) => {
    const slider = carouselRef.current;
    if (!slider) return;

    isDownRef.current = true;
    slider.classList.add("is-dragging");
    startXRef.current = e.pageX - slider.offsetLeft;
    scrollLeftRef.current = slider.scrollLeft;
  };

  const handleMouseLeave = () => {
    const slider = carouselRef.current;
    if (!slider) return;

    isDownRef.current = false;
    slider.classList.remove("is-dragging");
  };

  const handleMouseUp = () => {
    const slider = carouselRef.current;
    if (!slider) return;

    isDownRef.current = false;
    slider.classList.remove("is-dragging");
  };

  const handleMouseMove = (e) => {
    const slider = carouselRef.current;
    if (!slider || !isDownRef.current) return;

    e.preventDefault(); // 텍스트 선택 방지
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startXRef.current) * 1.2; // 드래그 민감도
    slider.scrollLeft = scrollLeftRef.current - walk;
  };

  const scrollToCard = (index) => {
    if (!carouselRef.current) return;

    const slider = carouselRef.current;
    const cards = slider.children;

    if (!cards[index]) return;

    const card = cards[index];
    const cardLeft = card.offsetLeft;

    slider.scrollTo({
      left: cardLeft - 20, // 여백 보정값
      behavior: "smooth",
    });
  };

  const data = [
    { label: "소설", value: 42, color: "#D65E18" },
    { label: "시 / 에세이", value: 27, color: "#e87a3aff" },
    { label: "어린이 / 유아동", value: 18, color: "#e6986aff" },
    { label: "경제 / 경영", value: 13, color: "#eaba9eff" },
    { label: "역사 / 문화", value: 13, color: "#f7ddceff" },
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


  return (
    <div className="home-root">
      {/* ===== HEADER ===== */}
      <header className="home-header">
        <div className="home-container header-inner">
          {/* 좌측 메뉴 */}
          <nav className="header-left">
            <button className="header-menu">Home</button>
            <button className="header-menu" onClick={() => navigate("/mylibrary")}>
              My Library
            </button>
          </nav>

          {/* 가운데 로고 */}
          <div className="header-logo">
            <img src={LogoImg} alt="logo" className="header-logo-img" />
            <span className="header-logo-text">My Bookmark</span>
          </div>

          {/* 우측 사용자 */}
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

        {/* 검색창 */}
        <div className="home-container header-search-wrap">
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
        {/* ===== WEEKLY BESTSELLERS ===== */}
        <section className="weekly-section">
          <div className="home-container weekly-inner">
            {/* 제목 */}
            <div className="weekly-title">
              <p className="weekly-title-top">
                <span className="italic-fake">Weekly</span>
              </p>

              <p className="weekly-title-main">
                <span className="italic-fake">BestSellers</span>
              </p>
              <p className="weekly-title-sub">
                이번 주 베스트셀러들을 한눈에 만나보세요
              </p>
            </div>


            {/* 책 카드 4개 */}
            <div className="weekly-books">
              {bestsellers.slice(0, 4).map((book, idx) => (
                <div
                  key={book.id ?? idx}
                  className={`book-card zigzag-${idx + 1}`}
                  onClick={() => navigate("/book", { state: { bookId: book.id } })}
                >
                  <div className="book-img-wrap">
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="book-img"
                    />
                  </div>

                  <div className="book-info-wrap">
                    <p className="book-info-title">{book.title}</p>
                    <p className="book-info-author">{book.author}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ===== 공감 많은 리뷰 BEST ===== */}
        <section className="section section-white">
          <div className="home-container">
            <div className="section-title-row">
              <img src={goodIcon} alt="good" className="section-icon-img" />
              <h2 className="section-title">공감 많은 리뷰 BEST</h2>
              <span className="section-sub">
                독자들이 가장 공감한 리뷰를 모아봤어요
              </span>
            </div>

            <div className="review-carousel"
              ref={carouselRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
            >
              {topReviewBooks.map((book, idx) => (
                <div
                  key={book.id}
                  className={`card review-carousel-card ${selectedReview === idx ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedReview(idx);
                    scrollToCard(idx);
                    navigate("/book", { state: { bookId: book.id } });
                  }}
                >
                  <div className="review-carousel-content">
                    <div className="review-left">
                      <p className="review-carousel-title">{book.title}</p>
                      <p className="review-carousel-author">{book.author}</p>
                      <div className="review-divider"></div>

                      {/* 더미 리뷰 */}
                      <p className="review-carousel-text">
                        “독자들에게 특히 많은 공감을 받은 책입니다.”
                      </p>

                      <div className="review-like-section">
                        <img src={goodIconOrange} alt="like" className="like-icon" />
                        <span className="like-count">{120 - idx * 7}</span>
                      </div>

                      <div className="review-carousel-buttons">
                        <button
                          className="btn-outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/book", { state: { bookId: book.id } });
                          }}
                        >
                          리뷰 더보기
                        </button>

                        <button
                          className="btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            saveToLibrary("want", book.id);
                          }}
                        >
                          읽고 싶은 책
                        </button>
                      </div>
                    </div>

                    <div className="review-right">
                      <img
                        src={book.cover ?? book1}
                        alt={book.title}
                        className="review-book-img-large"
                      />
                    </div>
                  </div>
                </div>
              ))}

            </div>

            {/* 원형 인디케이터 */}
            <div className="carousel-dots">
              {reviews.map((_, idx) => (
                <button
                  key={idx}
                  className={`carousel-dot ${selectedReview === idx ? "active" : ""}`}
                  onClick={() => setSelectedReview(idx)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ===== 이달의 장르 트렌드 + 활동 랭킹 ===== */}
        <section className="section section-gray">
          <div className="home-container">
            <div className="trend-ranking-grid">

              {/* 장르 트렌드 */}
              <div className="card trend-card">
                <div className="section-title-row mb-16">
                  <img src={bookIcon} alt="genre icon" className="section-icon-img" />
                  <h2 className="section-title-2">이달의 장르 트렌드</h2>
                </div>
                <p className="section-sub-2">
                  이번 달 독자들이 선택한 장르 비율을 보여줘요
                </p>

                <div className="trend-content">
                  {/* pie chart */}
                  <div className="trend-chart-wrap">
                    <svg viewBox="0 0 100 100" className="trend-chart">
                      {(() => {
                        const total = data.reduce((sum, item) => sum + item.value, 0);
                        let currentAngle = 0;

                        return data.map((item, idx) => {
                          const angle = (item.value / total) * 360;
                          const path = describeArc(
                            50,
                            50,
                            40,
                            currentAngle,
                            currentAngle + angle
                          );
                          currentAngle += angle;

                          return (
                            <path
                              key={idx}
                              d={path}
                              fill={item.color}
                            />
                          );
                        });
                      })()}
                    </svg>
                  </div>

                  {/* legend */}
                  <div className="trend-legend">
                    {data.map((item, idx) => {
                      const total = data.reduce((sum, d) => sum + d.value, 0);
                      const percent = Math.round((item.value / total) * 100);

                      return (
                        <div className="legend-row" key={idx}>
                          <span
                            className="legend-dot"
                            style={{ backgroundColor: item.color }}
                          />
                          <span>
                            {item.label} · {percent}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 활동 랭킹 */}
              <div className="card ranking-card">
                <div className="section-title-row mb-16">
                  <img src={rankIcon} alt="ranking icon" className="section-icon-img" />
                  <h2 className="section-title-2">이달의 활동 랭킹</h2>
                </div>
                <p className="section-sub-2">
                  완독 수와 공감 활동을 바탕으로 한 종합 랭킹이에요
                </p>

                <div className="ranking-list">
                  {ranking.map((user, idx) => (
                    <div key={user.rank} className="ranking-row">
                      <span
                        className={
                          idx < 3 ? "ranking-rank ranking-top" : "ranking-rank"
                        }
                      >
                        {user.rank}
                      </span>
                      <div className="ranking-content">
                        <span className="ranking-name">{user.name}</span>
                        <span className="ranking-score">{user.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rank-more-btn">
              랭킹 더보기
            </div>
          </div>
        </section>

        {/* ===== 책 속 한 구절 ===== */}
        <section className="section section-white">
          <div className="home-container">
            <div className="section-title-row">
              <img src={textIcon} alt="text" className="section-icon-img" />
              <h2 className="section-title">책 속 한 문장</h2>
              <span className="section-sub">
                독자들이 인상 깊게 느낀 명문장들을 공유해요
              </span>
            </div>

            {/* 🔹 4개 × 2줄 고정 */}
            <div className="quote-grid-2row">
              {quotes.map((item, idx) => {
                const isLiked = !!likedMap[idx];

                return (
                  <div key={item.id} className="card quote-card-fixed">
                    <div className="quote-top">
                      <span className="quote-writer">{item.user} 님</span>
                    </div>

                    <p className="quote-text">“{item.quote}”</p>

                    <div className="quote-book">
                      <span className="quote-book-title">{item.book}</span>
                      <span className="quote-book-author">| {item.author}</span>
                    </div>

                    <div className="quote-actions">
                      <button className="quote-action-item">
                        <img src={commentIcon} className="meta-icon" />
                        <span>{item.comments}</span>
                      </button>

                      <button className="quote-action-item">
                        <img src={fillHeart} className="heart-icon" />
                        <span>{item.likes}</span>
                      </button>

                      <button className="quote-action-item">
                        <img src={blankSave} className="heart-icon" />
                        <span>저장</span>
                      </button>
                    </div>
                  </div>

                );
              })}
            </div>

            {/* 더보기 */}
            <div className="quote-more-btn">문장 더보기</div>
          </div>
        </section>


        {/* ===== 이번주 신간 ===== */}
        <section className="section section-gray">
          <div className="home-container">
            <div className="section-title-row">
              <span className="section-emoji">✨</span>
              <h2 className="section-title">이번주 신간</h2>
              <span className="section-sub">
                이번 주에 새로 출간된 책들을 만나보세요
              </span>
            </div>

            <div className="newbook-grid">
              {newReleases.slice(0, 5).map((book, idx) => (
                <div
                  key={idx}
                  className="newbook-item"
                  onClick={() => navigate("/book", { state: { bookId: book.id } })}
                >
                  {/* 책 이미지 (흰 카드와 분리된 기준) */}
                  <div className="newbook-img-wrap">
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="newbook-img"
                    />
                  </div>

                  {/* 흰 카드 (이 부분만 아래로 이동 가능) */}
                  <div className="newbook-cover-card"></div>

                  {/* 하단 정보 영역 */}
                  <div className="newbook-meta">
                    <p className="newbook-title">{book.title}</p>
                    <p className="newbook-author">{book.author}</p>

                    <div className="newbook-buttons">
                      <button className="btn-outline">책 상세보기</button>
                      <button
                        className="btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          saveToLibrary("want", book.id);
                        }}
                      >
                        읽고 싶은 책
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
            <div className="quote-more-btn">더 많은 신간 보기</div>


          </div>
        </section>
      </main>


      {/* ===== FOOTER ===== */}
      <footer className="home-footer">
        <div className="home-container footer-inner">
          <p className="footer-title">My Bookmark</p>
          <p className="footer-sub">
            당신의 독서 여정을 차곡차곡 쌓아가는 공간, 나의 책갈피
          </p>
        </div>
      </footer >
      {showCommentModal && activeQuote && (
        <div className="modal-backdrop" onClick={() => {
          setShowCommentModal(false);
          setCommentInput("");
        }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>댓글 {dummyComments.length}개</h3>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowCommentModal(false);
                  setCommentInput("");
                }}
              >
                ✕
              </button>
            </div>

            {/* 댓글 목록 */}
            <div className="comment-list">
              {dummyComments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-header">
                    <div className="comment-user-info">
                      <div className="comment-avatar">{comment.user[0]}</div>
                      <span className="comment-username">{comment.user}</span>
                    </div>
                    <span className="comment-time">{comment.time}</span>
                  </div>
                  <p className="comment-text">{comment.text}</p>
                </div>
              ))}
            </div>

            {/* 댓글 입력 */}
            <div className="comment-input-section">
              <input
                type="text"
                placeholder="댓글을 입력하세요"
                className="comment-input"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && commentInput.trim()) {
                    handleCommentSubmit();
                  }
                }}
              />
              <button
                className="comment-submit-btn"
                onClick={() => {
                  if (commentInput.trim()) {
                    showToastMessage("댓글이 등록되었습니다");
                    setCommentInput("");
                  }
                }}
              >
                등록
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 알림 */}
      {showToast && (
        <div className="toast-notification">
          ✓ {toastMessage}
        </div>
      )}
    </div>
  );

}
