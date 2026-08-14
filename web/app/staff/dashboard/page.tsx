import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function StaffDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*, gyms(name)').eq('id', user.id).single()
  if (!profile?.name) redirect('/onboard')
  if (!['staff', 'gym_admin', 'super_admin'].includes(profile.role)) redirect('/member/dashboard')

  const today = new Date().toISOString().slice(0, 10)
  const { data: todayScans } = await supabase
    .from('scans')
    .select('id, created_at, subject_id, scan_chest, scan_waist, profiles!scans_subject_id_fkey(name)')
    .eq('gym_id', profile.gym_id)
    .gte('created_at', today)
    .order('created_at', { ascending: false })

  const { count: totalMembers } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('gym_id', profile.gym_id)
    .eq('role', 'member')

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gray-900 text-white px-5 pt-14 pb-6">
        <p className="text-sm text-gray-400">{(profile as any).gyms?.name ?? 'Your Gym'}</p>
        <h1 className="text-2xl font-bold mt-0.5">Staff Dashboard</h1>
        <p className="text-xs text-gray-500 mt-1">Hi, {profile.name}</p>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-3xl font-bold text-gray-900">{todayScans?.length ?? 0}</div>
            <div className="text-xs text-gray-500 mt-1">Scans today</div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
            <div className="text-3xl font-bold text-gray-900">{totalMembers ?? 0}</div>
            <div className="text-xs text-gray-500 mt-1">Members</div>
          </div>
        </div>

        {/* New scan CTA */}
        <Link href="/staff/scan" className="bg-gray-900 text-white rounded-2xl p-5 flex items-center justify-between active:scale-[0.98] transition-transform block">
          <div>
            <div className="font-bold text-lg">New Scan</div>
            <div className="text-sm text-gray-400 mt-0.5">Select member → run 3-scan</div>
          </div>
          <span className="text-3xl">📷</span>
        </Link>

        {/* Today's scans */}
        <div>
          <h2 className="font-bold text-gray-700 text-sm mb-2 px-1">Today's scans</h2>
          {todayScans?.length === 0 && (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm text-gray-400 text-sm">No scans yet today</div>
          )}
          {todayScans?.map((s: any) => (
            <div key={s.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm mb-2 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900 text-sm">{s.profiles?.name ?? 'Unknown'}</div>
                <div className="text-xs text-gray-400 mt-0.5">Chest {s.scan_chest ?? '—'} · Waist {s.scan_waist ?? '—'} cm</div>
              </div>
              <span className="text-xs text-gray-400">{new Date(s.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ))}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
        <Link href="/staff/dashboard" className="flex-1 py-3 flex flex-col items-center gap-0.5 text-gray-900">
          <span className="text-lg">🏠</span><span className="text-[10px] font-semibold">Home</span>
        </Link>
        <Link href="/staff/scan" className="flex-1 py-3 flex flex-col items-center gap-0.5 text-gray-400">
          <span className="text-lg">📷</span><span className="text-[10px]">Scan</span>
        </Link>
        <Link href="/staff/members" className="flex-1 py-3 flex flex-col items-center gap-0.5 text-gray-400">
          <span className="text-lg">👥</span><span className="text-[10px]">Members</span>
        </Link>
      </nav>
    </div>
  )
}
