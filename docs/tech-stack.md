# FitScan — Tech Stack & Architecture

## Overview

FitScan is a Progressive Web App (PWA) — a single web application that works on mobile (for members) and desktop (for gym owners), accessible from any browser without downloading from an app store. Members open it by scanning a QR code at their gym.

---

## Stack Decisions

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (React) | Single codebase for mobile PWA + desktop dashboard |
| Body Scanning | MediaPipe Pose (JavaScript) | Runs in browser, on-device, no backend for inference |
| Backend | FastAPI (Python) | Fast, async, easy ML integration |
| Database | PostgreSQL | Relational, strong for membership + time-series measurements |
| Auth | OTP via SMS (Twilio / MSG91) | No passwords — phone-first India UX |
| Hosting — Frontend | Vercel | Global CDN, instant Next.js deploys |
| Hosting — Backend | AWS Mumbai (ap-south-1) | Data residency in India (DPDP Act compliance) |
| QR Codes | Server-generated, downloadable PDF | Owner prints A4 poster or mirror sticker |
| Notifications | SMS via Twilio / MSG91 | No push notification permission needed |
| Payments | UPI deeplinks + manual recording | Covers all India payment methods |

---

## PWA vs Native App

**Why PWA, not a native app:**

| Factor | PWA | Native App |
|---|---|---|
| Install friction | Zero — opens in browser | User must visit App Store, tap Install |
| Update cycle | Instant (server-side) | Requires store submission + user update |
| Development cost | One codebase | Two codebases (iOS + Android) |
| Camera access | Yes (via browser API) | Yes |
| Push notifications | Limited on iOS | Full |
| Offline support | Partial (service worker) | Full |

For FitScan's use case — gym members scanning in a well-connected gym — PWA covers 100% of the needed functionality. The zero-friction install is critical for member adoption.

---

## Body Scanning Architecture

### How MediaPipe Pose Works
- Runs entirely in the browser using WebAssembly + WebGL
- No video is sent to the server — all inference is on-device
- Detects 33 body landmarks in real-time from camera feed
- Outputs normalised (x, y, z, visibility) per landmark
- z is relative depth (less reliable from single camera)

### Measurement Extraction

**Direct measurements (reliable from 2D):**
- Shoulder width: distance between left and right shoulder landmarks
- Hip width: distance between left and right hip landmarks
- Height: distance from top of head to heel

**Indirect measurements (require circumference prediction):**
- Chest, waist, biceps, thighs — these are circumferences, not widths
- A 2D camera sees width but not depth
- Solution: ML model trained on (front_width, side_width, height) → predicts circumference

### Pixel-to-cm Calibration
1. User inputs their known height during profile setup
2. MediaPipe measures their pixel height in the frame
3. Calibration ratio = real height (cm) / pixel height
4. All measurements scaled by this ratio
5. Optional enhancement: user enters one tape measurement (e.g. waist) → personal calibration improves accuracy to ±1cm

### Frame Averaging
- 15 frames captured per scan (at 0.5-second intervals)
- Median value used across frames to reduce landmark jitter
- Only frames passing quality check are included

### Two-Scan System
- **Front scan:** shoulders, waist, hips, height, full-body posture
- **Side scan:** depth cues for chest projection, waist depth, posture angle
- Both fed into circumference prediction model

### Accuracy Tiers

| Setup | Accuracy | Notes |
|---|---|---|
| Single front scan only | ±4–5cm | Baseline |
| Front + side scan | ±2–2.5cm | MVP target |
| Front + side + personal calibration | ±1–1.5cm | Enhanced mode |
| Depth sensor kiosk | ±0.5cm | Phase 2 hardware |

±2–3cm is sufficient for gym progress tracking — members care about trend direction, not millimetre precision.

---

## Quality Check System

Before accepting a frame for measurement, the system auto-checks:

| Check | Method | Pass Condition |
|---|---|---|
| Full body visible | All 17 key landmarks present with visibility > 0.7 | Head, both feet, both shoulders detected |
| Distance | Ratio of body height in pixels to frame height | Body occupies 70–90% of frame height |
| Centred | Horizontal midpoint of body vs frame centre | Within 15% of centre |
| Tilt | Angle between left/right shoulder landmarks | <5 degrees tilt |
| Lighting | Average brightness of face region | 40–220 brightness range (not too dark/bright) |

All checks pass → auto-capture triggered. Voice prompt announces: "Perfect — hold still, capturing now."

---

## Database Schema (Simplified)

```
gyms
  id, name, address, owner_phone, plan_type, created_at

trainers
  id, gym_id, name, phone, govt_id, assigned_member_ids[]

members
  id, gym_id, name, phone, height_cm, weight_kg, photo_url
  membership_plan, plan_start, plan_end, created_at

scans
  id, member_id, gym_id, trainer_id (nullable)
  mode (prop/buddy/mirror)
  front_photo_url (deleted after 24h), side_photo_url (deleted after 24h)
  measurements: {shoulders, chest, waist, hips, thighs, biceps, inseam}
  quality_score, landmarks_json
  consent_type (self/trainer), consent_timestamp
  created_at

payments
  id, member_id, gym_id
  amount, gst_amount, total
  plan_type, plan_start, plan_end
  payment_mode (cash/upi/card/bank)
  receipt_number, created_at
```

---

## Auth Flow

```
User enters phone number
→ OTP sent via MSG91/Twilio (6-digit, 10 min expiry)
→ User enters OTP
→ JWT issued (7-day expiry, refreshable)
→ User role determined (owner / trainer / member) from database
→ Redirected to appropriate UI
```

No passwords anywhere in the system.

---

## Consent & Data Retention

| Data Type | Retention | Reason |
|---|---|---|
| Scan photos (front + side) | 24 hours then auto-deleted | DPDP Act compliance + user trust |
| MediaPipe landmarks (JSON) | Indefinite (anonymisable) | Needed for re-analysis |
| Measurements (numbers only) | Indefinite | Core product value |
| Face vector (Phase 2) | User-controlled | Can request deletion at any time |
| Payment records | 7 years | GST compliance |

Photos are stored only in AWS S3 (Mumbai region) with a TTL policy of 24 hours.

---

## QR Code System

Each gym gets a unique QR code that:
- Points to `fitscan.app/gym/[gym_id]`
- Shows the gym's name, logo, and address on landing
- Triggers OTP auth flow for new members
- Directly opens member home for returning members

QR code formats available:
- A4 poster (printable, downloadable PDF)
- Mirror sticker (small format)
- WhatsApp-shareable image

---

## Phase 2 — Kiosk Hardware Stack

| Component | Part | Purpose |
|---|---|---|
| Depth sensor | Intel RealSense D435i | True 3D body measurement (±0.5cm) |
| IR camera | Flir Lepton 3.5 | Fever detection, low-light scanning |
| RGB camera | 4K USB camera | High-res body capture |
| Compute | Intel NUC (i5) | On-device inference |
| Display | 32" touchscreen | User interface |
| Enclosure | Custom steel cabinet | Tamper-resistant, weatherproof |

All inference runs on-device — no body scan data transmitted in real-time. Only measurement numbers and consent metadata sent to cloud.
