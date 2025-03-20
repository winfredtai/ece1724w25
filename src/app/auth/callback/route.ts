import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    try {
      const supabase = await createClient()
      
      // 交换授权码获取会话
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        return NextResponse.redirect(`${origin}/auth/callback-error`)
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    } catch (_error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      // 捕获错误但不使用错误对象
      return NextResponse.redirect(`${origin}/auth/callback-error`)
    }
  }

  // 如果没有code参数，重定向到错误页面
  return NextResponse.redirect(`${origin}/auth/callback-error`)
} 