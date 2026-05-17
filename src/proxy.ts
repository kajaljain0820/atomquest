import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET || "my-super-secret-key-for-dev" 
  })
  const path = request.nextUrl.pathname

  // 1. If there's no active token, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const role = token.role as string

  // 2. Admin exclusive paths: config & audit logs
  if (
    (path.startsWith("/dashboard/config") || path.startsWith("/dashboard/audit")) &&
    role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // 3. Manager & Admin paths: team review & exportable reports
  if (
    (path.startsWith("/dashboard/team") || path.startsWith("/dashboard/reports")) &&
    role !== "MANAGER" &&
    role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
  ],
}
