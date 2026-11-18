// Studio-Grade Web Audio Synthesizer for Top 100
// Features realistic tactile mechanical switches, crystal-clear acoustic mallets, and gentle organic woodblock taps

let audioCtx: AudioContext | null = null;
const storedVol = typeof localStorage !== 'undefined' ? localStorage.getItem('top100_sfx_volume') : null;
let volume: number = storedVol !== null ? parseFloat(storedVol) : 0.75;
if (isNaN(volume) || volume < 0) {
  volume = 0.75;
}

const storedMuted = typeof localStorage !== 'undefined' ? localStorage.getItem('top100_sfx_muted') : null;
let isMuted: boolean = storedMuted === 'true';
let lastHoverTimestamp: number = 0;

function getAudioContext(): AudioContext | null {
  if (!audioCtx || audioCtx.state === 'closed') {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Global unlocker for browsers that restrict Web Audio before user interaction
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };
  window.addEventListener('click', unlockAudio, { passive: true });
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
}

export const soundFx = {
  isMuted: (): boolean => isMuted,
  setMuted: (muted: boolean): void => {
    isMuted = muted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('top100_sfx_muted', muted ? 'true' : 'false');
    }
  },
  toggleMuted: (): boolean => {
    soundFx.setMuted(!isMuted);
    return isMuted;
  },
  getVolume: (): number => volume,
  setVolume: (v: number): void => {
    soundFx.setSfxVolume(v);
  },
  getSfxVolume: (): number => volume,
  setSfxVolume: (v: number): void => {
    volume = Math.max(0, Math.min(1, v));
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('top100_sfx_volume', volume.toString());
    }
  },

  // Crystal-clear musical chime: Warm ascending two-note mallet chime (E6 -> A6) with singing harmonic decay
  playCorrect: (): void => {
    if (isMuted || volume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { freq: 1318.51, delay: 0.00, gainVal: 0.22, decay: 0.32 }, // E6
        { freq: 1760.00, delay: 0.07, gainVal: 0.26, decay: 0.50 }  // A6
      ];

      notes.forEach(({ freq, delay, gainVal, decay }) => {
        const t = now + delay;

        // Fundamental sine
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(gainVal * volume, t + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + decay + 0.02);

        // Acoustic overtone for crystal luster (2.76x chime partial)
        const partial = ctx.createOscillator();
        const partialGain = ctx.createGain();
        partial.type = 'sine';
        partial.frequency.setValueAtTime(freq * 2.76, t);

        partialGain.gain.setValueAtTime(0.0001, t);
        partialGain.gain.linearRampToValueAtTime(gainVal * 0.35 * volume, t + 0.003);
        partialGain.gain.exponentialRampToValueAtTime(0.0001, t + decay * 0.45);

        partial.connect(partialGain);
        partialGain.connect(ctx.destination);
        partial.start(t);
        partial.stop(t + decay * 0.5 + 0.01);
      });
    } catch {}
  },

  // Discreet, gentle double acoustic woodblock tap (non-intrusive, dignified, painless feedback)
  playIncorrect: (): void => {
    if (isMuted || volume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const taps = [
        { freq: 165, delay: 0.00, gainVal: 0.16, decay: 0.045 },
        { freq: 130, delay: 0.05, gainVal: 0.13, decay: 0.055 }
      ];

      taps.forEach(({ freq, delay, gainVal, decay }) => {
        const t = now + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(gainVal * volume, t + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + decay + 0.01);
      });
    } catch {}
  },

  // Sharp, miniature stopwatch escapement tick
  playTick: (): void => {
    if (isMuted || volume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2800, now);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2800, now);
      filter.Q.setValueAtTime(5.0, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.06 * volume, now + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.009);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.012);
    } catch {}
  },

  // Urgent, slightly higher mechanical tick
  playUrgentTick: (): void => {
    if (isMuted || volume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(3400, now);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3400, now);
      filter.Q.setValueAtTime(4.5, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.09 * volume, now + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.015);
    } catch {}
  },

  // Celebratory, sparkling chord arpeggio with golden resonance
  playFanfare: (): void => {
    if (isMuted || volume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { f: 880.00,  t: 0.00, d: 0.20 }, // A5
        { f: 1108.73, t: 0.08, d: 0.22 }, // C#6
        { f: 1318.51, t: 0.16, d: 0.26 }, // E6
        { f: 1760.00, t: 0.26, d: 0.55 }  // A6
      ];

      notes.forEach(({ f, t, d }) => {
        const time = now + t;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, time);

        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(0.18 * volume, time + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + d + 0.02);
      });
    } catch {}
  },

  // Grand triumph chime cascade
  playVictorySound: (): void => {
    if (isMuted || volume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const melody = [
        { f: 659.25,  t: 0.00, d: 0.18 }, // E5
        { f: 880.00,  t: 0.10, d: 0.18 }, // A5
        { f: 1108.73, t: 0.20, d: 0.20 }, // C#6
        { f: 1318.51, t: 0.32, d: 0.24 }, // E6
        { f: 1760.00, t: 0.46, d: 0.75 }  // A6 Finale
      ];

      melody.forEach(({ f, t, d }) => {
        const time = now + t;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, time);

        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(0.20 * volume, time + 0.007);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + d + 0.02);
      });
    } catch {}
  },

  // Delicate crystal droplet for toggle switches
  playSettingsChange: (): void => {
    if (isMuted || volume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, t); // B5

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.12 * volume, t + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.05);
    } catch {}
  },

  // Whisper-soft marimba pip on hover (gentle, tactile, never fatiguing)
  playHover: (): void => {
    if (isMuted || volume <= 0) return;
    const now = Date.now();
    if (now - lastHoverTimestamp < 65) return;
    lastHoverTimestamp = now;

    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t); // A4

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.03 * volume, t + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.018);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.022);
    } catch {}
  },

  // Satisfying tactile switch click (punchy physical tock with zero harshness)
  playClick: (): void => {
    if (isMuted || volume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      // 1. Crisp physical impulse
      const oscSnap = ctx.createOscillator();
      const gainSnap = ctx.createGain();
      const filterSnap = ctx.createBiquadFilter();

      oscSnap.type = 'triangle';
      oscSnap.frequency.setValueAtTime(1600, t);

      filterSnap.type = 'bandpass';
      filterSnap.frequency.setValueAtTime(1600, t);
      filterSnap.Q.setValueAtTime(3.5, t);

      gainSnap.gain.setValueAtTime(0.0001, t);
      gainSnap.gain.linearRampToValueAtTime(0.18 * volume, t + 0.001);
      gainSnap.gain.exponentialRampToValueAtTime(0.0001, t + 0.010);

      oscSnap.connect(filterSnap);
      filterSnap.connect(gainSnap);
      gainSnap.connect(ctx.destination);

      // 2. Warm low thumb body (gives that juicy tactile mechanical keyboard snap)
      const oscBody = ctx.createOscillator();
      const gainBody = ctx.createGain();

      oscBody.type = 'sine';
      oscBody.frequency.setValueAtTime(110, t);

      gainBody.gain.setValueAtTime(0.0001, t);
      gainBody.gain.linearRampToValueAtTime(0.15 * volume, t + 0.002);
      gainBody.gain.exponentialRampToValueAtTime(0.0001, t + 0.020);

      oscBody.connect(gainBody);
      gainBody.connect(ctx.destination);

      oscSnap.start(t);
      oscBody.start(t);
      oscSnap.stop(t + 0.012);
      oscBody.stop(t + 0.025);
    } catch {}
  }
};
