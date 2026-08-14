import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function GymMembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('gym_id, role').eq('id', user.id).single()
  if (!me || !['gym_admin', 'super_admin'].includes(me.role ?? '')) redirect('/staff/dashboard')

  const { data: members } = await supabase
    .from('profiles')
    .select('id, name, phone, created_at')
    .eq('gym_id', me.gym_id ?? '')
    .eq('role', 'member')
    .order('name')

  // Get active membership counts
  const { data: activeMemberships } = await supabase
    .from('memberships')
    .select('user_id')
    .eq('gym_id', me.gym_id ?? '')
    .eq('status', 'active')
    .gte('end_date', new Date().toISOString().slice(0, 10))

  const activeSet = new Set(activeMemberships?.map(m => m.user_id))

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-gray-900 text-white px-5 pt-14 pb-6">
        <Link href="/gym/dashboard" className="text-sm text-gray-400 mb-3 block">← Dashboard</Link>
        <h1 className="text-2xl font-bold">Members</h1>
        <p className="text-xs text-gray-400 mt-1">{members?.length ?? 0} total · {activeSet.size} active memberships</p>
      </div>

      <div className="px-4 mt-4 space-y-2">
        {members?.map((m: any) => (
          <div key={m.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900 text-sm">{m.name ?? 'Unnamed'}</div>
              <div className="text-xs text-gray-400 mt-0.5">{m.phone}</div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${activeSet.has(m.id) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {activeSet.has(m.id) ? 'Active' : 'No plan'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
