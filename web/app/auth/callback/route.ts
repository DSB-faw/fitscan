import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  // Redirect to client-side handler which can access localStorage for PKCE
  return NextResponse.redirect(`${origin}/auth/confirm${new URL(request.url).search}`)
}
