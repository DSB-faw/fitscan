# FitScan — Stage 1: Scan Proof of Concept

## Goal

Validate that a phone camera + MediaPipe Pose can deliver ±2cm accuracy on real body measurements before investing in building the full product.

**Success criteria:**
- 10 real body scans completed on different body types
- Measurements (chest, waist, hips, shoulders) within ±2cm of tape measure on at least 7 of 10 bodies
- Scan completion time under 3 minutes per person
- Works on mid-range Android (not just flagship phones)

---

## What Gets Built

A single standalone web page. No backend, no auth, no database. Opens in a phone browser.

```
scan-poc/
├── index.html          ← Entry point, height input, launch scan
├── scan.html           ← Live camera + MediaPipe scan engine
├── results.html        ← Measurement output + accuracy check
└── js/
    ├── mediapipe.js    ← MediaPipe Pose setup and landmark extraction
    ├── calibration.js  ← Pixel-to-cm conversion using known height
    ├── measurements.js ← Landmark math → width/height measurements
    ├── circumference.js← Width pairs → circumference prediction (ML or formula)
    ├── quality.js      ← Frame quality checks (distance, visibility, tilt, lighting)
    └── voice.js        ← Text-to-speech prompts
```

No npm, no build step. Pure HTML + vanilla JS. Opens directly in any browser.

---

## User Flow (PoC — Buddy Mode)

```
Open index.html on phone browser
→ Enter subject's height (cm) — used for pixel calibration
→ Pre-scan checklist shown (background, lighting, clothing, footwear)
→ "Show buddy instructions" card — hand phone to buddy to read
→ "Start Front Scan" button
→ Buddy holds phone, points at subject
→ Live camera view with AR guide frame + real-time quality checks
→ Voice prompts guide buddy (distance, height, tilt, lighting)
→ All 5 checks pass → auto-captures 15 frames
→ Voice: "Front scan done. Subject turn to your right. Buddy stay in same spot."
→ Side scan — same quality check + auto-capture process
→ Processing screen (landmark extraction + circumference prediction)
→ Results screen — 8 measurements displayed
→ "Compare with tape" section — enter real tape measurements
→ Accuracy delta shown per measurement (e.g. Waist: scan 82cm, tape 83cm → ±1cm ✓)
```

---

## Measurements to Validate

| Measurement | How Extracted | Validation Method |
|---|---|---|
| Shoulder width | Left to right shoulder landmark, front scan | Tape across shoulders |
| Chest circumference | Front width + side depth → prediction | Tape around chest |
| Waist circumference | Front width + side depth → prediction | Tape around waist |
| Hip circumference | Front width + side depth → prediction | Tape around hips |
| Bicep circumference | Arm width at mid-upper-arm | Tape around bicep |
| Thigh circumference | Thigh width at mid-thigh | Tape around thigh |
| Inseam | Hip to ankle landmark distance | Tape inseam |
| Height | Head to heel landmark distance | Actual height |

---

## Quality Check System

All 5 checks must pass before a frame is accepted:

| Check | Pass Condition | Voice Prompt on Fail |
|---|---|---|
| Full body visible | 17 key landmarks at >70% confidence | "Step back, full body not visible" |
| Distance | Body height = 70–90% of frame height | "Move back a little" / "Step forward" |
| Centred | Body centre within 15% of frame centre | "Move a little to your left / right" |
| Tilt | Shoulder angle <5 degrees | "Stand straight, shoulders level" |
| Lighting | Face region brightness 40–220 | "Too dark" / "Avoid backlight" |

Auto-capture fires when all 5 pass simultaneously for 3 consecutive frames.

---

## Circumference Prediction Approach

Since the camera is 2D, circumferences cannot be measured directly. Two approaches — start with the formula, move to ML if accuracy is insufficient:

### Approach A — Ellipse Formula (start here)
Treat each body cross-section as an ellipse:
```
circumference ≈ π × √(2 × (a² + b²) / 2)
where:
  a = front_width / 2  (semi-major axis from front scan)
  b = side_width / 2   (semi-minor axis from side scan)
```
No training data needed. Quick to implement. Accuracy: ±2–4cm.

### Approach B — Regression Model (if A is insufficient)
Train a simple linear regression on:
- Input: (front_width_px, side_width_px, height_cm, bmi_estimate)
- Output: circumference_cm
- Training data: 50–100 manual measurements (front width + tape circumference pairs)
- Can be done in a spreadsheet first, then hardcoded as coefficients

### Decision Rule
If Approach A gets within ±3cm on 7/10 bodies → ship Stage 1, move to Stage 2.
If not → collect 50 measurements, train regression, re-test.

---

## Voice Prompts (Full List)

All via browser Text-to-Speech API (no external service needed):

| Trigger | Message |
|---|---|
| Scan starts | "Stand 6 to 8 feet from the phone. Arms slightly away from your body." |
| Body not fully visible | "Step back a little. I need to see your full body." |
| Too close | "You're too close. Take two steps back." |
| Too far | "Step a little closer." |
| Off centre | "Move to your left." / "Move to your right." |
| Tilted | "Stand straight. Keep your shoulders level." |
| Poor lighting | "The lighting is too dark. Step towards the light." |
| All checks pass | "Perfect. Hold still." |
| Capturing | "Capturing now. Don't move." |
| Front scan done | "Front scan complete. Now turn to your right for the side scan." |
| Side scan done | "Side scan complete. Processing your measurements." |
| Done | "Done. Here are your measurements." |

---

## Scan Mode for Stage 1 — Buddy Mode

Stage 1 uses **Buddy mode only**. Chosen over Prop for accuracy testing because the buddy can dynamically adjust position in real-time based on quality check feedback — distance, height, and tilt can all be corrected live before auto-capture fires.

Prop and Mirror modes are added in Stage 2.

### Why Buddy Over Prop for Stage 1

| Factor | Prop | Buddy |
|---|---|---|
| Can adjust distance dynamically | No — fixed position | Yes — buddy steps forward/back |
| Can adjust height dynamically | No | Yes — buddy raises/lowers phone |
| Responds to quality check feedback | No | Yes — buddy sees screen + hears prompts |
| Scan-to-scan consistency | Better | Slightly worse |
| Best for accuracy testing (single scan) | Good | Better |

For Stage 1 we are testing absolute accuracy against a tape measure (single scan). Consistency across sessions matters more in Stage 2.

### Buddy Instructions Screen (shown before scan starts)

A full-screen card is shown to hand to the buddy:

```
BUDDY INSTRUCTIONS — show this to the person holding the phone

📏 Distance     Stand so their full body fills the green frame. ~6–8 feet.
📐 Height       Hold phone at their shoulder height. Not higher, not lower.
📱 Keep steady  Both hands. Phone vertical. Don't tilt.
👁 Watch screen Green = good. Orange = adjust. Wait for auto-capture.
🔁 Same spot    For the side scan, stay in the exact same spot — just rotate.
```

### Voice Prompts — Buddy-Aware Versions

In Buddy mode, voice prompts address the **buddy** (holding the phone), not the subject:

| Trigger | Message |
|---|---|
| Scan starts | "Buddy — hold the phone at their shoulder height, about 6 to 8 feet away." |
| Body not fully visible | "Buddy — step back a little. Full body not visible." |
| Too close | "Buddy — you're too close. Take two steps back." |
| Too far | "Buddy — step a little closer." |
| Off centre | "Buddy — move a little to your left." / "…to your right." |
| Tilted | "Subject — stand straight. Keep shoulders level." |
| Poor lighting | "Too dark. Move so the light is in front of the subject." |
| All checks pass | "Perfect. Hold very still." |
| Capturing | "Capturing now. Nobody move." |
| Front done | "Front scan done. Subject — turn to your right. Buddy — stay in the same spot." |
| Side done | "Side scan complete. Processing measurements." |
| Done | "Done. Here are the measurements." |

### Pre-scan Setup Checklist (shown on index screen)

- Plain wall or background behind the subject
- Light source facing the subject (not behind them)
- Subject wears fitted clothing — not loose or baggy
- Subject scans barefoot (or same footwear every time — shoes add ~2cm)
- Buddy holds phone with both hands, portrait orientation, rear camera

---

## Testing Protocol

To validate accuracy, test on 10 people with varied body types:

**Before each test scan:**
1. Take real tape measurements (chest, waist, hips, shoulders, biceps, thigh, inseam)
2. Record in the comparison sheet

**Run the scan:**
1. Enter their height
2. Complete front + side scan
3. Note any quality check failures or retakes

**After scan:**
1. Enter tape measurements into the "Compare with tape" fields on results screen
2. Record deltas
3. Note body type, clothing worn, lighting conditions

**Target:** ≥7 of 10 bodies within ±2cm on waist and chest (primary measurements).

---

## What Stage 1 Does NOT Include

- No user accounts or login
- No data storage (measurements disappear on page refresh)
- No gym management
- No invoices or payments
- No progress tracking
- No trainer flow
- No backend or database
- No Buddy or Mirror scan modes
- No deployment (runs locally or on a simple static host like GitHub Pages)

---

## Definition of Done — Stage 1

- [ ] Scan PoC runs in Chrome on Android (mid-range phone)
- [ ] Front + side scan completes without crashing
- [ ] Voice prompts work throughout the scan
- [ ] Quality check catches bad frames (tested: too dark, too close, off-centre)
- [ ] 8 measurements output on results screen
- [ ] "Compare with tape" fields show accuracy delta
- [ ] Tested on 10 real bodies
- [ ] ≥7/10 within ±2cm on chest and waist
- [ ] Average scan time under 3 minutes

**If all boxes checked → move to Stage 2.**

---

## Stage 1 Timeline Estimate

| Task | Estimate |
|---|---|
| MediaPipe Pose setup + landmark extraction | 1 day |
| Pixel-to-cm calibration | 0.5 day |
| Quality check system | 1 day |
| Voice prompts | 0.5 day |
| Front + side scan capture + frame averaging | 1 day |
| Circumference prediction (ellipse formula) | 0.5 day |
| Results screen + tape comparison fields | 0.5 day |
| Testing on 10 bodies + iteration | 2–3 days |
| **Total** | **7–9 days** |
