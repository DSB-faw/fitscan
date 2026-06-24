# FitScan — Scanning Accuracy

## The Core Problem: 3D Measurements from a 2D Camera

Body measurements like chest, waist, and biceps are circumferences — they wrap around the body in three dimensions. A standard phone camera captures only a 2D projection (width and height in the image). It cannot directly see depth.

FitScan solves this through a combination of:
1. Front + side dual-scan (captures two perpendicular views)
2. ML circumference prediction model (trained on width pairs → real circumferences)
3. Height-based pixel calibration (converts pixels to centimetres)

---

## How Pixel-to-cm Calibration Works

1. User enters their known height during profile setup (e.g. 175 cm)
2. MediaPipe measures their pixel height in the scan frame
3. Calibration ratio = 175 cm ÷ pixel_height
4. Every pixel measurement in the scan is multiplied by this ratio
5. Result: real-world centimetre values

**Optional personal calibration:** The user can enter one known tape measurement (e.g. "My waist is 82cm"). This creates a person-specific correction factor that improves accuracy to ±1cm.

---

## The Dual-Scan System

### Front Scan
Captures:
- Shoulder width (left shoulder to right shoulder landmark)
- Hip width (left hip to right hip landmark)
- Waist width (estimated from midpoint between shoulder and hip)
- Full body height
- Arm position and spread

### Side Scan
Captures:
- Chest projection depth (how far the chest extends forward)
- Waist depth (how far the abdomen extends)
- Posture angle
- Inseam estimation

### Circumference Prediction
The ML model takes `(front_width, side_width, height)` as inputs and predicts the full circumference. This is possible because:
- For most body shapes, knowing the frontal width and lateral depth gives a strong approximation of the elliptical cross-section
- The model is trained on thousands of real body measurements with known circumferences

---

## Accuracy Tiers

| Tier | Setup | Accuracy | When to Use |
|---|---|---|---|
| 1 | Single front scan, no calibration | ±4–5cm | Quick first scan only |
| 2 | Front + side scan (MVP default) | ±2–2.5cm | Standard gym tracking |
| 3 | Front + side + personal calibration | ±1–1.5cm | Members who want precision |
| 4 | Depth sensor kiosk (Phase 2) | ±0.5cm | Professional/clinical use |

**For gym progress tracking, Tier 2 is sufficient.** A member measuring their waist reduction over 3 months does not need sub-centimetre precision — they need consistent, comparable measurements over time. FitScan's scan conditions (same mode, same distance, same lighting check) ensure consistency session to session.

---

## Scan Mode Impact on Accuracy

| Mode | Why It Affects Accuracy |
|---|---|
| **Prop** (±1.5–2cm) | Phone is fixed to a stable surface. Same position every scan. Removes human-held camera shake and height variation. |
| **Buddy** (±2–2.5cm) | A person holds the phone. If they follow the guide (correct height, distance, no tilt), accuracy approaches Prop. Human variation adds ~0.5cm error. |
| **Mirror** (±3–4cm) | Front camera (lower quality than rear). Reflection introduces additional image degradation. Distance is harder to control. Phone angle harder to maintain. |

**Recommendation logic in the app:**
- Prop is shown first with ★ Recommended badge
- Buddy is shown second with ✓ Good badge
- Mirror is shown third with ⚠ Backup badge

---

## Frame Quality Auto-Check

Before any frame is included in the measurement average:

| Check | Pass Condition | Failure Action |
|---|---|---|
| Full body visible | All 17 key landmarks at >70% confidence | Voice prompt: "Step back — full body not visible" |
| Distance | Body height = 70–90% of frame height | Voice prompt: "Move back a little" or "Step forward" |
| Centred | Body centre within 15% of frame centre | Voice prompt: "Move a little to your left/right" |
| Tilt | Shoulder angle <5 degrees | Voice prompt: "Stand straight, keep shoulders level" |
| Lighting | Face brightness 40–220 range | Visual warning: "Too dark" or "Avoid direct backlight" |

All 5 checks passing simultaneously triggers auto-capture. No button press needed.

---

## Frame Averaging

- 15 frames captured over ~7.5 seconds once quality checks pass
- Median value taken for each landmark position (not mean — median is more robust to outliers)
- Any frame where a check drops below threshold during capture is discarded
- If fewer than 10 valid frames are captured, the scan is flagged for retake

---

## Known Limitations

| Limitation | Impact | Workaround |
|---|---|---|
| Loose clothing | ±1–2cm additional error on waist/chest | App instructs: wear fitted clothing |
| Hair pulled up vs down | ±1–2cm on height | App instructs: consistent hairstyle |
| Shoes | ±2–3cm on height, affects calibration | App instructs: scan barefoot or same footwear always |
| Very dark skin in poor lighting | Landmark detection drops | Quality check catches this → prompts better lighting |
| Extreme body fat percentage | ML model less accurate at >40% BF | Accuracy disclosure shown; manual calibration recommended |

---

## Scan Quality Score (Shown on Results Screen)

After a completed scan, the results screen shows a quality indicator:

```
Scan Quality: ●●●●○  Good

Tips for next scan:
• Wear fitted clothing (not loose) for tighter measurements
• Arms at 30° from body — not pressed against sides
• Ensure even lighting from the front
```

Score is based on:
- Average landmark confidence across captured frames
- Consistency of measurements across the 15 frames (low std deviation = high score)
- Number of frames that passed quality check vs discarded

---

## Phase 2: Depth Sensor Accuracy

With the Intel RealSense D435i:
- True 3D point cloud of the body surface
- Direct circumference measurement (no ML prediction needed)
- Accuracy: ±0.5cm (comparable to professional body tape at ±0.3cm)
- Works regardless of clothing (depth sees surface contour)
- Works in varied lighting (uses IR structured light, not visible light)

This is why the kiosk is the long-term product — it removes all the approximation inherent in single-camera scanning.
