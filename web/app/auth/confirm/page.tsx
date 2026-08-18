'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

function ConfirmInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function handleAuth() {
      const supabase = createClient()
      const code = searchParams.get('code')

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error && data.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', data.user.id)
            .single()
          if (!profile?.name) router.push('/onboard')
          else router.push('/')
          return
        }
      }

      // Fallback: check existing session
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', session.user.id)
          .single()
        if (!profile?.name) router.push('/onboard')
        else router.push('/')
        return
      }

      router.push('/login?error=auth_failed')
    }

    handleAuth()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-gray-500 text-sm">Signing you in…</p>
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense>
      <ConfirmInner />
    </Suspense>
  )
}
