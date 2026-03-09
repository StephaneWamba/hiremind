import { NextRequest, NextResponse } from "next/server"

export default function middleware(req: NextRequest) {
  const url = req.nextUrl.pathname

  const protectedRoutes = ["/dashboard", "/practice", "/interviews", "/interview"]
  const isProtectedRoute = protectedRoutes.some((route) => url.startsWith(route))

  const publicAuthRoutes = ["/sign-in", "/sign-up", "/"]

  const token = req.cookies.get("accessToken")?.value

  if (token && publicAuthRoutes.includes(url)) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next|api|static|.*\\..*|favicon.ico).*)", "/"],
}
