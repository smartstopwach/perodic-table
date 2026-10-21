/**
 * Lightweight Web Audio API Sound + Android Haptic Feedback Engine
 * Zero external audio dependencies; graceful fallback everywhere.
 */
(function () {
  'use strict';

  let ctx = null;
  let enabled = true;

  try {
    const saved = localStorage.getItem('pt_sound_enabled');
    if (saved !== null) enabled = saved === 'true';
  } catch (_) {}

  function vibrate(pattern) {
    if (!enabled) return;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch (_) {}
  }

  function getContext() {
    if (!enabled) return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!ctx) {
      ctx = new AudioCtx();
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function tone(freq, type, startOffset, duration, gainPeak) {
    const audio = getContext();
    if (!audio) return;
    const now = audio.currentTime + startOffset;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  window.SoundFX = {
    isEnabled() {
      return enabled;
    },
    setEnabled(val) {
      enabled = Boolean(val);
      try {
        localStorage.setItem('pt_sound_enabled', String(enabled));
      } catch (_) {}
      return enabled;
    },
    toggle() {
      return this.setEnabled(!enabled);
    },
    pickup() {
      vibrate(10);
      tone(520, 'sine', 0, 0.055, 0.05);
    },
    correct(streak = 1) {
      vibrate([15, 25, 25]);
      const semitoneBoost = Math.min(streak - 1, 7);
      const base = 523.25 * Math.pow(2, semitoneBoost / 12);
      tone(base, 'triangle', 0, 0.14, 0.11);
      tone(base * 1.25, 'sine', 0.06, 0.22, 0.12);
    },
    wrong() {
      vibrate([45, 35, 45]);
      tone(210, 'sawtooth', 0, 0.12, 0.07);
      tone(165, 'sawtooth', 0.09, 0.18, 0.07);
    },
    hint() {
      vibrate(18);
      tone(659.25, 'sine', 0, 0.12, 0.07);
      tone(987.77, 'sine', 0.08, 0.2, 0.08);
    },
    win() {
      vibrate([25, 40, 25, 40, 60]);
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, idx) => {
        tone(n, 'triangle', idx * 0.085, 0.34, 0.12);
      });
    }
  };
})();
