import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── Definisi route ──────────────────────────────────────────────────────────

/** Route yang bisa diakses tanpa login */
const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password"];

/** Prefix route yang butuh login (protected app area) */
const PROTECTED_PREFIXES = ["/chat", "/account", "/settings"];

/** Route auth yang tidak perlu ditampilkan jika sudah login */
const AUTH_ONLY_ROUTES = ["/login", "/register", "/forgot-password"];

/** Prefix API auth (NextAuth handler) - selalu allow */
const API_AUTH_PREFIX = "/api/auth";

// ── Helper ──────────────────────────────────────────────────────────────────

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ONLY_ROUTES.some((route) => pathname === route) ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-email");
}

// ── Middleware ──────────────────────────────────────────────────────────────

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. NextAuth API routes — selalu loloskan
  if (pathname.startsWith(API_AUTH_PREFIX)) {
    return NextResponse.next();
  }

  // 2. Static files dan internal Next.js — skip
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf)$/)
  ) {
    return NextResponse.next();
  }

  // 3. Ambil JWT token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isLoggedIn = !!token;

  // 4. Protected routes — redirect ke login jika belum login
  if (isProtected(pathname) && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", encodeURIComponent(req.url));
    return NextResponse.redirect(loginUrl);
  }

  // 5. Auth routes (login, register, dll) — redirect ke /chat jika sudah login
  if (isAuthRoute(pathname) && isLoggedIn) {
    return NextResponse.redirect(new URL("/chat", req.url));
  }

  // 6. Root "/" — redirect ke /chat jika sudah login
  if (pathname === "/" && isLoggedIn) {
    return NextResponse.redirect(new URL("/chat", req.url));
  }

  // 7. Tambahkan header role untuk digunakan di server components
  const response = NextResponse.next();

  if (token) {
    response.headers.set("x-user-id", (token.id as string) ?? "");
    response.headers.set("x-user-role", (token.role as string) ?? "user");
    response.headers.set(
      "x-user-role-level",
      String((token.role_level as number) ?? 0)
    );
  }

  return response;
}


// export const config = {
//   matcher: [
//     "/((?!_next/static|_next/image|favicon.ico).*)",
//   ],
// };
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
