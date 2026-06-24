# FitScan

**The only gym management platform in India with integrated body measurement scanning.**

> "The only gym management app where members can track their body transformation"

---

## What is FitScan?

FitScan is a gym management SaaS platform with a built-in body scanning engine. Members scan their body using just their phone camera — no downloads, no hardware — and track measurements like chest, waist, biceps, and hips over time. Gym owners get a full management dashboard: members, payments, invoices, analytics, and trainer management.

The long-term play is data: FitScan builds India's first large-scale, consented, real-world body measurement dataset — which becomes the infrastructure layer for fashion personalisation at scale.

---

## Repository Structure

```
fitscan/
├── README.md                        ← You are here
│
├── docs/
│   ├── stage1-poc.md                ← Stage 1 build plan: scan PoC, testing protocol
│   ├── product-spec.md              ← Stage 2 full MVP spec (all personas, all flows)
│   ├── market-analysis.md           ← India market research & competitor landscape
│   ├── business-strategy.md         ← Business model, data play, phased roadmap
│   ├── tech-stack.md                ← Technology decisions & architecture
│   └── scanning-accuracy.md         ← How body scanning works & accuracy tiers
│
├── wireframes/
│   ├── wireframes-mobile.html       ← All member-facing mobile screens (open in browser)
│   └── wireframes-dashboard.html    ← Gym owner & trainer web dashboard screens
│
└── design-assets/
    └── setup-sketch.html            ← Physical setup diagram (MediaPipe + phone prop)
```

---

## The Problem

- 300,000+ registered gyms in India
- Less than 10% use any software — the rest run on WhatsApp, registers, Excel
- **Zero** gym management apps in India have body scanning
- Members have no objective way to track body transformation over time
- Fashion/apparel sizing in India is entirely manual tape-measure based

---

## The Solution — Two Phases

### Phase 1 — Gym SaaS MVP (now)
- Web app (PWA — no download required, opens via QR code in phone browser)
- Body scanning via phone camera using MediaPipe Pose
- Front + side scan → ML predicts circumferences (chest, waist, biceps, hips)
- Full gym management: members, payments, invoices, trainer management
- Accuracy: ±2–3cm (sufficient for gym progress tracking)

### Phase 2 — Kiosk Network (after gym validation)
- Depth sensor kiosk (Intel RealSense D435i + IR camera) at mall/gym entrances
- Multi-use: body scan + fever screening + footfall counting + dwell time analytics
- Accuracy: ±0.5cm
- Cost per unit: ~₹1,00,000 deployed
- Mall pays for analytics; FitScan retains the body measurement data

**The kiosk is the moat. The app is the proof of concept.**

---

## Three User Personas

| Persona | Access | Key Actions |
|---|---|---|
| **Gym Owner** | Web dashboard (desktop) | Setup gym, manage members/trainers, payments, analytics |
| **Gym Trainer** | Web dashboard (trainer login) | View assigned members, initiate scans, share results |
| **Gym Member** | Mobile PWA via QR link | Scan body, track progress, download invoice |

---

## Scan Modes

| Mode | How | Accuracy | Best For |
|---|---|---|---|
| **Prop** (★ Recommended) | Phone propped against wall/books | ±1.5–2cm | Solo use, most consistent |
| **Buddy** | Friend holds phone | ±2–2.5cm | Best accuracy with help |
| **Mirror** | Front camera facing full-length mirror | ±3–4cm | Backup only |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (React) — PWA |
| Body Scanning | MediaPipe Pose (JavaScript, runs in browser) |
| Backend | FastAPI (Python) |
| Database | PostgreSQL |
| Auth | OTP via SMS (Twilio / MSG91) |
| Hosting | Vercel (frontend) + AWS Mumbai (backend) |
| Payments | UPI deeplinks + manual recording |

---

## Wireframes

Open the HTML files directly in any browser — no build step needed.

- **[wireframes/wireframes-mobile.html](wireframes/wireframes-mobile.html)** — 22 screens covering member onboarding, consent, scan modes, live AR scan, results, progress tracking, notifications
- **[wireframes/wireframes-dashboard.html](wireframes/wireframes-dashboard.html)** — 10 screens covering owner setup wizard, dashboard, member management, payments, analytics, trainer management, QR generator

---

## Key Metrics to Validate (Before Kiosk Investment)

- [ ] 10 consented body profiles → proves the scanning tech works
- [ ] 1 gym owner pays anything → proves willingness to pay
- [ ] 1 fashion brand signs LOI for data access → proves data has commercial value

---

## Competitive Moat

| Layer | Moat |
|---|---|
| App alone | None — Myntra can clone in 6 weeks |
| Gym SaaS + scanning | Moderate — differentiated but copyable |
| Physical kiosk network | Strong — cannot be un-installed |
| Consented body profile dataset | Strongest — compounding, 7-year head start possible |
| Fashion identity API | Platform moat — infrastructure others build on top of |

---

## Build Stages

### Stage 1 — Scan PoC (current)
Validate scan accuracy before building the product.

- [x] Market research & competitor analysis
- [x] Product spec (all 3 personas, all flows)
- [x] Mobile wireframes (22 screens)
- [x] Dashboard wireframes (10 screens)
- [ ] Scan PoC (MediaPipe + calibration + quality checks + voice prompts)
- [ ] Test on 10 real bodies — target ≥7/10 within ±2cm on chest and waist
- [ ] **Gate: pass accuracy target → move to Stage 2**

### Stage 2 — Full Product (after Stage 1 passes)
- [ ] Next.js PWA + FastAPI backend + PostgreSQL
- [ ] Gym owner dashboard (10 screens)
- [ ] Member mobile flow (22 screens)
- [ ] Trainer flow + consent system
- [ ] OTP auth + payments + invoices
- [ ] Beta with 3 gyms
- [ ] First paying customer
