import { useState } from "react";
import "./../styles/RecordModal.css";
import supabase from "../lib/supabaseClient";

export default function RecordModal({ book, onClose }) {
  const [review, setReview] = useState("");
  const [quote, setQuote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!review && !quote) {
      alert("리뷰 또는 한 문장을 작성해주세요");
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (review) {
      await supabase.from("reviews").insert({
        user_id: user.id,
        book_id: book.id,
        content: review,
      });
    }

    if (quote) {
      await supabase.from("quotes").insert({
        user_id: user.id,
        book_id: book.id,
        content: quote,
      });
    }

    setLoading(false);
    onClose();
  };

  return (
    <div className="record-modal-backdrop">
      <div className="record-modal">
        <h2 className="record-title">{book.title}</h2>

        {/* 리뷰 */}
        <div className="record-section">
          <label>✍️ 리뷰</label>
          <textarea
            placeholder="이 책에 대한 생각을 남겨보세요"
            value={review}
            onChange={(e) => setReview(e.target.value)}
          />
        </div>

        {/* 한 문장 */}
        <div className="record-section">
          <label>📝 책 속 한 문장</label>
          <textarea
            placeholder="마음에 남은 문장을 기록해보세요"
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
          />
        </div>

        <div className="record-actions">
          <button className="btn-cancel" onClick={onClose}>
            취소
          </button>
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={loading}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
