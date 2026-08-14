import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function GymDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*, gyms(*)').eq('id', user.id).single()
  if (!profile?.name) redirect('/onboard')
  if (!['gym_admin', 'super_admin'].includes(profile.role)) redirect('/staff/dashboard')

  const gym = (profile as any).gyms

  const { count: memberCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('gym_id', profile.gym_id).eq('role', 'member')
  const { count: staffCount }  = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('gym_id', profile.gym_id).eq('role', 'staff')
  const { count: scanCount }   = await supabase.from('scans').select('id', { count: 'exact', head: true }).eq('gym_id', profile.gym_id)

  const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0)
  const { count: monthScans } = await supabase.from('scans').select('id', { count: 'exact', head: true }).eq('gym_id', profile.gym_id).gte('created_at', thisMonth.toISOString())

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gray-900 text-white px-5 pt-14 pb-6">
        <p className="text-xs text-gray-400 mb-0.5">Gym Admin</p>
        <h1 className="text-2xl font-bold">{gym?.name ?? 'Your Gym'}</h1>
        <p className="text-xs text-gray-500 mt-1">{gym?.city}</p>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total members', value: memberCount ?? 0, icon: '👥' },
            { label: 'Staff',         value: staffCount ?? 0,  icon: '🏃' },
            { label: 'Total scans',   value: scanCount ?? 0,   icon: '📊' },
            { label: 'This month',    value: monthScans ?? 0,  icon: '📅' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="space-y-2">
          {[
            { href: '/gym/members', label: 'Manage Members', sub: 'View, add, manage memberships', icon: '👥' },
            { href: '/gym/staff',   label: 'Manage Staff',   sub: 'Add or remove staff accounts',  icon: '🏃' },
            { href: '/gym/settings',label: 'Gym Settings',   sub: 'Name, address, contact info',   icon: '⚙️' },
          ].map(l => (
            <Link key={l.href} href={l.href} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-transform block">
              <span className="text-2xl">{l.icon}</span>
              <div>
                <div className="font-semibold text-gray-900 text-sm">{l.label}</div>
                <div className="text-xs text-gray-400">{l.sub}</div>
              </div>
              <span className="ml-auto text-gray-400">›</span>
            </Link>
          ))}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
        <Link href="/gym/dashboard" className="flex-1 py-3 flex flex-col items-center gap-0.5 text-gray-900">
          <span className="text-lg">🏠</span><span className="text-[10px] font-semibold">Home</span>
        </Link>
        <Link href="/gym/members" className="flex-1 py-3 flex flex-col items-center gap-0.5 text-gray-400">
          <span className="text-lg">👥</span><span className="text-[10px]">Members</span>
        </Link>
        <Link href="/gym/staff" className="flex-1 py-3 flex flex-col items-center gap-0.5 text-gray-400">
          <span className="text-lg">🏃</span><span className="text-[10px]">Staff</span>
        </Link>
      </nav>
    </div>
  )
}
