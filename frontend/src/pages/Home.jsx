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

  const showToastMessage = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

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



  const quoteList = [
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
    },
    {
      id: 4,
      user: "수지",
      quote: "우리는 모두 불완전한 존재지만, 그 안에서 아름다움을 찾을 수 있다.",
      book: "불완전함의 미학",
      author: "정혜진",
      comments: 15,
      likes: 89,
    },
    {
      id: 5,
      user: "정수",
      quote: "시간은 누구에게나 공평하지만, 우리가 그것을 채우는 방식은 다르다.",
      book: "시간의 무게",
      author: "최민호",
      comments: 10,
      likes: 92,
    },
    {
      id: 6,
      user: "율이",
      quote: "진짜 용기란 두려움이 없는 게 아니라, 두려움 속에서도 나아가는 것이다.",
      book: "용기에 관하여",
      author: "강서윤",
      comments: 18,
      likes: 110,
    },
    {
      id: 7,
      user: "하늘",
      quote: "말하지 않아도 알 수 있는 것들이 있다. 그게 바로 마음이다.",
      book: "침묵의 언어",
      author: "윤지혜",
      comments: 9,
      likes: 84,
    },
    {
      id: 8,
      user: "지아",
      quote: "행복은 목적지가 아니라 여행하는 과정 그 자체다.",
      book: "행복의 순간들",
      author: "이서연",
      comments: 14,
      likes: 95,
    },
  ];

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

  const dummyComments = [
    { id: 1, user: "책벌레", text: "이 문장 때문에 책을 샀어요. 정말 공감되네요!", time: "2시간 전" },
    { id: 2, user: "독서왕", text: "저도 이 부분에서 밑줄 그었어요 ㅎㅎ", time: "5시간 전" },
    { id: 3, user: "민지", text: "다시 읽어보고 싶은 문장이에요", time: "1일 전" },
    { id: 4, user: "현수", text: "너무 감동적이에요 👍", time: "1일 전" },
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
  const toggleSave = (id) => {
    setSavedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
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
                            navigate("/mylibrary");
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
                  완독 수와 공감 활동을 바탕으로 한 종합 랭킹이에요.
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
              <h2 className="section-title">책 속 한 구절</h2>
              <span className="section-sub">
                독자들이 인상 깊게 느낀 명문장들을 공유해요
              </span>
            </div>

            {/* 🔹 4개 × 2줄 고정 */}
            <div className="quote-grid-2row">
              {quoteList.slice(0, 8).map((item, idx) => {
                const isLiked = !!likedMap[idx];

                return (
                  <div key={idx} className="card quote-card-fixed">
                    {/* 작성자 */}
                    <div className="quote-top">
                      <span className="quote-writer">{item.user} 님</span>
                    </div>

                    {/* 한 문장 */}
                    <p className="quote-text">“{item.quote}”</p>

                    {/* 책명 / 저자 */}
                    <div className="quote-book">
                      <span className="quote-book-title">{item.book}</span>
                      <span className="quote-book-author">| {item.author}</span>
                    </div>

                    {/* 하단: 댓글 / 공감 / 저장 */}
                    <div className="quote-actions">
                      {/* 댓글 */}
                      <button
                        type="button"
                        className="quote-action-item"
                        onClick={() => {
                          setActiveQuote(item);
                          setShowCommentModal(true);
                        }}
                      >
                        <img src={commentIcon} alt="댓글" className="meta-icon" />
                        <span>{item.comments}</span>
                      </button>

                      {/* 공감 */}
                      <button
                        type="button"
                        className={`quote-action-item like-btn ${isLiked ? "liked" : ""}`}
                        onClick={() => toggleLike(idx)}
                      >
                        <img
                          src={isLiked ? fillHeart : blankHeart}
                          alt="공감"
                          className="heart-icon"
                        />
                        <span>{item.likes + (isLiked ? 1 : 0)}</span>
                      </button>

                      {/* 저장 */}
                      <button
                        type="button"
                        className={`quote-action-item save-btn ${savedMap[idx] ? "saved" : ""}`}
                        onClick={() => toggleSave(idx)}
                      >
                        <img
                          src={savedMap[idx] ? fillSave : blankSave}
                          alt="저장"
                          className="heart-icon"
                        />
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
                      <button className="btn-primary">읽고 싶은 책</button>
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
                    showToastMessage();
                    setCommentInput("");
                  }
                }}
              />
              <button
                className="comment-submit-btn"
                onClick={() => {
                  if (commentInput.trim()) {
                    showToastMessage();
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
          ✓ 댓글이 등록되었습니다
        </div>
      )}
    </div>
  );

}
