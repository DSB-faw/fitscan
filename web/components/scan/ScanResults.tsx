'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ── Measurements math (ported from Stage 1) ────────────────────────────────
function ellipsePerimeter(a: number, b: number) {
  if (a <= 0 || b <= 0) return 0
  const h = Math.pow(a - b, 2) / Math.pow(a + b, 2)
  return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)))
}
function medianLm(frames: any[][]) {
  if (!frames?.length) return null
  const n = frames[0].length
  return Array.from({ length: n }, (_, i) => {
    const xs = frames.map(f => f[i].x).sort((a, b) => a - b)
    const ys = frames.map(f => f[i].y).sort((a, b) => a - b)
    const m = Math.floor(frames.length / 2)
    return { x: xs[m], y: ys[m], visibility: frames[0][i].visibility }
  })
}
function improvedAxes(F: number, S: number, D: number): [number, number] {
  const a0 = F / 2, b0 = S / 2, h2 = (D * D) / 2
  const bd = Math.sqrt(Math.max(0, h2 - a0 * a0))
  const ad = Math.sqrt(Math.max(0, h2 - b0 * b0))
  return [(a0 + ad) / 2, (b0 + bd) / 2]
}
function compute(frontLm: any[], diagLm: any[] | null, sideLm: any[], heightCm: number, imgW: number, imgH: number) {
  const r = (v: number) => Math.round(v * 10) / 10
  const noseY = frontLm[0].y, ankleY = Math.max(frontLm[27].y, frontLm[28].y)
  const ratio = (heightCm - 12) / ((ankleY - noseY) * imgH)

  const fLS = frontLm[11], fRS = frontLm[12], fLE = frontLm[13], fRE = frontLm[14]
  const fLH = frontLm[23], fRH = frontLm[24], fLK = frontLm[25], fRK = frontLm[26]
  const fLA = frontLm[27], fRA = frontLm[28]

  const shoulderW = Math.abs(fRS.x - fLS.x) * imgW * ratio + 10
  const frontAtT  = (t: number) => Math.abs((fRS.x + t*(fRH.x-fRS.x)) - (fLS.x + t*(fLH.x-fLS.x))) * imgW * ratio
  const chestF = frontAtT(0.22), waistF = frontAtT(0.55)
  const hipF   = Math.abs(fRH.x - fLH.x) * imgW * ratio + 12
  const armLen = ((Math.hypot((fLE.x-fLS.x)*imgW,(fLE.y-fLS.y)*imgH) + Math.hypot((fRE.x-fRS.x)*imgW,(fRE.y-fRS.y)*imgH)) / 2) * ratio
  const bicep  = Math.PI * (armLen * 0.30)
  const midHipX = (fLH.x + fRH.x) / 2
  const thighF  = (Math.abs(fLH.x + 0.25*(fLK.x-fLH.x) - midHipX) + Math.abs(fRH.x + 0.25*(fRK.x-fRH.x) - midHipX)) * imgW * ratio
  const inseam  = ((fLA.y + fRA.y)/2 - (fLH.y + fRH.y)/2) * imgH * ratio

  const sLS = sideLm[11], sRS = sideLm[12], sLH = sideLm[23], sRH = sideLm[24], sLK = sideLm[25], sRK = sideLm[26]
  const sideAtT = (t: number) => Math.abs((sRS.x + t*(sRH.x-sRS.x)) - (sLS.x + t*(sLH.x-sLS.x))) * imgW * ratio
  const chestD = Math.abs(sRS.x - sLS.x) * imgW * ratio * 1.12
  const waistD = sideAtT(0.55)
  const hipD   = Math.abs(sRH.x - sLH.x) * imgW * ratio
  const thighD = Math.abs((sRH.x+0.75*(sRK.x-sRH.x)) - (sLH.x+0.75*(sLK.x-sLH.x))) * imgW * ratio

  let diagCF = 0, diagWF = 0, diagHF = 0
  if (diagLm) {
    const dLS = diagLm[11], dRS = diagLm[12], dLH = diagLm[23], dRH = diagLm[24]
    const diagAtT = (t: number) => Math.abs((dRS.x+t*(dRH.x-dRS.x)) - (dLS.x+t*(dLH.x-dLS.x))) * imgW * ratio
    diagCF = diagAtT(0.22); diagWF = diagAtT(0.55); diagHF = Math.abs(dRH.x - dLH.x) * imgW * ratio
  }

  let cA, cB, wA, wB, hA, hB
  if (diagLm && diagCF > 0) {
    ;[cA, cB] = improvedAxes(chestF, chestD, diagCF)
    ;[wA, wB] = improvedAxes(waistF, waistD, diagWF)
    ;[hA, hB] = improvedAxes(hipF,   hipD,   diagHF)
  } else {
    cA=chestF/2; cB=chestD/2; wA=waistF/2; wB=waistD/2; hA=hipF/2; hB=hipD/2
  }

  return {
    height: r((ankleY - noseY) * imgH * ratio + 12),
    shoulders: r(shoulderW),
    chest: r(ellipsePerimeter(cA, cB)),
    waist: r(ellipsePerimeter(wA, wB)),
    hips:  r(ellipsePerimeter(hA, hB)),
    bicep: r(bicep),
    thigh: r(ellipsePerimeter(thighF/2, thighD/2)),
    inseam: r(inseam),
  }
}

const ROWS = [
  { key: 'height',    label: 'Height',    primary: false },
  { key: 'shoulders', label: 'Shoulders', primary: false },
  { key: 'chest',     label: 'Chest',     primary: true  },
  { key: 'waist',     label: 'Waist',     primary: true  },
  { key: 'hips',      label: 'Hips',      primary: true  },
  { key: 'bicep',     label: 'Bicep',     primary: false },
  { key: 'thigh',     label: 'Thigh',     primary: false },
  { key: 'inseam',    label: 'Inseam',    primary: false },
]

export default function ScanResults({ userId, role, gymId }: { userId: string; role: string; gymId: string | null }) {
  const [measurements, setMeasurements] = useState<any>(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [has3Views, setHas3Views] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const heightCm     = parseFloat(sessionStorage.getItem('height_cm') || '170')
    const frontFrames  = JSON.parse(sessionStorage.getItem('front_frames')    || '[]')
    const sideFrames   = JSON.parse(sessionStorage.getItem('side_frames')     || '[]')
    const diagFrames   = JSON.parse(sessionStorage.getItem('diagonal_frames') || '[]')
    const imgW         = parseFloat(sessionStorage.getItem('img_width')  || '640')
    const imgH         = parseFloat(sessionStorage.getItem('img_height') || '480')

    if (!frontFrames.length || !sideFrames.length) { router.push('/scan'); return }

    const fLm  = medianLm(frontFrames)!
    const sLm  = medianLm(sideFrames)!
    const dLm  = diagFrames.length > 0 ? medianLm(diagFrames) : null
    setHas3Views(!!dLm)

    const M = compute(fLm, dLm, sLm, heightCm, imgW, imgH)
    setMeasurements(M)

    // Auto-save to Supabase
    async function save() {
      setSaving(true)
      const supabase = createClient()
      const subjectId = sessionStorage.getItem('scan_subject_id') || userId
      const { error } = await supabase.from('scans').insert({
        subject_id: subjectId,
        gym_id: gymId,
        scanned_by: userId !== subjectId ? userId : null,
        height_cm: heightCm,
        scan_height:    M.height,    scan_shoulders: M.shoulders,
        scan_chest:     M.chest,     scan_waist:     M.waist,
        scan_hips:      M.hips,      scan_bicep:     M.bicep,
        scan_thigh:     M.thigh,     scan_inseam:    M.inseam,
        quality:        'good',
        front_frames:   frontFrames.length,
        side_frames:    sideFrames.length,
        diagonal_frames: diagFrames.length,
        has_3views:     !!dLm,
      })
      if (!error) setSaved(true)
      setSaving(false)
      // Cleanup
      ;['front_frames','side_frames','diagonal_frames','img_width','img_height','scan_subject_id','scan_subject_name','scan_mode'].forEach(k => sessionStorage.removeItem(k))
    }
    save()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function done() {
    if (role === 'staff' || role === 'gym_admin') router.push('/staff/dashboard')
    else router.push('/member/dashboard')
  }

  if (!measurements) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-white/60">Calculating measurements…</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-gray-900 text-white px-5 pt-14 pb-6">
        <h1 className="text-2xl font-bold">Scan Results</h1>
        <div className="flex items-center gap-2 mt-1">
          {has3Views && <span className="text-xs bg-purple-600 text-white px-2.5 py-0.5 rounded-full font-medium">3-view scan</span>}
          <span className="text-xs text-gray-400">{saving ? 'Saving…' : saved ? '✓ Saved' : '—'}</span>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-4">
          <div className="grid grid-cols-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-500">Measurement</span>
            <span className="text-xs font-semibold text-gray-500 text-right">cm</span>
          </div>
          {ROWS.map((row, i) => (
            <div key={row.key} className={`grid grid-cols-2 px-4 py-3 items-center ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
              <span className={`text-sm ${row.primary ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{row.label}</span>
              <span className={`text-right font-bold ${row.primary ? 'text-lg text-gray-900' : 'text-sm text-gray-700'}`}>
                {(measurements as any)[row.key] ?? '—'}
              </span>
            </div>
          ))}
        </div>

        <button onClick={done} className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl text-sm active:scale-[0.98] transition-transform">
          {role === 'member' ? 'Back to Dashboard →' : 'Back to Staff Dashboard →'}
        </button>
      </div>
    </div>
  )
}
