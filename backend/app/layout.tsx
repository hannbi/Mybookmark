// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import AppHeader from "@/components/AppHeader";

export const metadata: Metadata = {
  title: "나의 책갈피",
  description: "독서 기록 & 커뮤니티 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-zinc-50 text-zinc-900">
        <div className="min-h-screen flex flex-col">
          {/* 전역 상단바 */}
          <AppHeader />

          {/* 각 페이지 내용 */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
