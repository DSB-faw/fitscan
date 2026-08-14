export type Role = 'super_admin' | 'gym_admin' | 'staff' | 'member'

export interface Profile {
  id: string
  phone: string
  name: string
  role: Role
  gym_id: string | null
  date_of_birth: string | null
  gender: 'male' | 'female' | 'other' | null
  created_at: string
}

export interface Gym {
  id: string
  name: string
  address: string | null
  city: string | null
  phone: string | null
  subscription_status: 'active' | 'trial' | 'expired'
  created_at: string
}

export interface Membership {
  id: string
  user_id: string
  gym_id: string
  plan_name: string
  start_date: string
  end_date: string
  status: 'active' | 'expired' | 'cancelled'
  created_at: string
}

export interface Scan {
  id: string
  subject_id: string
  gym_id: string | null
  scanned_by: string | null
  height_cm: number
  scan_height: number | null
  scan_shoulders: number | null
  scan_chest: number | null
  scan_waist: number | null
  scan_hips: number | null
  scan_bicep: number | null
  scan_thigh: number | null
  scan_inseam: number | null
  tape_chest: number | null
  tape_waist: number | null
  tape_hips: number | null
  tape_shoulders: number | null
  tape_bicep: number | null
  tape_thigh: number | null
  tape_inseam: number | null
  quality: string | null
  has_3views: boolean
  created_at: string
  // joined
  subject?: Profile
  gym?: Gym
}
