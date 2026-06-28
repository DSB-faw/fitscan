// measurements.js — Landmark math → body measurements (front + diagonal + side scan)
const Measurements = (() => {

  // Ramanujan's second approximation for ellipse perimeter — most accurate simple formula
  function ellipsePerimeter(a, b) {
    if (a <= 0 || b <= 0) return 0;
    const h = Math.pow(a - b, 2) / Math.pow(a + b, 2);
    return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
  }

  // Reduce 15 frames to single representative set of landmarks using median per landmark
  function medianLandmarks(frames) {
    if (!frames || frames.length === 0) return null;
    const n = frames[0].length;
    return Array.from({ length: n }, (_, i) => {
      const xs  = frames.map(f => f[i].x).sort((a, b) => a - b);
      const ys  = frames.map(f => f[i].y).sort((a, b) => a - b);
      const zs  = frames.map(f => f[i].z).sort((a, b) => a - b);
      const mid = Math.floor(frames.length / 2);
      return { x: xs[mid], y: ys[mid], z: zs[mid], visibility: frames[0][i].visibility };
    });
  }

  // Given front half-width a, side half-depth b, and observed 45° width D,
  // return improved [a_best, b_best] using 3-view over-determined fit.
  // At 45°, ellipse projects to: D = √2 · √(a² + b²)
  // → b_from_diag = √(D²/2 − a²),  a_from_diag = √(D²/2 − b²)
  function improvedAxes(F, S, D) {
    const a0 = F / 2, b0 = S / 2;
    const half2 = (D * D) / 2;
    const b_d = Math.sqrt(Math.max(0, half2 - a0 * a0));
    const a_d = Math.sqrt(Math.max(0, half2 - b0 * b0));
    return [(a0 + a_d) / 2, (b0 + b_d) / 2];
  }

  function compute(frontLm, diagLm, sideLm, heightCm, imgW, imgH) {
    // ── CALIBRATION ─────────────────────────────────────────────────────────
    // Use nose(0) → average ankles(27,28) as our pixel ruler.
    // Real-world nose-to-ankle ≈ height − 12 cm (top of head to nose is ~12 cm).
    const noseY        = frontLm[0].y;
    const ankleY       = Math.max(frontLm[27].y, frontLm[28].y);
    const pxNoseAnkle  = (ankleY - noseY) * imgH;
    const realN2A      = heightCm - 12;
    const ratio        = realN2A / pxNoseAnkle; // cm per pixel

    // ── FRONT SCAN ──────────────────────────────────────────────────────────
    const fLS = frontLm[11]; const fRS = frontLm[12]; // shoulders
    const fLE = frontLm[13]; const fRE = frontLm[14]; // elbows
    const fLH = frontLm[23]; const fRH = frontLm[24]; // hips
    const fLK = frontLm[25]; const fRK = frontLm[26]; // knees
    const fLA = frontLm[27]; const fRA = frontLm[28]; // ankles

    // Shoulder width — landmark-to-landmark + ~10 cm for surface beyond joints
    const shoulderWidthCm = Math.abs(fRS.x - fLS.x) * imgW * ratio + 10;

    // Interpolate body width at a fractional depth between shoulder and hip
    const frontWidthAtT = t => {
      const lx = fLS.x + t * (fLH.x - fLS.x);
      const rx = fRS.x + t * (fRH.x - fRS.x);
      return Math.abs(rx - lx) * imgW * ratio;
    };
    const chestWidthFrontCm = frontWidthAtT(0.22);  // 22% below shoulder ≈ chest level
    const waistWidthFrontCm = frontWidthAtT(0.55);  // 55% below shoulder ≈ waist level

    // Hip width — joint distance + ~12 cm for actual hip surface beyond joints
    const hipWidthFrontCm = Math.abs(fRH.x - fLH.x) * imgW * ratio + 12;

    // Bicep — estimate from upper-arm length (shoulder to elbow), treat as circle
    // Bicep diameter ≈ 30% of upper-arm length (empirical approximation)
    const leftArmLen  = Math.hypot((fLE.x - fLS.x) * imgW, (fLE.y - fLS.y) * imgH);
    const rightArmLen = Math.hypot((fRE.x - fRS.x) * imgW, (fRE.y - fRS.y) * imgH);
    const avgArmLenCm = ((leftArmLen + rightArmLen) / 2) * ratio;
    const bicepCircCm = Math.PI * (avgArmLenCm * 0.30); // π × diameter

    // Thigh — half-widths from body centreline at 25% down the thigh
    const midHipX          = (fLH.x + fRH.x) / 2;
    const leftThighMidX    = fLH.x + 0.25 * (fLK.x - fLH.x);
    const rightThighMidX   = fRH.x + 0.25 * (fRK.x - fRH.x);
    const thighDiamFrontCm = (Math.abs(leftThighMidX - midHipX) + Math.abs(rightThighMidX - midHipX)) * imgW * ratio;

    // Inseam — hip midpoint to ankle midpoint
    const hipMidY    = (fLH.y + fRH.y) / 2;
    const ankleMidY  = (fLA.y + fRA.y) / 2;
    const inseamCm   = (ankleMidY - hipMidY) * imgH * ratio;

    // Derived height (for verification against input)
    const heightFromScanCm = pxNoseAnkle * ratio + 12;

    // ── SIDE SCAN ────────────────────────────────────────────────────────────
    // Subject turned LEFT → right side now faces camera.
    // lm[12] (right shoulder) is near camera; lm[11] (left shoulder) is far camera.
    const sLS = sideLm[11]; const sRS = sideLm[12]; // shoulders in side view
    const sLH = sideLm[23]; const sRH = sideLm[24]; // hips in side view
    const sLK = sideLm[25]; const sRK = sideLm[26]; // knees in side view

    // Depth at fractional T between shoulder and hip (side view equivalent)
    const sideDepthAtT = t => {
      const lx = sLS.x + t * (sLH.x - sLS.x);
      const rx = sRS.x + t * (sRH.x - sRS.x);
      return Math.abs(rx - lx) * imgW * ratio;
    };

    const shoulderDepthCm = Math.abs(sRS.x - sLS.x) * imgW * ratio;
    // Chest wall protrudes ~12% beyond shoulder-to-shoulder depth
    const chestDepthCm = shoulderDepthCm * 1.12;
    const waistDepthCm = sideDepthAtT(0.55);
    const hipDepthCm   = Math.abs(sRH.x - sLH.x) * imgW * ratio;
    // Thigh depth at ~75% between hip and knee (thigh is widest there)
    const thighDepthCm = Math.abs(
      (sRH.x + 0.75 * (sRK.x - sRH.x)) - (sLH.x + 0.75 * (sLK.x - sLH.x))
    ) * imgW * ratio;

    // ── DIAGONAL SCAN (45°) ───────────────────────────────────────────────────
    // Subject at 45° — front and side landmarks both partially visible.
    // We read diagonal widths at the same T positions used in front scan.
    let diagChestWidthCm = 0, diagWaistWidthCm = 0, diagHipWidthCm = 0;
    if (diagLm) {
      const dLS = diagLm[11]; const dRS = diagLm[12];
      const dLH = diagLm[23]; const dRH = diagLm[24];
      const diagWidthAtT = t => {
        const lx = dLS.x + t * (dLH.x - dLS.x);
        const rx = dRS.x + t * (dRH.x - dRS.x);
        return Math.abs(rx - lx) * imgW * ratio;
      };
      diagChestWidthCm = diagWidthAtT(0.22);
      diagWaistWidthCm = diagWidthAtT(0.55);
      diagHipWidthCm   = Math.abs(dRH.x - dLH.x) * imgW * ratio;
    }

    // ── CIRCUMFERENCES via Ramanujan ellipse ─────────────────────────────────
    // If diagonal scan is available, use 3-view improved axes; else fall back to 2-view.
    let chestA, chestB, waistA, waistB, hipA, hipB;
    if (diagLm && diagChestWidthCm > 0) {
      [chestA, chestB] = improvedAxes(chestWidthFrontCm, chestDepthCm, diagChestWidthCm);
      [waistA, waistB] = improvedAxes(waistWidthFrontCm, waistDepthCm, diagWaistWidthCm);
      [hipA,   hipB]   = improvedAxes(hipWidthFrontCm,   hipDepthCm,   diagHipWidthCm);
    } else {
      chestA = chestWidthFrontCm / 2; chestB = chestDepthCm / 2;
      waistA = waistWidthFrontCm / 2; waistB = waistDepthCm / 2;
      hipA   = hipWidthFrontCm   / 2; hipB   = hipDepthCm   / 2;
    }

    const chestCirc = ellipsePerimeter(chestA, chestB);
    const waistCirc = ellipsePerimeter(waistA, waistB);
    const hipCirc   = ellipsePerimeter(hipA,   hipB);
    const thighCirc = ellipsePerimeter(thighDiamFrontCm / 2, thighDepthCm / 2);

    return {
      height:    r(heightFromScanCm),
      shoulders: r(shoulderWidthCm),
      chest:     r(chestCirc),
      waist:     r(waistCirc),
      hips:      r(hipCirc),
      bicep:     r(bicepCircCm),
      thigh:     r(thighCirc),
      inseam:    r(inseamCm),
      _debug: {
        ratio:       r(ratio * 100) / 100,
        chestFront:  r(chestWidthFrontCm),  chestDepth:  r(chestDepthCm),  chestDiag: r(diagChestWidthCm),
        waistFront:  r(waistWidthFrontCm),  waistDepth:  r(waistDepthCm),  waistDiag: r(diagWaistWidthCm),
        hipFront:    r(hipWidthFrontCm),     hipDepth:    r(hipDepthCm),    hipDiag:   r(diagHipWidthCm),
        thighFront:  r(thighDiamFrontCm),   thighDepth:  r(thighDepthCm),
        has3Views:   !!diagLm,
      }
    };
  }

  function r(v) { return Math.round(v * 10) / 10; }

  return { compute, medianLandmarks };
})();
