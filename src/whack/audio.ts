import { Synth } from '@/lib/synth'

/** Whack-a-Dad sound effects. */
export class WhackSfx extends Synth {
  /** Dad peeks out: a short rising pip. */
  pop() {
    this.play([{ freq: 300, to: 700, dur: 0.08, type: 'triangle', vol: 0.06 }])
  }

  /** Hammer bonk plus a dad "ow!": a falling voiced buzz through vowel formants. */
  bonk() {
    this.play([
      { freq: 900, to: 180, dur: 0.12, type: 'square', vol: 0.08 },
      { freq: 140, to: 60, dur: 0.15, type: 'sine', vol: 0.3 },
    ])
    const ctx = this.ctx
    if (!ctx || this.muted) return
    const start = ctx.currentTime + 0.06
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(260, start)
    osc.frequency.exponentialRampToValueAtTime(150, start + 0.3)
    const out = ctx.createGain()
    out.gain.setValueAtTime(0.0001, start)
    out.gain.exponentialRampToValueAtTime(0.45, start + 0.03)
    out.gain.exponentialRampToValueAtTime(0.0001, start + 0.32)
    // "Ah" sliding to "oo" by lowering the formants.
    for (const [from, to, q] of [[800, 350, 6], [1200, 700, 8]]) {
      const formant = ctx.createBiquadFilter()
      formant.type = 'bandpass'
      formant.frequency.setValueAtTime(from, start)
      formant.frequency.exponentialRampToValueAtTime(to, start + 0.3)
      formant.Q.value = q
      osc.connect(formant).connect(out)
    }
    out.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.34)
  }

  golden() {
    this.play([1047, 1319, 1568, 2093].map((freq, i) => ({ freq, dur: 0.1, at: i * 0.06, type: 'triangle' as const, vol: 0.09 })))
  }

  /** Whacked Adam by mistake. */
  oops() {
    this.play([
      { freq: 220, dur: 0.14, type: 'square', vol: 0.06 },
      { freq: 160, dur: 0.22, at: 0.14, type: 'square', vol: 0.06 },
    ])
  }

  tick() {
    this.play([{ freq: 1200, dur: 0.05, type: 'square', vol: 0.04 }])
  }

  start() {
    this.play([523, 659, 784].map((freq, i) => ({ freq, dur: 0.12, at: i * 0.12, type: 'square' as const, vol: 0.05 })))
  }

  end() {
    this.play([784, 659, 523, 1047].map((freq, i) => ({ freq, dur: i === 3 ? 0.4 : 0.14, at: i * 0.14, type: 'triangle' as const, vol: 0.1 })))
  }
}
