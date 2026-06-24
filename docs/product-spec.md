# FitScan — Product Specification (MVP)

## MVP Structure — Two Stages

The MVP is split into two stages to de-risk the core technology before building the full product.

| Stage | What | Goal | Timeline |
|---|---|---|---|
| **Stage 1 — Scan PoC** | Standalone scan page, no backend | Validate ±2cm accuracy on real bodies | 7–9 days |
| **Stage 2 — Full Product** | PWA + backend + all 3 personas | Shippable gym management product | 6–10 weeks |

Stage 2 only begins once Stage 1 passes: ≥7 of 10 real body scans within ±2cm on chest and waist.

See [`stage1-poc.md`](stage1-poc.md) for the complete Stage 1 build plan and testing protocol.

---

## Overview (Stage 2)

FitScan Stage 2 is a web-based gym management platform with integrated body scanning. It is built as a Progressive Web App (PWA) — no app download required. Members access it by scanning a QR code placed in their gym.

---

## Three Personas

### 1. Gym Owner
- Accesses via web dashboard on desktop
- Creates and manages the gym account
- Adds members and trainers
- Manages membership plans and payments
- Views analytics and body progress data across the gym

### 2. Gym Trainer
- Accesses via web dashboard (separate trainer login)
- Created by the gym owner (name + phone + govt ID)
- Can only see members assigned to them
- Can initiate body scans for members (with consent)
- Can share scan results with the member's consent

### 3. Gym Member
- Accesses via mobile PWA — QR code at gym entrance
- No app download required
- Receives SMS on registration with their profile link
- Scans their own body, tracks progress, views invoices

---

## Member Onboarding Flow

```
Scan gym QR code
→ QR Landing Screen (gym logo, name, address)
→ Enter phone number → OTP verification
→ Profile setup (name, height, optional weight, optional photo)
→ Member Home (plan status, scan / progress / invoice / settings)
```

---

## Scan Flow — Self-Initiated

```
Member Home → "Scan Body"
→ Mode Selection (Prop / Buddy / Mirror — with accuracy labels)
→ Mode-specific alignment guide
→ Consent popup (mandatory — what's measured, stored, deletion rights)
→ Live scan screen (AR overlay + voice prompts)
→ Front scan captured → "Turn to your right"
→ Side scan captured
→ Processing (10 sec — MediaPipe + ML circumference prediction)
→ Results screen (8 measurements + delta vs last scan + quality score)
→ [Retake] [Discard] [Save] [Share / Download]
```

Voice prompts are essential — the member cannot see the screen when the phone is propped.

---

## Scan Flow — Trainer-Initiated

```
Trainer → Member profile → "Initiate Scan"
→ Consent SMS sent to member's phone (expires in 10 min)
→ Member opens link → Consent screen → [Give Consent] [Decline]
→ On consent: trainer's screen unlocks scan controls
→ Trainer holds phone, points at member
→ Same scan flow as self-initiated
→ Results visible to trainer + member
→ Trainer share: separate consent SMS required from member
```

---

## Scan Modes

| Mode | Setup | Accuracy | Notes |
|---|---|---|---|
| Prop (★ Recommended) | Phone leaned against wall/books at chest height | ±1.5–2cm | Most consistent across sessions |
| Buddy | Friend holds phone at member's shoulder height | ±2–2.5cm | Best human-assisted accuracy |
| Mirror | Member holds phone facing full-length mirror | ±3–4cm | Backup only — least reliable |

---

## Measurements Captured

All scans produce:
- Shoulder width
- Chest circumference
- Waist circumference
- Hip circumference
- Thigh circumference
- Bicep circumference
- Inseam (estimated)
- Height (from profile)
- Weight (optional, entered manually)
- BMI (calculated)

---

## Scan Quality Scoring

Before accepting a frame, the system auto-checks:
- Full body visible in frame
- Correct distance (6–8 ft)
- Person centred
- Lighting adequate

Quality score shown on results screen (●●●●○ format) with improvement tips.

Auto-capture triggers only when all checks pass — user is guided by voice until alignment is correct.

---

## Consent Architecture

### Self-Scan Consent
- Popup shown before every scan (cannot be skipped)
- States: what is being measured, how long photos are stored (24h then deleted), deletion rights

### Trainer-Initiated Consent
- SMS link sent to member's phone
- Expires in 10 minutes
- Member explicitly taps [Give Consent] — no passive opt-in

### Share Consent (Trainer)
- Trainer sharing scan results requires a separate consent SMS to member
- Member must explicitly approve before trainer can share externally

---

## Share Options (Member chooses freely; trainer needs consent)

1. Measurements card only (numbers + gym branding)
2. Silhouette outline + measurements (no face)
3. Full photo with face (extra consent layer)
4. Download to phone (server copy deleted in 24 hours)

---

## Progress Tracking — 3 Views

1. **List view** — all past scans with dates and measurement numbers
2. **Graph view** — per-measurement trend line over time
3. **Before vs Now** — side-by-side first scan vs latest scan

---

## Membership Plans

Owner sets plan types and prices per gym:
- Monthly
- Quarterly (3 months)
- 6 Months
- Annual

---

## Payment Flow

- Owner records payments manually: Cash / UPI / Card / Bank Transfer
- UPI deeplink generated for member to pay digitally
- Automatic SMS reminders: 7 days before expiry + on due date
- Plan expiry: scan access paused, history remains visible

---

## Invoice Contents

Gym name, member name, plan type, amount, GST (18%), payment date, payment mode, next due date, gym address, receipt number.

---

## Notifications (All via SMS)

- Payment reminder: 7 days before expiry + on due date
- Scan reminder: if no scan in 3 weeks
- Progress celebration: milestone achievements (e.g. "You've lost 2 inches!")

---

## Gym Owner Dashboard — 10 Screens

| Screen | Purpose |
|---|---|
| D1 — Setup Wizard | 4-step onboarding: gym details → trainers → members → QR code |
| D2 — Main Dashboard | Stats overview, alerts, recent scans, revenue chart |
| D3 — Member List | Search, filter by plan / status / last scan date |
| D4 — Add Member | New member registration form |
| D5 — Member Detail | Full profile: plan, payments, latest measurements |
| D6 — Payments | Renewals due, overdue, mark as paid |
| D7 — Analytics | Progress distribution, avg measurement changes across gym |
| D8 — Trainer Management | Add/remove trainers, assign members |
| D9 — QR Code Generator | Download A4 poster, mirror sticker, WhatsApp share |
| D10 — Trainer View | Trainer's interface: assigned members, initiate scan |

---

## Member Mobile App — 22 Screens

| Screen | Purpose |
|---|---|
| 01 — QR Landing | Gym logo, name, address — entry point |
| 02 — OTP Verification | Phone number + OTP auth |
| 03 — Profile Setup | Name, height, weight, photo |
| 04 — Member Home | Plan card, scan / progress / invoice / settings |
| 05 — Invoice | Receipt with full payment details |
| 06 — Self Consent | Mandatory consent popup before scan |
| 07 — Trainer Consent | SMS link received by member — give or decline |
| 08 — Share Consent | Trainer requests permission to share results |
| NEW A — Mode Selection | Choose: Prop / Buddy / Mirror with accuracy labels |
| NEW B — Prop Mode Guide | Placement diagram, checklist, step indicator |
| NEW C — Buddy Mode Guide | Instructions for the buddy holding the phone |
| NEW D — Mirror Mode Guide | Top-view diagram, accuracy warning, 3 steps |
| NEW E — Live Alignment Feedback | Real-time AR guide frame + voice prompt + checklist |
| 09 — Placement Guide | General pre-scan setup guide |
| 10 — Live Scan | AR overlay, real-time skeleton, auto-capture |
| 11 — Processing | 10-second progress animation |
| 12 — Scan Results | 8 measurements + deltas + quality score |
| 13 — Share Options | Choose what to share and how |
| 14 — Progress Overview | List of all past scans |
| 15 — Progress Graph | Per-measurement trend line |
| 16 — Before vs Now | Side-by-side first vs latest |
| 17 — Notifications | SMS alert history and settings |

---

## Non-Goals for MVP

- Native iOS/Android app (PWA only)
- Multi-language support (English only)
- Automated payment collection (manual recording only)
- Kiosk / depth sensor hardware
- Face vector storage / identity recognition
- Fashion brand API
