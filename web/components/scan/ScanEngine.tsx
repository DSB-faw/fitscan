'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// Mirrors the Stage 1 scan logic — same state machine, same quality checks,
// same measurements math — but saves results to Supabase via the results page.

declare global {
  interface Window { Pose: any }
}

type ScanState = 'LOADING' | 'FRONT' | 'TRANSITION' | 'SIDE' | 'DIAGONAL_TRANSITION' | 'DIAGONAL' | 'DONE'

const FRAMES_NEEDED = 15
const MIN_VIS = 0.60
const BODY_MIN = 0.63, BODY_MAX = 0.93
const CENTER_MAX = 0.18
const TILT_MAX = 6
const LEAN_MAX = 10
const BR_MIN = 35, BR_MAX = 225

const CONNECTIONS = [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28]]

export default function ScanEngine({ userId }: { userId: string }) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef  = useRef<ScanState>('LOADING')
  const goodRef   = useRef(0)
  const frontRef  = useRef<any[]>([])
  const sideRef   = useRef<any[]>([])
  const diagRef   = useRef<any[]>([])
  const imgRef    = useRef({ w: 640, h: 480 })
  const router    = useRouter()

  const [uiState, setUiState]     = useState<ScanState>('LOADING')
  const [status, setStatus]       = useState('Initialising…')
  const [statusGood, setStatusGood] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [transConfig, setTransConfig] = useState<any>(null)
  const [countdown, setCountdown] = useState(3)
  const [error, setError]         = useState('')

  function speak(text: string) {
    try {
      speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.rate = 0.95
      speechSynthesis.speak(u)
    } catch {}
  }

  function getBrightness(lm: any[]) {
    try {
      const v = videoRef.current!
      const c = document.createElement('canvas'); c.width = 80; c.height = 80
      const cx = c.getContext('2d', { willReadFrequently: true })!
      cx.drawImage(v, lm[0].x * imgRef.current.w - 40, lm[0].y * imgRef.current.h - 40, 80, 80, 0, 0, 80, 80)
      const d = cx.getImageData(0, 0, 80, 80).data
      let s = 0; for (let i = 0; i < d.length; i += 4) s += 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2]
      return s / (d.length / 4)
    } catch { return 128 }
  }

  function checkFront(lm: any[], br: number) {
    if (!lm || lm.length < 33) return { ok: false, msg: 'No pose detected' }
    const req = [0,11,12,23,24,27,28]
    if (!req.every(i => lm[i].visibility >= MIN_VIS)) return { ok: false, msg: 'Step back — full body not visible' }
    const ratio = Math.max(lm[27].y, lm[28].y) - lm[0].y
    if (ratio < BODY_MIN) return { ok: false, msg: 'Buddy — step a bit closer' }
    if (ratio > BODY_MAX) return { ok: false, msg: 'Buddy — step back a little' }
    const mid = (lm[11].x + lm[12].x) / 2
    if (Math.abs(mid - 0.5) > CENTER_MAX) return { ok: false, msg: mid < 0.5 ? 'Buddy — move right' : 'Buddy — move left' }
    const tilt = Math.atan2(Math.abs(lm[11].y - lm[12].y), Math.abs(lm[11].x - lm[12].x)) * 180 / Math.PI
    if (tilt > TILT_MAX) return { ok: false, msg: 'Stand straight — shoulders level' }
    if (br < BR_MIN) return { ok: false, msg: 'Too dark — move to better light' }
    if (br > BR_MAX) return { ok: false, msg: 'Too bright — avoid backlight' }
    return { ok: true, msg: 'Perfect — hold still' }
  }

  function checkSide(lm: any[], br: number) {
    if (!lm || lm.length < 33) return { ok: false, msg: 'No pose detected' }
    const req = [11,12,23,24,28]
    if (!req.every(i => lm[i].visibility >= MIN_VIS - 0.08)) return { ok: false, msg: 'Full body not visible' }
    const ratio = lm[28].y - lm[12].y
    if (ratio < BODY_MIN) return { ok: false, msg: 'Buddy — step closer' }
    if (ratio > BODY_MAX) return { ok: false, msg: 'Buddy — step back' }
    if (Math.abs(lm[12].x - 0.5) > CENTER_MAX + 0.05) return { ok: false, msg: 'Centre the subject' }
    const lean = Math.atan2(Math.abs(lm[12].x - lm[24].x), Math.abs(lm[24].y - lm[12].y)) * 180 / Math.PI
    if (lean > LEAN_MAX) return { ok: false, msg: "Don't lean — stand straight" }
    if (br < BR_MIN) return { ok: false, msg: 'Too dark' }
    if (br > BR_MAX) return { ok: false, msg: 'Too bright' }
    return { ok: true, msg: 'Perfect — hold still' }
  }

  function drawOverlay(lm: any[], allPass: boolean) {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!lm) return
    const cw = canvas.width, ch = canvas.height
    const color = allPass ? '#00ff88' : 'rgba(255,165,0,0.9)'
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.7
    ;(CONNECTIONS as number[][]).forEach(([a, b]) => {
      if (lm[a].visibility > 0.5 && lm[b].visibility > 0.5) {
        ctx.beginPath()
        ctx.moveTo(cw - lm[a].x * cw, lm[a].y * ch)
        ctx.lineTo(cw - lm[b].x * cw, lm[b].y * ch)
        ctx.stroke()
      }
    })
    ctx.globalAlpha = 1; ctx.fillStyle = color
    ;[0,11,12,13,14,23,24,25,26,27,28].forEach(i => {
      if (lm[i].visibility > 0.5) {
        ctx.beginPath(); ctx.arc(cw - lm[i].x * cw, lm[i].y * ch, 4, 0, Math.PI * 2); ctx.fill()
      }
    })
    ctx.globalAlpha = 1
  }

  function showTransition(icon: string, title: string, sub: string, voice: string, onDone: () => void) {
    setTransConfig({ icon, title, sub })
    setTimeout(() => speak(voice), 300)
    let c = 3
    setCountdown(c)
    const iv = setInterval(() => {
      c--; setCountdown(c)
      if (c <= 0) { clearInterval(iv); setTransConfig(null); onDone() }
    }, 1000)
  }

  function startSide() {
    stateRef.current = 'SIDE'
    goodRef.current = 0; sideRef.current = []
    setUiState('SIDE'); setProgress(0)
    setStatus('Buddy — hold at shoulder height'); setStatusGood(false)
  }

  function startDiagonal() {
    stateRef.current = 'DIAGONAL'
    goodRef.current = 0; diagRef.current = []
    setUiState('DIAGONAL'); setProgress(0)
    setStatus('Subject — face the corner at 45°'); setStatusGood(false)
  }

  function finishScan() {
    const subjectId = sessionStorage.getItem('scan_subject_id') || userId
    sessionStorage.setItem('scan_subject_id', subjectId)
    sessionStorage.setItem('front_frames',    JSON.stringify(frontRef.current))
    sessionStorage.setItem('side_frames',     JSON.stringify(sideRef.current))
    sessionStorage.setItem('diagonal_frames', JSON.stringify(diagRef.current))
    sessionStorage.setItem('img_width',  String(imgRef.current.w))
    sessionStorage.setItem('img_height', String(imgRef.current.h))
    router.push('/scan/results')
  }

  useEffect(() => {
    const video = videoRef.current!
    const canvas = canvasRef.current!

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener('resize', resize); resize()

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        })
        video.srcObject = stream
        await new Promise(r => { video.onloadedmetadata = r })
        await video.play()
      } catch (e: any) {
        setError('Camera access required. Please allow and reload.')
        return
      }

      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js'
      script.crossOrigin = 'anonymous'
      script.onload = () => {
        const pose = new window.Pose({
          locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`
        })
        pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, enableSegmentation: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 })

        pose.onResults((results: any) => {
          const s = stateRef.current
          if (s === 'LOADING' || s === 'TRANSITION' || s === 'DIAGONAL_TRANSITION' || s === 'DONE') return

          const lm = results.poseLandmarks
          imgRef.current = { w: video.videoWidth || 640, h: video.videoHeight || 480 }
          const br = lm ? getBrightness(lm) : 128
          const q  = s === 'SIDE' ? checkSide(lm, br) : checkFront(lm, br)

          drawOverlay(lm, q.ok)
          setStatus(q.msg); setStatusGood(q.ok)

          if (q.ok && lm) {
            goodRef.current++
            const frame = lm.map((l: any) => ({ x: l.x, y: l.y, z: l.z, visibility: l.visibility }))
            if (s === 'SIDE') sideRef.current.push(frame)
            else if (s === 'DIAGONAL') diagRef.current.push(frame)
            else frontRef.current.push(frame)
            setProgress(goodRef.current)

            if (goodRef.current >= FRAMES_NEEDED) {
              if (s === 'FRONT') {
                stateRef.current = 'TRANSITION'; setUiState('TRANSITION'); goodRef.current = 0; setProgress(0)
                setTimeout(() => showTransition('↩️', 'Scan 1 of 3 done!',
                  'Subject — turn <b>left</b> · Buddy — stay in place',
                  'Front scan done. Subject, turn to your left. Buddy, stay in the same spot.',
                  startSide), 400)
              } else if (s === 'SIDE') {
                stateRef.current = 'DIAGONAL_TRANSITION'; setUiState('DIAGONAL_TRANSITION'); goodRef.current = 0; setProgress(0)
                setTimeout(() => showTransition('↗️', 'Scan 2 of 3 done!',
                  'Subject — turn back <b>45° right</b> · Face the corner · Buddy — stay in place',
                  'Side scan done. Subject, turn back 45 degrees to the right. Buddy, stay in the same spot.',
                  startDiagonal), 400)
              } else if (s === 'DIAGONAL') {
                stateRef.current = 'DONE'; setUiState('DONE')
                speak('All scans done. Calculating measurements.')
                setTimeout(finishScan, 1500)
              }
            }
          } else {
            goodRef.current = 0
            if (s === 'FRONT') frontRef.current = []
            else if (s === 'SIDE') sideRef.current = []
            else if (s === 'DIAGONAL') diagRef.current = []
            setProgress(0)
          }
        })

        ;(navigator as any).wakeLock?.request('screen').catch(() => {})

        let processing = false
        async function pump() {
          if (!processing && video.readyState >= 2) {
            processing = true
            try { await pose.send({ image: video }) } catch {}
            processing = false
          }
          requestAnimationFrame(pump)
        }

        stateRef.current = 'FRONT'; setUiState('FRONT')
        setStatus('Buddy — hold phone at shoulder height')
        speak('Starting front scan. Buddy, hold the phone at shoulder height, about 6 to 8 feet from the subject.')
        pump()
      }
      document.head.appendChild(script)
    }

    init()
    return () => {
      window.removeEventListener('resize', resize)
      // Stop all camera tracks to turn off the camera indicator
      const stream = videoRef.current?.srcObject as MediaStream | null
      stream?.getTracks().forEach(t => t.stop())
      if (videoRef.current) videoRef.current.srcObject = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const labelMap: Record<string, string> = {
    FRONT: 'Front Scan — 1 of 3',
    SIDE: 'Side Scan — 2 of 3',
    DIAGONAL: 'Diagonal Scan — 3 of 3',
  }
  const labelColor: Record<string, string> = {
    FRONT: 'bg-white/20',
    SIDE: 'bg-blue-500/50',
    DIAGONAL: 'bg-purple-500/50',
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} playsInline muted autoPlay />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-14 pb-4 bg-gradient-to-b from-black/70 to-transparent">
        <span className={`text-xs font-bold text-white uppercase tracking-wider px-3 py-1.5 rounded-full ${labelColor[uiState] ?? 'bg-white/20'}`}>
          {labelMap[uiState] ?? ''}
        </span>
        <button onClick={() => router.back()} className="text-white/70 text-sm bg-white/20 px-3 py-1.5 rounded-full">Cancel</button>
      </div>

      {/* Status */}
      <div className="absolute left-0 right-0 z-20 text-center px-6" style={{ bottom: 130 }}>
        <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold text-white ${statusGood ? 'bg-green-500/85' : 'bg-black/65'}`}>
          {status}
        </span>
      </div>

      {/* Progress */}
      {progress > 0 && (
        <div className="absolute left-5 right-5 z-20" style={{ bottom: 100 }}>
          <p className="text-white/70 text-xs text-center mb-1.5">Hold still — {progress} / {FRAMES_NEEDED} frames</p>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${(progress / FRAMES_NEEDED) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Transition overlay */}
      {transConfig && (
        <div className="absolute inset-0 z-30 bg-black/88 flex flex-col items-center justify-center text-center px-10">
          <div className="text-6xl mb-5">{transConfig.icon}</div>
          <div className="text-xl font-bold text-white mb-2">{transConfig.title}</div>
          <div className="text-sm text-white/70 leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: transConfig.sub }} />
          <div className="w-14 h-14 rounded-full border-2 border-white/30 bg-white/10 flex items-center justify-center text-2xl font-bold text-white">
            {countdown}
          </div>
        </div>
      )}

      {/* Loading */}
      {uiState === 'LOADING' && !error && (
        <div className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center gap-4">
          <div className="w-9 h-9 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/60 text-sm">Starting camera…</p>
        </div>
      )}

      {/* Done */}
      {uiState === 'DONE' && (
        <div className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center gap-3">
          <div className="text-5xl">✅</div>
          <p className="text-white font-bold text-lg">All done!</p>
          <p className="text-white/60 text-sm">Calculating measurements…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center gap-4 px-8 text-center">
          <div className="text-4xl">📷</div>
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-white text-black text-sm font-bold rounded-xl">Try Again</button>
        </div>
      )}
    </div>
  )
}
