import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function GymStaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('gym_id, role').eq('id', user.id).single()
  if (!me || !['gym_admin', 'super_admin'].includes(me.role ?? '')) redirect('/staff/dashboard')

  const { data: staff } = await supabase
    .from('profiles')
    .select('id, name, phone, created_at')
    .eq('gym_id', me.gym_id ?? '')
    .eq('role', 'staff')
    .order('name')

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-gray-900 text-white px-5 pt-14 pb-6">
        <Link href="/gym/dashboard" className="text-sm text-gray-400 mb-3 block">← Dashboard</Link>
        <h1 className="text-2xl font-bold">Staff</h1>
        <p className="text-xs text-gray-400 mt-1">{staff?.length ?? 0} staff members</p>
      </div>

      <div className="px-4 mt-4 space-y-2">
        {staff?.length === 0 && (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <p className="text-gray-500 text-sm">No staff added yet</p>
            <p className="text-xs text-gray-400 mt-1">Ask your staff to sign up, then update their role to "staff" from Supabase</p>
          </div>
        )}
        {staff?.map((s: any) => (
          <div key={s.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900 text-sm">{s.name ?? 'Unnamed'}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.phone}</div>
            </div>
            <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold">Staff</span>
          </div>
        ))}
      </div>
    </div>
  )
}
