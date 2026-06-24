# FitScan — Business Strategy

## The Core Thesis

FitScan is not a gym app. It is India's body measurement data infrastructure business, starting in gyms.

The app generates consented, real-world body measurement data at scale. That data — anonymised, city-segmented, demographic-tagged — becomes the most valuable body dataset in India's fashion, health, and retail sectors.

**Modelled on Google/Android:**
- Give the product cheap or subsidised (gyms get it below market)
- Build the network effect (more gyms → more bodies → richer dataset)
- Monetise the data layer (fashion brands, health companies, sportswear, government)
- Own the infrastructure others depend on

---

## Revenue Streams

### Stream 1 — Gym SaaS Subscription (immediate)
- ₹999–₹1,999/month per gym
- Includes: member management, payments, invoices, trainer management, body scanning
- Target: 3,000 gyms = ₹3–6 crore MRR
- GymForce proved gyms pay ₹250/month for basic software — FitScan justifies 4–8x for scanning

### Stream 2 — Kiosk Placement (Phase 2)
- Hardware: ~₹1,00,000 per unit deployed
- Revenue: ₹15,000–25,000/month SaaS fee per mall location (analytics dashboard)
- Offer: subsidise hardware to get placement, recover cost in 4–6 months
- FitScan retains all body data generated — contractual clause in every agreement

### Stream 3 — Body Data Licensing (Phase 2+)
- B2B API: fashion brands pay per lookup (personalised sizing)
- Dataset licensing: bulk anonymised data to health research, sportswear brands, government
- Price: ₹500+/consented profile at scale
- 10,00,000 profiles = ₹500 crore asset value

### Stream 4 — Fashion Identity API (Phase 3)
- Consented face vector + body measurements per user
- Enables: return visitor recognition across kiosk locations
- Enables: personalised fashion recommendations ("This brand's L fits your measurements")
- Becomes infrastructure layer the fashion industry depends on

---

## Phased Roadmap

### Phase 1 — Gym SaaS MVP (now — 3–6 months)
**Goal:** Prove the concept. Get first paying gym.

- Build PWA (Next.js + FastAPI + MediaPipe)
- Deploy to 3 beta gyms (free or ₹1 trial)
- Collect 100+ consented body scans
- Measure: Does accuracy satisfy gym owners? Do members share progress?
- Target: 1 paying gym, 10 consented profiles, 1 fashion brand interest

**Investment:** ₹3–8 lakhs (2-person dev team + infra)

### Phase 2 — Kiosk Network (6–18 months after validation)
**Goal:** Physical presence in 5 malls, 50 gyms.

- Build first kiosk prototype (depth sensor + IR camera + display)
- Negotiate placement in 2–3 malls in Delhi NCR
- Generate 10,000+ consented profiles
- Approach first fashion brand for data partnership

**Investment:** ₹50–100 lakhs (5 kiosks + deployment + team)

### Phase 3 — Data Platform (18 months+)
**Goal:** Fashion identity API. Series A.

- 1,00,000+ consented profiles
- API for fashion brands (sizing, recommendations)
- Expand to 10 cities
- Government data partnerships (health research, sizing standards)

---

## Two-Phase Hardware Strategy

### Current: Software Only
- MediaPipe Pose on phone camera
- Front + side scan → ML circumference prediction
- Accuracy: ±2–3cm
- Cost to deploy: ₹0 (runs on member's existing phone)

### Future: Kiosk
- Intel RealSense D435i depth sensor
- IR camera (low-light, fever detection)
- High-res RGB camera
- Touchscreen display
- Accuracy: ±0.5cm
- Multi-use: body scan + fever screening + footfall analytics + dwell time

**The kiosk is the moat. The app is the proof of concept.**

Once a kiosk is installed at a mall entrance, it cannot be un-installed without disrupting the mall's analytics. That is structural lock-in.

---

## Data Strategy

### What FitScan Collects (with consent)
- Body measurements (chest, waist, hips, thighs, biceps, shoulders, inseam)
- Measurement change over time (longitudinal data — most valuable)
- Optional: face vector (mathematical representation, not photo)
- Age range, gender (self-reported)
- City, gym type (inferred from gym data)

### What FitScan Does NOT Collect
- Photos stored beyond 24 hours
- Raw face images (vector only — cannot be reverse-engineered)
- Financial data
- Location tracking

### Legal Framework
- DPDP Act 2023 (India) compliant
- Explicit consent at every step — cannot be skipped
- Three separate databases: Identity / Measurements / Analytics — never joined externally
- Deletion rights exercisable at any time

### Data Value
India has no large-scale, consented, real-world body measurement dataset. The closest is government survey data (outdated) and brand-specific try-on data (siloed). FitScan's dataset will be:
- Longitudinal (same bodies measured repeatedly over months/years)
- Demographically diverse (gym-going India across cities and income levels)
- Consented (legally usable for commercial purposes)
- City-segmented (Delhi vs Mumbai vs Bengaluru body shape differences)

---

## Why Gyms First

1. **Repeat usage built-in** — members scan every 2–4 weeks naturally
2. **Clear pain point** — "Show me my transformation" is a real gym need
3. **Gym owner incentive** — retention tool ("members who track measurements stay 2x longer")
4. **Viral potential** — "I lost 2 inches" gets shared on Instagram
5. **±3cm is sufficient** — members care about direction and trend, not millimetre precision
6. **Low acquisition cost** — sell to gym owner, they bring 200 members

---

## Why Not Mobile App First

The mobile app idea can be copied by any fashion brand in 6 weeks:
- Myntra has 50M users and a development team
- Nykaa Fashion could replicate it
- H&M, Zara have global tech teams

The gym SaaS + kiosk network + data asset cannot be copied quickly. You need:
- Gym relationships (takes time)
- Physical kiosk placements (takes time + capital)
- Consented data at scale (takes time + trust)

None of those can be bought quickly even with unlimited capital.

---

## Key Strategic Decisions

| Decision | Choice | Reason |
|---|---|---|
| App vs Kiosk | Kiosk is moat, app is distribution | App copyable in 6 weeks |
| Data ownership | Company retains anonymised scan data | Contractual clause in every agreement |
| Photo storage | 24 hours then deleted | DPDP compliance + user trust |
| Face storage | Math vector only (not photo) | Breach-resilient, legally safer |
| Starting segment | Gyms first | Repeat usage, clear pain, viral sharing |
| MVP format | Web app (PWA) | No download friction |
| Language | English only for MVP | Simplicity |
| Consent model | Explicit, cannot be skipped | Legal + trust |
| Pricing strategy | Below GymForce initially | Land and expand — data is the product |
