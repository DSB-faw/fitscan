'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewGymPage() {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !city.trim()) { setError('Name and city are required'); return }
    setLoading(true)
    setError('')

    const supabase = createClient()

    // Create gym
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .insert({ name: name.trim(), city: city.trim(), address: address.trim() })
      .select('id')
      .single()

    if (gymError) { setError(gymError.message); setLoading(false); return }

    // If admin email provided, find user and assign as gym_admin
    if (adminEmail.trim()) {
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', adminEmail.trim())
        .single()

      if (adminProfile) {
        await supabase.from('profiles').update({ gym_id: gym.id, role: 'gym_admin' }).eq('id', adminProfile.id)
      }
    }

    router.push('/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gray-900 text-white px-5 pt-14 pb-6">
        <button onClick={() => router.push('/admin/dashboard')} className="text-sm text-gray-400 mb-3 block">← Back</button>
        <h1 className="text-2xl font-bold">Add New Gym</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 mt-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Gym Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. FitZone Gym"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">City *</label>
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Mumbai"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Address</label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Gym Admin Email <span className="text-gray-400 font-normal">(optional)</span></label>
            <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@gym.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-900" />
            <p className="text-xs text-gray-400 mt-1">User must already have an account</p>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm px-1">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl text-sm disabled:opacity-40">
          {loading ? 'Creating…' : 'Create Gym →'}
        </button>
      </form>
    </div>
  )
}
