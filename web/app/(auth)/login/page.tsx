'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    // Normalise — prepend +91 if no country code
    const normalised = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`
    if (normalised.length < 12) { setError('Enter a valid 10-digit mobile number'); return }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({ phone: normalised })
    if (error) { setError(error.message); setLoading(false); return }

    sessionStorage.setItem('fitscan_phone', normalised)
    router.push('/verify')
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
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mobile number</label>
            <div className="flex">
              <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm font-medium">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="98765 43210"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-r-xl text-base focus:outline-none focus:border-gray-900 bg-white"
                required
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || phone.length < 10}
            className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-xl text-sm disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            {loading ? 'Sending OTP…' : 'Send OTP →'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          New here? We'll create your account automatically.
        </p>
      </div>
    </div>
  )
}
