import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // First handle i18n routing
  const response = handleI18nRouting(request);

  // Check if the path is a user path that needs authentication
  const path = request.nextUrl.pathname;
  const isUserPath = path.startsWith("/user") || /^\/[\w-]+\/user/.test(path); // Matches /user/* or /[locale]/user/*

  if (isUserPath) {
    // Only apply Supabase auth middleware for user paths
    return await updateSession(request, response);
  }

  // For all other paths, just return the i18n routing response
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
    // "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
