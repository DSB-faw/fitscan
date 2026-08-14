import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function StaffMembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('gym_id, role').eq('id', user.id).single()
  if (!me || !['staff', 'gym_admin', 'super_admin'].includes(me.role ?? '')) redirect('/member/dashboard')

  const { data: members } = await supabase
    .from('profiles')
    .select('id, name, phone, created_at')
    .eq('gym_id', me.gym_id ?? '')
    .eq('role', 'member')
    .order('name')

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gray-900 text-white px-5 pt-14 pb-6">
        <h1 className="text-2xl font-bold">Members</h1>
        <p className="text-xs text-gray-400 mt-1">{members?.length ?? 0} members</p>
      </div>

      <div className="px-4 mt-4 space-y-2">
        {members?.map((m: any) => (
          <div key={m.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-900 text-sm">{m.name ?? 'Unnamed'}</div>
              <div className="text-xs text-gray-400 mt-0.5">{m.phone}</div>
            </div>
            <Link href={`/staff/scan?member=${m.id}`} className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg font-medium">
              Scan
            </Link>
          </div>
        ))}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
        <Link href="/staff/dashboard" className="flex-1 py-3 flex flex-col items-center gap-0.5 text-gray-400">
          <span className="text-lg">🏠</span><span className="text-[10px]">Home</span>
        </Link>
        <Link href="/staff/scan" className="flex-1 py-3 flex flex-col items-center gap-0.5 text-gray-400">
          <span className="text-lg">📷</span><span className="text-[10px]">Scan</span>
        </Link>
        <Link href="/staff/members" className="flex-1 py-3 flex flex-col items-center gap-0.5 text-gray-900">
          <span className="text-lg">👥</span><span className="text-[10px] font-semibold">Members</span>
        </Link>
      </nav>
    </div>
  )
}
