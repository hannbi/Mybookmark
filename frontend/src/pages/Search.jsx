// src/pages/Search.jsx
import React from "react";
import { Search, User } from "lucide-react";
import "./../styles/Search.css";

import LogoImg from "../assets/logo.png";
import book1 from "../assets/bestbook1.png";
import book2 from "../assets/bestbook2.png";
import book3 from "../assets/bestbook3.png";
import book4 from "../assets/bestbook4.png";

export default function SearchPage() {
    const mockBooks = [
        { id: 1, title: "트렌드 코리아 2026", author: "김난도", img: book1 },
        { id: 2, title: "스토너", author: "존 윌리엄스", img: book2 },
        { id: 3, title: "미드나잇 라이브러리", author: "매트 헤이그", img: book3 },
        { id: 4, title: "달러구트 꿈 백화점", author: "이미예", img: book4 },
        { id: 5, title: "어른의 문장", author: "김소연", img: book1 },
        { id: 6, title: "문장의 온도", author: "이기주", img: book2 },
    ];

    return (
        <div className="search-root">
            {/* ===== HEADER (Home과 동일) ===== */}
            <header className="home-header">
                <div className="home-container header-inner">
                    <nav className="header-left">
                        <button className="header-menu">Home</button>
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

            {/* ===== 검색 결과 ===== */}
            <main className="search-main">
                <div className="home-container">
                    <h2 className="search-result-title">검색 결과</h2>

                    <div className="search-grid">
                        {mockBooks.map((book) => (
                            <div key={book.id} className="search-book-card">
                                <img src={book.img} alt={book.title} />
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
