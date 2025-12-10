// src/pages/Home.jsx

import React from "react";
import { Search, User } from "lucide-react";
import "./../styles/Home.css";
import LogoImg from "../assets/logo.png";
import book1 from "../assets/bestbook1.png";
import book2 from "../assets/bestbook2.png";
import book3 from "../assets/bestbook3.png";
import book4 from "../assets/bestbook4.png";

export default function Home() {
  const quoteList = [
    "책의 깊이와 감동이 오래도록 남습니다.",
    "대학생이 인문학을 시작하기 딱 좋은 책이었어요.",
    "재미있고 자극적인데 묵직한 여운이 남는 독서였습니다.",
    "새로운 관점을 열어준 훌륭한 철학서입니다.",
    "가을밤에 읽기 좋은, 잔잔한 로맨스 소설이었어요.",
    "가볍게 시작했다가 생각보다 진지하게 나를 돌아보게 했던 책.",
  ];

  const newBooks = [
    { title: "서울 하늘", colorClass: "nb-bg-blue" },
    { title: "예술가의 초상", colorClass: "nb-bg-yellow" },
    { title: "나무", colorClass: "nb-bg-amber" },
    { title: "코스모스", colorClass: "nb-bg-dark" },
    { title: "파리의 우울", colorClass: "nb-bg-mix" },
  ];

  const ranking = [
    { rank: 1, name: "한비 님", score: "공감 930회" },
    { rank: 2, name: "민수 님", score: "공감 802회" },
    { rank: 3, name: "수현 님", score: "공감 745회" },
    { rank: 4, name: "지훈 님", score: "공감 668회" },
    { rank: 5, name: "재능 님", score: "공감 612회" },
  ];

  return (
    <div className="home-root">
      {/* ===== HEADER ===== */}
      <header className="home-header">
        <div className="home-container header-inner">
          {/* 좌측 메뉴 */}
          <nav className="header-left">
            <button className="header-menu">Home</button>
            <button className="header-menu">My Library</button>
          </nav>

          {/* 가운데 로고 */}
          <div className="header-logo">
            <img src={LogoImg} alt="logo" className="header-logo-img" />
            <span className="header-logo-text">My Bookmark</span>
          </div>

          {/* 우측 사용자 */}
          <div className="header-right">
            <User className="header-user-icon" />
            <span>한비 님</span>
          </div>
        </div>

        {/* 검색창 */}
        <div className="home-container header-search-wrap">
          <div className="search-box">
            <input
              type="text"
              placeholder="검색할 책을 입력해보세요"
              className="search-input"
            />
            <Search className="search-icon" />
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

              {/* 1번 */}
              <div className="book-card zigzag-1">
                <div className="book-img-wrap">
                  <img src={book1} alt="book1" className="book-img" />
                </div>
                <div className="book-info-wrap">
                  <p className="book-info-title">트렌드 코리아 2026</p>
                  <p className="book-info-author">김난도 외</p>
                </div>
              </div>

              {/* 2번 */}
              <div className="book-card zigzag-2">
                <div className="book-img-wrap">
                  <img src={book2} alt="book2" className="book-img" />
                </div>
                <div className="book-info-wrap">
                  <p className="book-info-title">절창</p>
                  <p className="book-info-author">국밥묵</p>
                </div>
              </div>

              {/* 3번 */}
              <div className="book-card zigzag-3">
                <div className="book-img-wrap">
                  <img src={book3} alt="book3" className="book-img" />
                </div>
                <div className="book-info-wrap">
                  <p className="book-info-title">혼모노</p>
                  <p className="book-info-author">성해나</p>
                </div>
              </div>

              {/* 4번 */}
              <div className="book-card zigzag-4">
                <div className="book-img-wrap">
                  <img src={book4} alt="book4" className="book-img" />
                </div>
                <div className="book-info-wrap">
                  <p className="book-info-title">모순</p>
                  <p className="book-info-author">양귀자</p>
                </div>
              </div>
            </div>

            {/* 더보기 버튼 */}
            <div className="weekly-more-wrap">
              <button className="weekly-more-btn">
                VIEW ALL
              </button>
            </div>
          </div>
        </section>

        {/* ===== 공감 많은 리뷰 BEST ===== */}
        <section className="section section-white">
          <div className="home-container">
            <div className="section-title-row">
              <span className="section-emoji">👍</span>
              <h2 className="section-title">공감 많은 리뷰 BEST</h2>
              <span className="section-sub">
                독자들이 가장 공감한 리뷰를 모아봤어요
              </span>
            </div>

            <div className="review-grid">
              {/* 카드 1 */}
              <div className="card review-card">
                <div className="review-top">
                  <div className="review-book-thumb thumb-beige" />
                  <div>
                    <p className="review-title">
                      아몬드를 읽으면서 조금 웃었다
                    </p>
                    <p className="review-author">무료사랑의왕복자</p>
                  </div>
                </div>
                <p className="review-text">
                  “대학생이 인문학을 시작하기 딱 좋은 책이다. 일상과 상처를
                  다루지만 무겁지 않아서 술술 읽힌다…”
                </p>
                <div className="review-buttons">
                  <button className="btn-outline">자세히 보기</button>
                  <button className="btn-primary">공감하기</button>
                </div>
              </div>

              {/* 카드 2 */}
              <div className="card review-card">
                <div className="review-top">
                  <div className="review-book-thumb thumb-blue" />
                  <div>
                    <p className="review-title">스토너</p>
                    <p className="review-author">무슨일이있나</p>
                  </div>
                </div>
                <p className="review-text">
                  “너무 조용해서 오히려 강렬하다. 평범한 삶이 사실은 얼마나
                  비극적인지 보여주는 소설…”
                </p>
                <div className="review-buttons">
                  <button className="btn-outline">자세히 보기</button>
                  <button className="btn-primary">공감하기</button>
                </div>
              </div>

              {/* 카드 3 */}
              <div className="card review-card">
                <div className="review-top">
                  <div className="review-book-thumb thumb-beige" />
                  <div>
                    <span className="chip">인문</span>
                    <p className="review-title">존재의 무게를 말하는 문장들</p>
                  </div>
                </div>
                <p className="review-text">
                  “짧은 문장들 안에 삶 전체가 들어있다. 밑줄 치다가 책 한 권을
                  다 칠해버렸다…”
                </p>
                <div className="review-buttons">
                  <button className="btn-outline">자세히 보기</button>
                  <button className="btn-primary">공감하기</button>
                </div>
              </div>
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
                  <span className="section-emoji">📊</span>
                  <h2 className="section-title-small">이달의 장르 트렌드</h2>
                </div>
                <p className="section-sub mb-24">
                  이번 달 독자들이 가장 많이 읽은 장르를 한눈에 확인해보세요
                </p>

                <div className="trend-content">
                  <div className="trend-chart-wrap">
                    <svg viewBox="0 0 100 100" className="trend-chart">
                      <circle
                        cx="50"
                        cy="50"
                        r="35"
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="20"
                        strokeDasharray="220"
                        strokeDashoffset="0"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="35"
                        fill="none"
                        stroke="#60a5fa"
                        strokeWidth="20"
                        strokeDasharray="220"
                        strokeDashoffset="90"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="35"
                        fill="none"
                        stroke="#facc15"
                        strokeWidth="20"
                        strokeDasharray="220"
                        strokeDashoffset="145"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="35"
                        fill="none"
                        stroke="#d1d5db"
                        strokeWidth="20"
                        strokeDasharray="220"
                        strokeDashoffset="185"
                      />
                    </svg>
                  </div>
                  <div className="trend-legend">
                    <div className="legend-row">
                      <span className="legend-dot dot-orange" />
                      <span>소설 · 42%</span>
                    </div>
                    <div className="legend-row">
                      <span className="legend-dot dot-blue" />
                      <span>시 / 에세이 · 27%</span>
                    </div>
                    <div className="legend-row">
                      <span className="legend-dot dot-yellow" />
                      <span>어린이 / 유아동 · 18%</span>
                    </div>
                    <div className="legend-row">
                      <span className="legend-dot dot-gray" />
                      <span>역사 / 문화 · 13%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 활동 랭킹 */}
              <div className="card ranking-card">
                <div className="section-title-row mb-16">
                  <span className="section-emoji">🏆</span>
                  <h2 className="section-title-small">이달의 활동 랭킹</h2>
                </div>
                <p className="section-sub mb-24">
                  리뷰, 공감, 담기 수를 기준으로 이번 달 가장 활발한 독서
                  활동을 한 독자들이에요
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
          </div>
        </section>

        {/* ===== 책 속 한 구절 ===== */}
        <section className="section section-white">
          <div className="home-container">
            <div className="section-title-row">
              <span className="section-emoji">📖</span>
              <h2 className="section-title">책 속 한 구절</h2>
              <span className="section-sub">
                독자들이 저장한 명문장들을 모아봤어요
              </span>
            </div>

            <div className="quote-grid">
              {quoteList.map((quote, idx) => (
                <div key={idx} className="card quote-card">
                  <p className="quote-text">“{quote}”</p>
                  <div className="quote-footer">
                    <span className="quote-user">독자 {idx + 1}</span>
                    <div className="quote-buttons">
                      <button className="btn-outline small">저장</button>
                      <button className="btn-primary small">공감</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
              {newBooks.map((book, idx) => (
                <div key={idx} className="newbook-card">
                  <div className={`newbook-cover ${book.colorClass}`}>
                    {book.title}
                  </div>
                  <p className="newbook-title">{book.title}</p>
                  <p className="newbook-author">저자명</p>
                  <button className="btn-primary full">담기</button>
                </div>
              ))}
            </div>

            <div className="weekly-more-wrap">
              <button className="weekly-more-btn">
                더 많은 신간 보기 +
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="home-footer">
        <div className="home-container footer-inner">
          <p className="footer-title">📚 My Bookmark</p>
          <p className="footer-sub">
            당신의 독서 여정을 차곡차곡 쌓아가는 공간, My Bookmark
          </p>
        </div>
      </footer>
    </div>
  );
}
