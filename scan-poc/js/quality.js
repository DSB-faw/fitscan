// quality.js — Real-time frame quality checks (5 checks, both front and side)
const Quality = (() => {
  const MIN_VIS          = 0.60;
  const BODY_MIN_RATIO   = 0.63;
  const BODY_MAX_RATIO   = 0.93;
  const CENTER_MAX       = 0.18;
  const TILT_MAX_DEG     = 6;
  const LEAN_MAX_DEG     = 10;
  const BRIGHTNESS_MIN   = 35;
  const BRIGHTNESS_MAX   = 225;

  // Landmark indices needed for each scan type
  const FRONT_REQUIRED = [0, 11, 12, 23, 24, 27, 28]; // nose, shoulders, hips, ankles
  const SIDE_REQUIRED  = [11, 12, 23, 24, 28];         // both shoulders, both hips, right ankle

  function checkFront(lm, brightness) {
    if (!lm || lm.length < 33)
      return fail('fullBody', 'No pose detected — make sure subject is fully visible');

    if (!FRONT_REQUIRED.every(i => lm[i].visibility >= MIN_VIS))
      return fail('fullBody', 'Step back — full body not visible');

    const topY    = lm[0].y;
    const bottomY = Math.max(lm[27].y, lm[28].y);
    const ratio   = bottomY - topY;
    if (ratio < BODY_MIN_RATIO) return fail('distance', 'Buddy — step a bit closer');
    if (ratio > BODY_MAX_RATIO) return fail('distance', 'Buddy — step back a little');

    const midX   = (lm[11].x + lm[12].x) / 2;
    const offset = Math.abs(midX - 0.5);
    if (offset > CENTER_MAX)
      return fail('centred', midX < 0.5 ? 'Buddy — move right a little' : 'Buddy — move left a little');

    const dy      = Math.abs(lm[11].y - lm[12].y);
    const dx      = Math.abs(lm[11].x - lm[12].x);
    const tiltDeg = Math.atan2(dy, dx) * 180 / Math.PI;
    if (tiltDeg > TILT_MAX_DEG)
      return fail('tilt', 'Stand straight — keep shoulders level');

    if (brightness < BRIGHTNESS_MIN) return fail('lighting', 'Too dark — move to better light');
    if (brightness > BRIGHTNESS_MAX) return fail('lighting', 'Too bright — avoid direct backlight');

    return pass();
  }

  function checkSide(lm, brightness) {
    if (!lm || lm.length < 33)
      return fail('fullBody', 'No pose detected');

    // Slightly more lenient visibility for side view (far-side limbs are occluded)
    if (!SIDE_REQUIRED.every(i => lm[i].visibility >= MIN_VIS - 0.08))
      return fail('fullBody', 'Step back — full body not visible');

    // Use right shoulder → right ankle as body height reference
    const topY    = lm[12].y;
    const bottomY = lm[28].y;
    const ratio   = bottomY - topY;
    if (ratio < BODY_MIN_RATIO) return fail('distance', 'Buddy — step a bit closer');
    if (ratio > BODY_MAX_RATIO) return fail('distance', 'Buddy — step back a little');

    // Centre on right shoulder (the side facing camera)
    const midX   = lm[12].x;
    const offset = Math.abs(midX - 0.5);
    if (offset > CENTER_MAX + 0.05) // more lenient in side view
      return fail('centred', midX < 0.5 ? 'Buddy — move right a little' : 'Buddy — move left a little');

    // Lean check: right shoulder to right hip should be roughly vertical
    const sdx     = Math.abs(lm[12].x - lm[24].x);
    const sdy     = Math.abs(lm[24].y - lm[12].y);
    const leanDeg = Math.atan2(sdx, sdy) * 180 / Math.PI;
    if (leanDeg > LEAN_MAX_DEG)
      return fail('tilt', "Subject — stand straight, don't lean forward or back");

    if (brightness < BRIGHTNESS_MIN) return fail('lighting', 'Too dark — move to better light');
    if (brightness > BRIGHTNESS_MAX) return fail('lighting', 'Too bright — avoid direct backlight');

    return pass();
  }

  function pass() {
    return {
      allPass: true,
      failedCheck: null,
      message: 'Perfect — hold still',
      checks: { fullBody: true, distance: true, centred: true, tilt: true, lighting: true }
    };
  }

  function fail(check, message) {
    const order  = ['fullBody', 'distance', 'centred', 'tilt', 'lighting'];
    const idx    = order.indexOf(check);
    const checks = {};
    order.forEach((k, i) => { checks[k] = i < idx; }); // checks before failed one are true
    checks[check] = false;
    return { allPass: false, failedCheck: check, message, checks };
  }

  return { checkFront, checkSide };
})();
