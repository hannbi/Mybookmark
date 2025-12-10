import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function ServerTestPage() {
  const supabase = await createSupabaseServerClient()

  const { data: books, error } = await supabase
    .from('books')
    .select('id, title')
    .order('id')

  return (
    <div style={{ padding: 20 }}>
      <h1>📌 Server Supabase Test</h1>
      <p>서버(Server Component)에서 books 조회 테스트</p>

      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}

      <ul>
        {books?.map((book) => (
          <li key={book.id}>{book.title}</li>
        ))}
      </ul>

      {(!books || books.length === 0) && <p>데이터 없음</p>}
    </div>
  )
}
