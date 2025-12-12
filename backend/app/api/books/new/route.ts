// app/api/books/new/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TTB_KEY = process.env.ALADIN_TTB_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 서비스 롤 키 사용 (서버 전용)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY ?? "");

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
        QueryType: "ItemNewSpecial", // 신간 리스트
        MaxResults: "12",
        SearchTarget: "Book",
        output: "js",
        Version: "20131101",
        Cover: "Big",
      }).toString();

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.error("Aladin new items status:", res.status);
      return NextResponse.json(
        { error: "신간 정보를 가져오지 못했습니다." },
        { status: 502 }
      );
    }

    const json = await res.json();
    const items: any[] = json.item ?? [];

    const books = items.map((item) => ({
      title: item.title as string,
      author: (item.author as string) || null,
      publisher: (item.publisher as string) || null,
      category: (item.categoryName as string) || null,
      isbn: (item.isbn13 as string) || (item.isbn as string) || null,
      cover: (item.cover as string) || null,
      description: (item.description as string) || null,
      pubDate: (item.pubDate as string) || null,
    }));

    // ISBN 기준 upsert
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
        console.error("Supabase upsert new books error:", upsertError);
      }
    }

    // id 매핑용 isbn 목록 조회
    const isbnList = upsertPayload.map((b) => b.isbn!) as string[];
    const isbnToId = new Map<string, number>();

    if (isbnList.length > 0) {
      const { data: idRows, error: idErr } = await supabase
        .from("books")
        .select("id, isbn")
        .in("isbn", isbnList);

      if (idErr) {
        console.error("Supabase select ids (new) error:", idErr);
      } else {
        idRows?.forEach((row) => {
          if (row.isbn) isbnToId.set(row.isbn as string, row.id as number);
        });
      }
    }

    const booksWithId = books.map((b) => ({
      ...b,
      id: b.isbn ? isbnToId.get(b.isbn) ?? null : null,
    }));

    return NextResponse.json({ books: booksWithId });
  } catch (e) {
    console.error("Aladin new items fetch error:", e);
    return NextResponse.json(
      { error: "신간 정보를 가져오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
