import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

const middlewares = {
  // "/api": apiMiddleware,
  // "/dash": mainMiddleware,
} as const;

export const config = {
  matcher: ["/", "/dash", "/dash/:path*"],
};

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/") {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/dash";

    return NextResponse.redirect(redirectUrl);
  }

  if (req.nextUrl.pathname === "/dash") {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/dash/swap";

    return NextResponse.redirect(redirectUrl);
  }

  if (req.nextUrl.pathname.startsWith("/dash")) {
    const cookie = req.cookies.get("expired_at");
    const expiredAt = cookie?.value;
    const isAlive = true;// !!expiredAt && Number(expiredAt) >= new Date().getTime();
    if (!isAlive) {
      return NextResponse.redirect(new URL("/lock", req.url));
    }
  }

  return NextResponse.next();

  // for (const [prefix, middleware] of Object.entries(middlewares)) {
  //   if (req.nextUrl.pathname.startsWith(prefix)) {
  //     return middleware(req);
  //   }
  // }
}

async function mainMiddleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    // Auth condition met, continue on to the page.
    return NextResponse.next();
  }

  // Auth condition not met, redirect to home page.
  const redirectUrl = req.nextUrl.clone();
  redirectUrl.pathname = "/login";
  redirectUrl.searchParams.set("redirect", req.nextUrl.pathname);

  return NextResponse.redirect(redirectUrl);
}

async function apiMiddleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    // Auth condition met, continue on to the page.
    return NextResponse.next();
  }

  // Auth condition not met, return 401.
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
