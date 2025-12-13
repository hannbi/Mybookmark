// app/api/books/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 알라딘 검색 후 DB upsert가 필요하므로 서비스 롤 키 사용 (클라이언트에 노출되지 않는 서버 라우트)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY ?? "");

// 제목 정규화: 공백 제거 + 소문자
function normalizeTitle(title: string | null | undefined): string {
  if (!title) return "";
  return title.replace(/\s+/g, "").toLowerCase();
}

// GET /api/books/search?q=키워드
export async function GET(req: NextRequest) {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY가 설정되어 있지 않습니다." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q) {
    return NextResponse.json({ books: [] });
  }

  // 1) 먼저 Supabase에서 현재 저장된 책들 검색
  const { data: existing, error: existingError } = await supabase
    .from("books")
    .select("id, title, author, publisher, category, isbn, cover, description")
    .or(
      [
        `title.ilike.%${q}%`,
        `author.ilike.%${q}%`,
        `publisher.ilike.%${q}%`,
        `category.ilike.%${q}%`,
      ].join(",")
    )
    .limit(50);

  if (existingError) {
    console.error("Supabase search error:", existingError);
    return NextResponse.json(
      { error: "검색 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }

  // 2) 알라딘 API 호출 (항상 호출해서 cover=Big 로 업데이트 시도)
  try {
    const aladinUrl =
      "https://www.aladin.co.kr/ttb/api/ItemSearch.aspx?" +
      new URLSearchParams({
        ttbkey: process.env.ALADIN_TTB_KEY!, // .env 에 있어야 함
        Query: q,
        QueryType: "Keyword", // 제목/저자/키워드 검색
        MaxResults: "20",
        SearchTarget: "Book",
        output: "js", // JSON
        Version: "20131101",
        Cover: "Big", // ✅ 큰 표지 이미지 요청
      }).toString();

    const alRes = await fetch(aladinUrl);
    if (!alRes.ok) {
      console.error("Aladin API status:", alRes.status);
      // 알라딘이 실패해도, DB에 있던 기존 데이터가 있으면 그걸 반환
      return NextResponse.json({ books: existing ?? [] });
    }

    const alJson = await alRes.json();
    const items: any[] = alJson.item ?? [];

    type AladinBook = {
      title: string;
      author: string | null;
      publisher: string | null;
      category: string | null;
      isbn: string | null;
      cover: string | null;
      description: string | null;
    };

    const aladinBooks: AladinBook[] = items.map((item) => ({
      title: item.title,
      author: item.author || null,
      publisher: item.publisher || null,
      category: item.categoryName || null,
      isbn: item.isbn13 || item.isbn || null,
      cover: item.cover || null, // 이미 Big 사이즈
      description: item.description || null,
    }));

    // 2-1) ISBN 기준 매핑
    const isbnToAladin = new Map<string, AladinBook>();
    for (const b of aladinBooks) {
      if (b.isbn) {
        isbnToAladin.set(b.isbn, b);
      }
    }

    // 2-2) 제목 기준 매핑 (공백 제거 + 소문자)
    const titleToAladin = new Map<string, AladinBook>();
    for (const b of aladinBooks) {
      const key = normalizeTitle(b.title);
      if (!key) continue;
      // 같은 제목이 여러 개 있을 수 있지만, 첫 번째 것만 사용
      if (!titleToAladin.has(key)) {
        titleToAladin.set(key, b);
      }
    }

    const upsertExistingRows: any[] = [];

    for (const ex of existing ?? []) {
      // 1순위: ISBN 으로 매칭
      let fromAladin: AladinBook | undefined;
      if (ex.isbn) {
        fromAladin = isbnToAladin.get(ex.isbn);
      }

      // 2순위: 제목 정규화로 매칭
      if (!fromAladin) {
        const key = normalizeTitle(ex.title);
        if (key) {
          fromAladin = titleToAladin.get(key);
        }
      }

      if (!fromAladin) continue;

      upsertExistingRows.push({
        id: ex.id, // PK 로 upsert
        // 필요한 정보만 덮어쓰기 (기존 값이 더 나을 때도 있어서 ?? 로 fallback)
        title: fromAladin.title ?? ex.title,
        author: fromAladin.author ?? ex.author,
        publisher: fromAladin.publisher ?? ex.publisher,
        category: fromAladin.category ?? ex.category,
        isbn: ex.isbn || fromAladin.isbn || null,
        cover: fromAladin.cover ?? ex.cover,
        description: fromAladin.description ?? ex.description,
      });
    }

    if (upsertExistingRows.length > 0) {
      const { error: upsertExistingError } = await supabase
        .from("books")
        .upsert(upsertExistingRows);

      if (upsertExistingError) {
        console.error(
          "Supabase upsert existing books error:",
          upsertExistingError
        );
      }
    }

    // 3) DB 에 없는 ISBN 은 새로 insert (있으면 그대로)
    const existingIsbnSet = new Set<string>();
    (existing ?? []).forEach((b) => {
      if (b.isbn) existingIsbnSet.add(b.isbn);
    });

    const toInsertNew: AladinBook[] = [];
    for (const b of aladinBooks) {
      if (!b.isbn) continue;
      if (existingIsbnSet.has(b.isbn)) continue;
      toInsertNew.push(b);
    }

    if (toInsertNew.length > 0) {
      const { error: insertError } = await supabase
        .from("books")
        .insert(
          toInsertNew.map((b) => ({
            title: b.title,
            author: b.author,
            publisher: b.publisher,
            category: b.category,
            isbn: b.isbn,
            cover: b.cover,
            description: b.description,
          }))
        );

      if (insertError) {
        console.error("Supabase insert new books error:", insertError);
      }
    }

    // 4) 최종적으로 Supabase 에서 다시 검색해서 최신 상태를 반환
    const { data: finalData, error: finalError } = await supabase
      .from("books")
      .select("id, title, author, publisher, category, isbn, cover, description")
      .or(
        [
          `title.ilike.%${q}%`,
          `author.ilike.%${q}%`,
          `publisher.ilike.%${q}%`,
          `category.ilike.%${q}%`,
        ].join(",")
      )
      .limit(50);

    if (finalError) {
      console.error("Supabase final search error:", finalError);
      return NextResponse.json(
        { error: "검색 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return new NextResponse(
      JSON.stringify({ books: finalData ?? [] }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "http://localhost:5173",
        },
      }
    );
  } catch (e) {
    console.error("Aladin fetch error:", e);
    // 알라딘이 완전히 실패한 경우: DB에 있던 책이라도 반환
    return NextResponse.json({ books: existing ?? [] });
  }
}
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "http://localhost:5173",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}