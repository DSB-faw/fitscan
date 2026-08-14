import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ScanEngine from '@/components/scan/ScanEngine'

export default async function ScanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <ScanEngine userId={user.id} />
}
