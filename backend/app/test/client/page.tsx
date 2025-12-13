'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function ClientTestPage() {
  const [books, setBooks] = useState<any[]>([])
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('books').select('*')
      if (error) {
        console.error('client select error:', error)
      } else {
        setBooks(data ?? [])
      }
    }
    load()
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h1>📌 Client Supabase Test</h1>
      <p>브라우저(Client)에서 books 테이블 조회 테스트</p>

      <ul>
        {books.map((book) => (
          <li key={book.id}>{book.title}</li>
        ))}
      </ul>

      {books.length === 0 && <p>데이터 없음</p>}
    </div>
  )
}
