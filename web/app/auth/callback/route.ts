import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const supabase = await createClient()
  let user = null

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) user = data.user
  } else if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (!error) user = data.user
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()

    if (!profile?.name) return NextResponse.redirect(`${origin}/onboard`)
    return NextResponse.redirect(`${origin}/`)
  }

  // For implicit flow, session is set via URL fragment on the client side
  // Redirect to a client page that will detect the session
  return NextResponse.redirect(`${origin}/auth/confirm`)
}
