import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Scan } from '@/lib/types'

const MEASUREMENTS = [
  { key: 'scan_chest',     label: 'Chest'     },
  { key: 'scan_waist',     label: 'Waist'     },
  { key: 'scan_hips',      label: 'Hips'      },
  { key: 'scan_shoulders', label: 'Shoulders' },
  { key: 'scan_bicep',     label: 'Bicep'     },
  { key: 'scan_thigh',     label: 'Thigh'     },
]

export default async function MemberDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.name) redirect('/onboard')

  const { data: scans } = await supabase
    .from('scans')
    .select('*')
    .eq('subject_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const latest = scans?.[0] as Scan | undefined
  const prev   = scans?.[1] as Scan | undefined

  function delta(key: string) {
    if (!latest || !prev) return null
    const a = (latest as any)[key], b = (prev as any)[key]
    if (!a || !b) return null
    return (a - b).toFixed(1)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gray-900 text-white px-5 pt-14 pb-6">
        <p className="text-sm text-gray-400 mb-0.5">Welcome back</p>
        <h1 className="text-2xl font-bold">{profile.name}</h1>
        <p className="text-xs text-gray-500 mt-1">{scans?.length ?? 0} scan{scans?.length !== 1 ? 's' : ''} total</p>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/scan" className="bg-gray-900 text-white rounded-2xl p-4 flex flex-col gap-1 active:scale-[0.97] transition-transform">
            <span className="text-2xl">📷</span>
            <span className="font-bold text-sm mt-1">New Scan</span>
            <span className="text-xs text-gray-400">Measure yourself now</span>
          </Link>
          <Link href="/member/history" className="bg-white rounded-2xl p-4 flex flex-col gap-1 shadow-sm active:scale-[0.97] transition-transform">
            <span className="text-2xl">📊</span>
            <span className="font-bold text-sm mt-1 text-gray-900">History</span>
            <span className="text-xs text-gray-400">View all scans</span>
          </Link>
        </div>

        {/* Latest measurements */}
        {latest ? (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Latest measurements</h2>
              <span className="text-xs text-gray-400">{new Date(latest.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {MEASUREMENTS.map(m => {
                const val = (latest as any)[m.key]
                const d   = delta(m.key)
                return (
                  <div key={m.key} className="text-center">
                    <div className="text-xl font-bold text-gray-900">{val ?? '—'}</div>
                    <div className="text-xs text-gray-500">{m.label}</div>
                    {d !== null && (
                      <div className={`text-xs font-semibold mt-0.5 ${parseFloat(d) < 0 ? 'text-green-600' : parseFloat(d) > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {parseFloat(d) > 0 ? '+' : ''}{d}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="text-4xl mb-3">📏</div>
            <p className="font-semibold text-gray-700">No scans yet</p>
            <p className="text-sm text-gray-400 mt-1">Take your first scan to see your measurements</p>
            <Link href="/scan" className="inline-block mt-4 px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl">
              Start Scan →
            </Link>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
        <Link href="/member/dashboard" className="flex-1 py-3 flex flex-col items-center gap-0.5 text-gray-900">
          <span className="text-lg">🏠</span><span className="text-[10px] font-semibold">Home</span>
        </Link>
        <Link href="/scan" className="flex-1 py-3 flex flex-col items-center gap-0.5 text-gray-400">
          <span className="text-lg">📷</span><span className="text-[10px]">Scan</span>
        </Link>
        <Link href="/member/history" className="flex-1 py-3 flex flex-col items-center gap-0.5 text-gray-400">
          <span className="text-lg">📊</span><span className="text-[10px]">History</span>
        </Link>
      </nav>
    </div>
  )
}
