import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { accessToken, refreshToken } = await req.json()

  const response = NextResponse.json({ success: true })

  // Store accessToken in a regular (non-httpOnly) cookie so JS can read it for tRPC headers
  response.cookies.set("accessToken", accessToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60, // 15 minutes
    path: "/",
  })

  // Store refreshToken in httpOnly cookie for security (not accessed by JS)
  response.cookies.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  })

  return response
}
