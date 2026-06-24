// voice.js — Text-to-speech with iOS Safari compatibility
const Voice = (() => {
  let lastSpoken = '';
  let lastSpeakTime = 0;
  const DEBOUNCE_MS = 2800;
  let voices = [];

  function loadVoices() {
    voices = speechSynthesis.getVoices();
  }
  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();

  // Must be called from a user gesture (button tap) to unlock iOS audio
  function prime() {
    try {
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  function speak(text, force = false) {
    if (!text) return;
    const now = Date.now();
    if (!force && text === lastSpoken && (now - lastSpeakTime) < DEBOUNCE_MS) return;
    lastSpoken = text;
    lastSpeakTime = now;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.volume = 1.0;
      const en = voices.find(v => v.lang === 'en-US') || voices.find(v => v.lang.startsWith('en'));
      if (en) u.voice = en;
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  function cancel() {
    try { speechSynthesis.cancel(); } catch (e) {}
    lastSpoken = '';
  }

  return { prime, speak, cancel };
})();
