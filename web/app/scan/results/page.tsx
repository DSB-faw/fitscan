import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ScanResults from '@/components/scan/ScanResults'

export default async function ScanResultsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role, gym_id').eq('id', user.id).single()
  return <ScanResults userId={user.id} role={profile?.role ?? 'member'} gymId={profile?.gym_id ?? null} />
}
