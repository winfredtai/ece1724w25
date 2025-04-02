import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  // 获取URL中的code参数
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    
    // 使用code交换session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // 成功登录后重定向到用户个人资料页面
      return NextResponse.redirect(new URL('/home', request.url));
    }
  }

  // 如果出现错误，重定向到登录页
  return NextResponse.redirect(new URL('/login', request.url));
} 