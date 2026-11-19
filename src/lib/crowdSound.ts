/**
 * Synthesized stadium sound for "play the moment" films — no recordings involved.
 * A filtered-noise crowd bed swells with each caption beat; an optional bat "crack" lands on
 * the last beat followed by a big roar; a low drone gives it a cinematic floor.
 */
type Ctx = AudioContext;
let ctx: Ctx | null = null;

function getCtx(): Ctx | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

function noiseBuffer(c: Ctx, seconds: number, brown = true) {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.2;
    } else d[i] = w;
  }
  return buf;
}

export type MomentSound = { stop: () => void };

/** Play a moment of `beatSec * 3` seconds. Must be called from a user gesture. */
export function playMoment(opts: { swell: number; crack?: boolean; beatSec: number }): MomentSound | null {
  const c = getCtx();
  if (!c) return null;
  void c.resume();
  const t0 = c.currentTime + 0.05;
  const total = opts.beatSec * 3 + 2.5;
  const master = c.createGain();
  master.gain.value = 0.9;
  master.connect(c.destination);

  // crowd bed
  const crowd = c.createBufferSource();
  crowd.buffer = noiseBuffer(c, 3);
  crowd.loop = true;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 850;
  bp.Q.value = 0.6;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 2600;
  const cg = c.createGain();
  cg.gain.setValueAtTime(0.0001, t0);
  const base = 0.05 + opts.swell * 0.12;
  cg.gain.exponentialRampToValueAtTime(base, t0 + 1.2);
  // gentle swell on beat 2
  cg.gain.linearRampToValueAtTime(base * 1.5, t0 + opts.beatSec * 1.6);
  cg.gain.linearRampToValueAtTime(base * 1.1, t0 + opts.beatSec * 2);
  const hit = t0 + opts.beatSec * 2 + 0.35;
  if (opts.crack) {
    // the roar after the moment
    cg.gain.setValueAtTime(base * 1.1, hit);
    cg.gain.linearRampToValueAtTime(Math.min(0.75, base * 4 + opts.swell * 0.35), hit + 0.5);
    cg.gain.exponentialRampToValueAtTime(base * 1.4, hit + 3.2);
  } else {
    cg.gain.linearRampToValueAtTime(base * 2, hit + 0.8);
  }
  cg.gain.exponentialRampToValueAtTime(0.0001, t0 + total);
  crowd.connect(bp).connect(lp).connect(cg).connect(master);
  crowd.start(t0);
  crowd.stop(t0 + total + 0.1);

  // low drone
  const drone = c.createGain();
  drone.gain.setValueAtTime(0.0001, t0);
  drone.gain.exponentialRampToValueAtTime(0.05, t0 + 1.5);
  drone.gain.exponentialRampToValueAtTime(0.0001, t0 + total);
  drone.connect(master);
  const oscs = [55, 82.5].map((f) => {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    o.connect(drone);
    o.start(t0);
    o.stop(t0 + total + 0.1);
    return o;
  });

  // bat crack
  let crack: AudioBufferSourceNode | null = null;
  if (opts.crack) {
    crack = c.createBufferSource();
    crack.buffer = noiseBuffer(c, 0.12, false);
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1400;
    const kg = c.createGain();
    kg.gain.setValueAtTime(0.9, hit);
    kg.gain.exponentialRampToValueAtTime(0.0001, hit + 0.09);
    crack.connect(hp).connect(kg).connect(master);
    crack.start(hit);
  }

  return {
    stop: () => {
      const now = c.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + 0.25);
      setTimeout(() => {
        try {
          crowd.stop();
          oscs.forEach((o) => o.stop());
          crack?.stop();
        } catch {}
        master.disconnect();
      }, 320);
    },
  };
}

/** Unlock audio from a user gesture (call when the visitor turns sound on). */
export function unlockAudio() {
  const c = getCtx();
  if (c) void c.resume();
}

/** Bat crack + a crowd roar that swells and fades — for a six. */
export function playSix(loud = 1) {
  const c = getCtx();
  if (!c || c.state !== "running") return;
  const t0 = c.currentTime + 0.01;
  const out = c.createGain();
  out.gain.value = 0.9 * loud;
  out.connect(c.destination);

  // crack: a very short bright noise burst + a woody knock
  const crack = c.createBufferSource();
  crack.buffer = noiseBuffer(c, 0.25, false);
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1800;
  const cgn = c.createGain();
  cgn.gain.setValueAtTime(0.9, t0);
  cgn.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
  crack.connect(hp).connect(cgn).connect(out);
  crack.start(t0);
  crack.stop(t0 + 0.25);
  const knock = c.createOscillator();
  knock.type = "triangle";
  knock.frequency.setValueAtTime(900, t0);
  knock.frequency.exponentialRampToValueAtTime(260, t0 + 0.08);
  const kg = c.createGain();
  kg.gain.setValueAtTime(0.5, t0);
  kg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
  knock.connect(kg).connect(out);
  knock.start(t0);
  knock.stop(t0 + 0.15);

  // roar
  const roar = c.createBufferSource();
  roar.buffer = noiseBuffer(c, 3);
  roar.loop = true;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 900;
  bp.Q.value = 0.5;
  const rg = c.createGain();
  rg.gain.setValueAtTime(0.0001, t0);
  rg.gain.exponentialRampToValueAtTime(0.32, t0 + 0.9);
  rg.gain.setValueAtTime(0.32, t0 + 2.2);
  rg.gain.exponentialRampToValueAtTime(0.0001, t0 + 4.6);
  roar.connect(bp).connect(rg).connect(out);
  roar.start(t0);
  roar.stop(t0 + 4.8);
}
