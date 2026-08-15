'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function VerifyPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(30)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()

  useEffect(() => {
    inputs.current[0]?.focus()
    const t = setInterval(() => setResendTimer(n => n > 0 ? n - 1 : 0), 1000)
    return () => clearInterval(t)
  }, [])

  function handleInput(i: number, val: string) {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    if (val && i < 5) inputs.current[i + 1]?.focus()
    if (next.every(d => d) && next.join('').length === 6) verify(next.join(''))
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  async function verify(code: string) {
    setLoading(true)
    setError('')
    const email = sessionStorage.getItem('fitscan_email') || ''
    const supabase = createClient()
    const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
    if (error) {
      setError('Invalid OTP — try again')
      setLoading(false)
      setOtp(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
      return
    }
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', data.user!.id).single()
    if (!profile?.name) router.push('/onboard')
    else router.push('/')
  }

  async function resend() {
    const email = sessionStorage.getItem('fitscan_email') || ''
    const supabase = createClient()
    await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
    setResendTimer(30)
    setOtp(['', '', '', '', '', ''])
    inputs.current[0]?.focus()
  }

  const email = typeof window !== 'undefined' ? sessionStorage.getItem('fitscan_email') : ''

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
      <div className="w-full max-w-sm">
        <button onClick={() => router.push('/login')} className="text-sm text-gray-400 mb-8 flex items-center gap-1">
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Enter OTP</h1>
        <p className="text-sm text-gray-500 mb-8">Sent to {email}</p>

        <div className="flex gap-2 mb-6">
          {otp.map((d, i) => (
            <input
              key={i}
              ref={el => { inputs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleInput(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="w-full aspect-square text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:border-gray-900 transition-colors"
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {loading && <p className="text-gray-400 text-sm mb-4">Verifying…</p>}

        <button
          onClick={resend}
          disabled={resendTimer > 0}
          className="text-sm text-gray-500 disabled:opacity-40"
        >
          {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
        </button>
      </div>
    </div>
  )
}
