'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function StaffScanPage() {
  const [members, setMembers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [height, setHeight] = useState('')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: me } = await supabase.from('profiles').select('gym_id').eq('id', (await supabase.auth.getUser()).data.user!.id).single()
      const { data } = await supabase.from('profiles').select('id, name, phone').eq('gym_id', me?.gym_id ?? '').eq('role', 'member').order('name')
      setMembers(data ?? [])
    }
    load()
  }, [])

  const filtered = members.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.phone?.includes(search)
  )

  async function createMember() {
    if (!newName.trim() || newPhone.length < 10) return
    setLoading(true)
    const supabase = createClient()
    const { data: me } = await supabase.from('profiles').select('gym_id').eq('id', (await supabase.auth.getUser()).data.user!.id).single()
    const gymId = me?.gym_id ?? null

    // Sign up via OTP — creates auth user + profile trigger fires
    const phone = `+91${newPhone.replace(/\D/g, '')}`
    const { data: existing } = await supabase.from('profiles').select('id, name').eq('phone', phone).single()

    if (existing) {
      // Update name + gym if already exists
      await supabase.from('profiles').update({ name: newName.trim(), gym_id: gymId, role: 'member' }).eq('id', existing.id)
      setSelected({ ...existing, name: newName.trim() })
    } else {
      // Create a placeholder — they'll complete profile on first login
      const { error } = await supabase.from('profiles').insert({ name: newName.trim(), phone, gym_id: gymId, role: 'member' })
      if (!error) {
        const { data: newProfile } = await supabase.from('profiles').select('id, name, phone').eq('phone', phone).single()
        setSelected(newProfile)
      }
    }
    setCreating(false)
    setLoading(false)
  }

  function startScan() {
    if (!selected || !height) return
    sessionStorage.setItem('scan_subject_id', selected.id)
    sessionStorage.setItem('scan_subject_name', selected.name)
    sessionStorage.setItem('height_cm', height)
    sessionStorage.setItem('scan_mode', 'staff')
    router.push('/scan')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-gray-900 text-white px-5 pt-14 pb-6">
        <button onClick={() => router.push('/staff/dashboard')} className="text-sm text-gray-400 mb-3 block">← Back</button>
        <h1 className="text-2xl font-bold">New Scan</h1>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Step 1 — Select member */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-3">1. Select member</h2>

          {selected ? (
            <div className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-3">
              <div>
                <div className="font-semibold text-gray-900">{selected.name}</div>
                <div className="text-xs text-gray-500">{selected.phone}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-xs text-gray-400">Change</button>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Search by name or phone…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900 mb-3"
              />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filtered.map(m => (
                  <button key={m.id} onClick={() => setSelected(m)}
                    className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-gray-50 flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-900">{m.name}</span>
                    <span className="text-xs text-gray-400">{m.phone}</span>
                  </button>
                ))}
                {filtered.length === 0 && search && (
                  <p className="text-xs text-gray-400 px-4 py-2">No match — create new member below</p>
                )}
              </div>

              {/* Create new */}
              {!creating ? (
                <button onClick={() => setCreating(true)} className="mt-3 w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 font-medium">
                  + Add new member
                </button>
              ) : (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <input type="text" placeholder="Member name" value={newName} onChange={e => setNewName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900" />
                  <input type="tel" placeholder="Phone (10 digits)" value={newPhone} onChange={e => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900" />
                  <div className="flex gap-2">
                    <button onClick={() => setCreating(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500">Cancel</button>
                    <button onClick={createMember} disabled={loading} className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold disabled:opacity-40">
                      {loading ? 'Saving…' : 'Add'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Step 2 — Height */}
        {selected && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-3">2. Enter height</h2>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="175" min={100} max={250} value={height}
                onChange={e => setHeight(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-gray-900"
              />
              <span className="text-sm text-gray-500 font-medium">cm</span>
            </div>
          </div>
        )}

        {/* Start scan */}
        {selected && height && (
          <button onClick={startScan}
            className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl text-base active:scale-[0.98] transition-transform">
            Start 3-Scan →
          </button>
        )}
      </div>
    </div>
  )
}
