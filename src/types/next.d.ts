import { NextRequest } from "next/server";

declare module "next/server" {
  export interface RouteHandlerContext<
    Params extends Record<string, string> = Record<string, string>,
  > {
    params: Params;
  }

  export type RouteHandler<
    T extends RouteHandlerContext = RouteHandlerContext,
  > = (request: NextRequest, context: T) => Promise<Response> | Response;
}
