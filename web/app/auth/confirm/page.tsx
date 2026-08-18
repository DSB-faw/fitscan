'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ConfirmPage() {
  const router = useRouter()

  useEffect(() => {
    async function handleAuth() {
      const supabase = createClient()

      // Get current session — PKCE exchange happens automatically by the client
      const { data: { session }, error } = await supabase.auth.getSession()

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

      // Listen for auth state change (PKCE may take a moment)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', session.user.id)
            .single()
          if (!profile?.name) router.push('/onboard')
          else router.push('/')
        } else if (event === 'SIGNED_OUT') {
          router.push('/login?error=auth_failed')
        }
      })

      // Timeout fallback
      setTimeout(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) router.push('/login?error=auth_failed')
        })
      }, 5000)

      return () => subscription.unsubscribe()
    }

    handleAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-gray-500 text-sm">Signing you in…</p>
      </div>
    </div>
  )
}
