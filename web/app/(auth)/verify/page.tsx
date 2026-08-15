'use client'
import { useRouter } from 'next/navigation'

export default function VerifyPage() {
  const router = useRouter()
  const email = typeof window !== 'undefined' ? sessionStorage.getItem('fitscan_email') : ''

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-6">📬</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h1>
        {email && (
          <>
            <p className="text-sm text-gray-500 mb-1">We sent a sign-in link to</p>
            <p className="text-sm font-semibold text-gray-800 mb-6">{email}</p>
          </>
        )}
        <p className="text-xs text-gray-400 mb-8">Click the link in the email to sign in. It expires in 1 hour.</p>
        <button onClick={() => router.push('/login')} className="text-sm text-gray-500 underline">
          ← Use a different email
        </button>
      </div>
    </div>
  )
}
