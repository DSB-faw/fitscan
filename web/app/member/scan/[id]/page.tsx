import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

const ROWS = [
  { key: 'scan_height',    label: 'Height',    tape: 'tape_height'    },
  { key: 'scan_shoulders', label: 'Shoulders', tape: 'tape_shoulders' },
  { key: 'scan_chest',     label: 'Chest',     tape: 'tape_chest'     },
  { key: 'scan_waist',     label: 'Waist',     tape: 'tape_waist'     },
  { key: 'scan_hips',      label: 'Hips',      tape: 'tape_hips'      },
  { key: 'scan_bicep',     label: 'Bicep',     tape: 'tape_bicep'     },
  { key: 'scan_thigh',     label: 'Thigh',     tape: 'tape_thigh'     },
  { key: 'scan_inseam',    label: 'Inseam',    tape: 'tape_inseam'    },
]

export default async function ScanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: scan } = await supabase.from('scans').select('*').eq('id', id).single()
  if (!scan || scan.subject_id !== user.id) notFound()

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-gray-900 text-white px-5 pt-14 pb-6">
        <Link href="/member/history" className="text-sm text-gray-400 mb-3 block">← History</Link>
        <h1 className="text-2xl font-bold">Scan Detail</h1>
        <p className="text-xs text-gray-400 mt-1">
          {new Date(scan.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          {scan.has_3views && <span className="ml-2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">3-view scan</span>}
        </p>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-500">Measurement</span>
            <span className="text-xs font-semibold text-gray-500 text-center">App (cm)</span>
            <span className="text-xs font-semibold text-gray-500 text-center">Tape (cm)</span>
          </div>
          {ROWS.map((row, i) => {
            const app  = (scan as any)[row.key]
            const tape = (scan as any)[row.tape]
            const diff = app && tape ? (app - tape).toFixed(1) : null
            return (
              <div key={row.key} className={`grid grid-cols-3 px-4 py-3 items-center ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                <span className="text-sm font-medium text-gray-700">{row.label}</span>
                <span className="text-sm font-bold text-gray-900 text-center">{app ?? '—'}</span>
                <div className="text-center">
                  <span className="text-sm text-gray-600">{tape ?? '—'}</span>
                  {diff !== null && (
                    <span className={`ml-1 text-xs font-semibold ${Math.abs(parseFloat(diff)) <= 2 ? 'text-green-600' : 'text-red-500'}`}>
                      ({parseFloat(diff) > 0 ? '+' : ''}{diff})
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-3 bg-white rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Quality: <strong className="text-gray-800">{scan.quality ?? '—'}</strong></span>
            <span>Frames: {scan.front_frames ?? 0}F / {scan.side_frames ?? 0}S / {scan.diagonal_frames ?? 0}D</span>
          </div>
        </div>
      </div>
    </div>
  )
}
