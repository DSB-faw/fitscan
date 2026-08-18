import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role, name').eq('id', user.id).single()
  if (me?.role !== 'super_admin') redirect('/')

  const { data: gyms } = await supabase.from('gyms').select('id, name, city, created_at').order('created_at', { ascending: false })
  const { data: profiles } = await supabase.from('profiles').select('id, role').neq('role', null)

  const totalMembers = profiles?.filter(p => p.role === 'member').length ?? 0
  const totalStaff = profiles?.filter(p => p.role === 'staff').length ?? 0
  const totalGyms = gyms?.length ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 text-white px-5 pt-14 pb-6">
        <p className="text-gray-400 text-xs mb-1">Super Admin</p>
        <h1 className="text-2xl font-bold">FitScan Dashboard</h1>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Gyms', value: totalGyms },
            { label: 'Members', value: totalMembers },
            { label: 'Staff', value: totalStaff },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <div className="text-2xl font-black text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <h2 className="font-bold text-gray-900">Quick Actions</h2>
          <Link href="/admin/gyms/new" className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <span className="text-sm font-medium text-gray-800">+ Add New Gym</span>
            <span className="text-gray-400">→</span>
          </Link>
          <Link href="/admin/gyms" className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <span className="text-sm font-medium text-gray-800">Manage Gyms</span>
            <span className="text-gray-400">→</span>
          </Link>
        </div>

        {/* Gyms list */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-3">All Gyms</h2>
          {gyms?.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No gyms yet — add one above</p>
          )}
          <div className="space-y-2">
            {gyms?.map(g => (
              <Link key={g.id} href={`/admin/gyms/${g.id}`} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{g.name}</div>
                  <div className="text-xs text-gray-400">{g.city}</div>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
