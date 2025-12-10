// /lib/supabase/server.ts
import { cookies } from "next/headers"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
// (선택) import type { Database } from "./types"

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  // ✅ Next 15: cookies() 는 Promise 이므로 await 필수
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // cookieStore 타입: ReadonlyRequestCookies
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // 일부 환경(서버컴포넌트)에서는 set이 막혀 있을 수 있어 try/catch
          try {
            cookieStore.set(name, value, options)
          } catch {
            // 무시
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set(name, "", { ...options, maxAge: 0 })
          } catch {
            // 무시
          }
        },
      },
    }
  )
  // 제네릭 쓰고 싶으면 createServerClient<Database>(...) 로 변경
}
