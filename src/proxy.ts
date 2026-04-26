

import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req: any) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  const isDashboardRoute = nextUrl.pathname.startsWith("/app");

  if (isDashboardRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
});
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
