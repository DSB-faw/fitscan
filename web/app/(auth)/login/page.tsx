'use client'
import { useState } from 'react'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Use direct supabase-js client with implicit flow (no PKCE) for magic links
function getClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { flowType: 'implicit' } }
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.includes('@')) { setError('Enter a valid email address'); return }

    setLoading(true)
    const supabase = getClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-6">📬</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h1>
          <p className="text-sm text-gray-500 mb-2">We sent a sign-in link to</p>
          <p className="text-sm font-semibold text-gray-800 mb-6">{email}</p>
          <p className="text-xs text-gray-400 mb-8">Click the link in the email to sign in. It expires in 1 hour.</p>
          <button onClick={() => setSent(false)} className="text-sm text-gray-500 underline">
            ← Use a different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="text-4xl font-black tracking-tight text-gray-900 mb-1">FitScan</div>
          <p className="text-sm text-gray-500">Body measurements powered by AI</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
            <input
              type="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-gray-900 bg-white"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !email.includes('@')}
            className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-xl text-sm disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            {loading ? 'Sending…' : 'Send Sign-in Link →'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          New here? We'll create your account automatically.
        </p>
      </div>
    </div>
  )
}
