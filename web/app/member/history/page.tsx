import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Scan } from '@/lib/types'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: scans } = await supabase
    .from('scans')
    .select('*')
    .eq('subject_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gray-900 text-white px-5 pt-14 pb-6">
        <Link href="/member/dashboard" className="text-sm text-gray-400 mb-3 block">← Back</Link>
        <h1 className="text-2xl font-bold">Scan History</h1>
        <p className="text-xs text-gray-500 mt-1">{scans?.length ?? 0} scans</p>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {scans?.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <p className="text-gray-500">No scans yet</p>
            <Link href="/scan" className="inline-block mt-4 px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl">
              Take First Scan →
            </Link>
          </div>
        )}

        {scans?.map((scan: Scan) => (
          <Link key={scan.id} href={`/member/scan/${scan.id}`}
            className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between active:scale-[0.98] transition-transform block">
            <div>
              <div className="font-semibold text-gray-900">
                {new Date(scan.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Chest {scan.scan_chest ?? '—'} · Waist {scan.scan_waist ?? '—'} · Hips {scan.scan_hips ?? '—'} cm
              </div>
            </div>
            <div className="flex items-center gap-2">
              {scan.has_3views && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">3-view</span>}
              <span className="text-gray-400">›</span>
            </div>
          </Link>
        ))}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
        <Link href="/member/dashboard" className="flex-1 py-3 flex flex-col items-center gap-0.5 text-gray-400">
          <span className="text-lg">🏠</span><span className="text-[10px]">Home</span>
        </Link>
        <Link href="/scan" className="flex-1 py-3 flex flex-col items-center gap-0.5 text-gray-400">
          <span className="text-lg">📷</span><span className="text-[10px]">Scan</span>
        </Link>
        <Link href="/member/history" className="flex-1 py-3 flex flex-col items-center gap-0.5 text-gray-900">
          <span className="text-lg">📊</span><span className="text-[10px] font-semibold">History</span>
        </Link>
      </nav>
    </div>
  )
}
