// src/pages/Search.jsx
import React, { useEffect, useState } from "react";
import { Search, User } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./../styles/Search.css";

import LogoImg from "../assets/logo.png";

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);

  /* 🔹 검색 API 호출 */
  useEffect(() => {
    if (!query) return;

    setLoading(true);

    fetch(`http://localhost:3000/api/books/search?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        setBooks(data.books ?? []);
      })
      .catch((err) => {
        console.error("검색 실패:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [query]);

  return (
    <div className="search-root">
      {/* ===== HEADER (Home과 동일) ===== */}
      <header className="home-header">
        <div className="home-container header-inner">
          <nav className="header-left">
            <button className="header-menu" onClick={() => navigate("/")}>
              Home
            </button>
            <button className="header-menu">My Library</button>
          </nav>

          <div className="header-logo">
            <img src={LogoImg} alt="logo" className="header-logo-img" />
            <span className="header-logo-text">My Bookmark</span>
          </div>

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
              defaultValue={query}
              placeholder="제목이나 저자로 검색할 책을 입력해보세요"
              className="search-input"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  navigate(`/search?q=${encodeURIComponent(e.target.value)}`);
                }
              }}
            />
            <button
              type="button"
              className="search-btn"
              onClick={() => {
                const value =
                  document.querySelector(".search-input")?.value || "";
                navigate(`/search?q=${encodeURIComponent(value)}`);
              }}
            >
              <Search className="search-icon" />
            </button>
          </div>
        </div>
      </header>

      {/* ===== 검색 결과 ===== */}
      <main className="search-main">
        <div className="home-container">
          <h2 className="search-result-title">
            “{query}” 검색 결과
          </h2>

          {loading && <p>검색 중...</p>}

          {!loading && books.length === 0 && (
            <p>검색 결과가 없습니다.</p>
          )}

          <div className="search-grid">
            {books.map((book) => (
              <div
                key={book.id}
                className="search-book-card"
                onClick={() => navigate("/book", { state: { book } })}
              >
                <div className="search-book-img-wrap">
                  <img
                    src={book.cover}
                    alt={book.title}
                  />
                </div>

                <div className="search-book-info">
                  <p className="search-book-title">{book.title}</p>
                  <p className="search-book-author">{book.author}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
