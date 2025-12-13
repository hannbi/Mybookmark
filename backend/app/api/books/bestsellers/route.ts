// app/api/books/bestsellers/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TTB_KEY = process.env.ALADIN_TTB_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 서비스 롤 키로 서버 전용 클라이언트 생성 (RLS 우회하여 upsert)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY ?? "");

// 알라딘 이번 주 베스트셀러 목록 가져오기
export async function GET() {
  if (!TTB_KEY) {
    return NextResponse.json(
      { error: "ALADIN_TTB_KEY가 설정되어 있지 않습니다." },
      { status: 500 }
    );
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY가 설정되어 있지 않습니다." },
      { status: 500 }
    );
  }

  try {
    const url =
      "https://www.aladin.co.kr/ttb/api/ItemList.aspx?" +
      new URLSearchParams({
        ttbkey: TTB_KEY,
        QueryType: "Bestseller",
        SearchTarget: "Book",
        MaxResults: "12",
        output: "js",
        Version: "20131101",
        Cover: "Big",
      }).toString();

    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.error("Aladin bestseller status:", res.status);
      return NextResponse.json(
        { error: "베스트셀러 정보를 가져오지 못했습니다." },
        { status: 502 }
      );
    }

    const json = await res.json();
    const items: any[] = json.item ?? [];

    const books = items.map((item) => ({
      // supabase PK를 얻기 위해 isbn 을 기준으로 upsert
      title: item.title as string,
      author: (item.author as string) || null,
      publisher: (item.publisher as string) || null,
      category: (item.categoryName as string) || null,
      isbn: (item.isbn13 as string) || (item.isbn as string) || null,
      cover: (item.cover as string) || null,
      description: (item.description as string) || null,
      rank: typeof item.bestRank === "number" ? item.bestRank : null,
    }));

    // ISBN 있는 항목을 books 테이블에 upsert (없으면 삽입)
    const upsertPayload = books
      .filter((b) => b.isbn)
      .map((b) => ({
        title: b.title,
        author: b.author,
        publisher: b.publisher,
        category: b.category,
        isbn: b.isbn,
        cover: b.cover,
        description: b.description,
      }));

    if (upsertPayload.length > 0) {
      const { error: upsertError } = await supabase
        .from("books")
        .upsert(upsertPayload, { onConflict: "isbn" });

      if (upsertError) {
        console.error("Supabase upsert bestsellers error:", upsertError);
      }
    }

    // upsert 된 행들의 id 조회
    const isbnList = upsertPayload.map((b) => b.isbn!) as string[];
    let isbnToId = new Map<string, number>();
    if (isbnList.length > 0) {
      const { data: idsRows, error: idsError } = await supabase
        .from("books")
        .select("id, isbn")
        .in("isbn", isbnList);

      if (idsError) {
        console.error("Supabase select ids error:", idsError);
      } else {
        idsRows?.forEach((row) => {
          if (row.isbn) isbnToId.set(row.isbn as string, row.id as number);
        });
      }
    }

    const booksWithId = books.map((b) => ({
      ...b,
      id: b.isbn ? isbnToId.get(b.isbn) ?? null : null,
    }));

    return new NextResponse(
      JSON.stringify({ books: booksWithId }),
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "http://localhost:5173",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }

  catch (e) {
    console.error("Aladin bestseller fetch error:", e);
    return NextResponse.json(
      { error: "베스트셀러 정보를 가져오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
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

