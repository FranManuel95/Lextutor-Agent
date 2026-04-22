import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

export async function middleware(request: NextRequest) {
  // Early return for public paths (no auth needed)
  const publicPaths = ["/", "/login"];
  if (publicPaths.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Only validate session for protected routes
  const protectedPrefixes = ["/chat", "/admin", "/exam", "/quiz", "/progress"];
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect to login if accessing protected route without session
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return supabaseResponse;
}

export const config = {
  // Exclude API routes, Next.js internals, and static assets
  matcher: [
    "/((?!api|_next/static|_next/image|_next/data|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|eot)$).*)",
  ],
};
