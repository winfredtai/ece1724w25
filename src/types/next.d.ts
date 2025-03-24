// 覆盖Next.js的类型定义，修复params类型问题
import { NextRequest } from 'next/server';

declare module 'next/server' {
  // 重新定义路由处理函数的类型
  export interface RouteHandlerContext<Params extends Record<string, string> = Record<string, string>> {
    params: Params;
  }

  // 定义GET路由处理函数
  export type RouteHandler<T extends RouteHandlerContext = RouteHandlerContext> = (
    request: NextRequest,
    context: T
  ) => Promise<Response> | Response;
} 