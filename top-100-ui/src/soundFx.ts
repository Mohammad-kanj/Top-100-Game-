// Web Audio API Retro Arcade Synthesizer
let audioCtx: AudioContext | null = null;
const storedVol = localStorage.getItem('top100_sfx_volume');
let volume: number = storedVol !== null ? parseFloat(storedVol) : 0.7;
if (isNaN(volume) || volume <= 0.05) {
  volume = 0.7;
}
let isMuted: boolean = false;

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
    localStorage.setItem('top100_sfx_muted', muted ? 'true' : 'false');
  },
  toggleMuted: (): boolean => {
    soundFx.setMuted(!isMuted);
    return isMuted;
  },
  getVolume: (): number => volume,
  setVolume: (v: number): void => {
    volume = Math.max(0, Math.min(1, v));
    localStorage.setItem('top100_sfx_volume', volume.toString());
  },

  // Play ascending synth arpeggio for correct answer
  playCorrect: (): void => {
    if (isMuted || volume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);

      gain.gain.setValueAtTime(0, now + i * 0.07);
      gain.gain.linearRampToValueAtTime(0.3 * volume, now + i * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.3);
    });
  },

  // Play retro buzzer for wrong answer / strike
  playIncorrect: (): void => {
    if (isMuted || volume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.35);

    gain.gain.setValueAtTime(0.35 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  },

  // Play ticking clock pulse
  playTick: (): void => {
    if (isMuted || volume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);

    gain.gain.setValueAtTime(0.12 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  },

  // Play urgent tick for last 5 seconds
  playUrgentTick: (): void => {
    if (isMuted || volume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(987.77, now); // B5

    gain.gain.setValueAtTime(0.2 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  },

  // Play fanfare for round / match win
  playFanfare: (): void => {
    if (isMuted || volume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const sequence = [
      { f: 523.25, t: 0.0, d: 0.15 },
      { f: 659.25, t: 0.15, d: 0.15 },
      { f: 783.99, t: 0.30, d: 0.25 },
      { f: 1046.50, t: 0.55, d: 0.50 }
    ];

    sequence.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + t);

      gain.gain.setValueAtTime(0.35 * volume, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + t);
      osc.stop(now + t + d + 0.05);
    });
  },

  // Grand arcade victory sound effect with fanfare chords, brass leads, and triumph shimmers
  playVictorySound: (): void => {
    if (isMuted || volume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Triumphant brass/synth lead arpeggio
    const melody = [
      { f: 392.00, t: 0.00, d: 0.14, type: 'sawtooth' as OscillatorType, vol: 0.28 },
      { f: 523.25, t: 0.13, d: 0.14, type: 'sawtooth' as OscillatorType, vol: 0.32 },
      { f: 659.25, t: 0.26, d: 0.14, type: 'sawtooth' as OscillatorType, vol: 0.35 },
      { f: 783.99, t: 0.39, d: 0.20, type: 'sawtooth' as OscillatorType, vol: 0.38 },
      { f: 659.25, t: 0.58, d: 0.12, type: 'triangle' as OscillatorType, vol: 0.30 },
      { f: 783.99, t: 0.70, d: 0.14, type: 'sawtooth' as OscillatorType, vol: 0.40 },
      { f: 1046.50, t: 0.84, d: 1.20, type: 'sawtooth' as OscillatorType, vol: 0.45 },
    ];

    melody.forEach(({ f, t, d, type, vol: v }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(f, now + t);

      gain.gain.setValueAtTime(0.001, now + t);
      gain.gain.linearRampToValueAtTime(v * volume, now + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + t);
      osc.stop(now + t + d + 0.05);
    });

    // 2. Powerful major harmony chords resolving on the climax (t = 0.84)
    const chordFrequencies = [261.63, 329.63, 392.00, 523.25, 1318.51];
    chordFrequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + 0.84);

      gain.gain.setValueAtTime(0.001, now + 0.84);
      gain.gain.linearRampToValueAtTime(0.24 * volume, now + 0.86);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + 0.84);
      osc.stop(now + 2.05);
    });

    // 3. Sub-bass boom on resolution
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(130.81, now + 0.84); // C3
    subOsc.frequency.exponentialRampToValueAtTime(65.41, now + 1.8); // C2
    subGain.gain.setValueAtTime(0.38 * volume, now + 0.84);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now + 0.84);
    subOsc.stop(now + 1.85);

    // 4. Shimmering victory chimes
    const sparkles = [1567.98, 1975.53, 2093.00, 2637.02, 3135.96];
    sparkles.forEach((freq, idx) => {
      const sOsc = ctx.createOscillator();
      const sGain = ctx.createGain();
      sOsc.type = 'sine';
      sOsc.frequency.setValueAtTime(freq, now + 0.96 + idx * 0.09);

      sGain.gain.setValueAtTime(0.001, now + 0.96 + idx * 0.09);
      sGain.gain.linearRampToValueAtTime(0.12 * volume, now + 0.96 + idx * 0.09 + 0.02);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.96 + idx * 0.09 + 0.35);

      sOsc.connect(sGain);
      sGain.connect(ctx.destination);

      sOsc.start(now + 0.96 + idx * 0.09);
      sOsc.stop(now + 0.96 + idx * 0.09 + 0.4);
    });
  },

  // Crisp, cheerful retro arcade blip for settings changes (clearly audible on all speakers)
  playSettingsChange: (): void => {
    if (isMuted || volume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      // Dual oscillator for rich retro arcade chime (A5 to D6 chirp)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(1175, t + 0.09);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440, t);
      osc2.frequency.exponentialRampToValueAtTime(587, t + 0.09);

      gain.gain.setValueAtTime(0.55 * volume, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc2.start(t);
      osc.stop(t + 0.11);
      osc2.stop(t + 0.11);

      osc.onended = () => {
        try {
          osc.disconnect();
          osc2.disconnect();
          gain.disconnect();
        } catch {}
      };
    } catch (err) {
      console.warn('Audio play error:', err);
    }
  },

  // Snappy retro arcade button click
  playClick: (): void => {
    if (isMuted || volume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, t);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.07);

      gain.gain.setValueAtTime(0.5 * volume, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.075);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };
    } catch (err) {
      console.warn('Audio play error:', err);
    }
  }
};
