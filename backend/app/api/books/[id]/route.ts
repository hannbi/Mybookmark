// app/api/books/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  // Next 15/16: params 가 Promise
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  console.log("API /api/books/[id] - id:", id);

  const { data, error } = await supabase
    .from("books")
    .select(
      [
        "id",
        "title",
        "author",
        "publisher",
        "category",
        "isbn",
        "cover",         // 표지 URL
        "description",   // 있으면: 책 소개 컬럼
      ].join(", ")
    )
    .eq("id", Number(id))
    .single();

  console.log("supabase error:", error);
  console.log("supabase data:", data);

  if (error || !data) {
    return NextResponse.json(
      { message: "Book not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
