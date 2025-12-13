// /lib/supabase/client.ts
'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
// (선택) 너가 타입을 만들었다면 import { Database } from './types'

export function createSupabaseBrowserClient(): SupabaseClient {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  // 타입까지 쓰고 싶으면:
  // return createBrowserClient<Database>(...)
}
