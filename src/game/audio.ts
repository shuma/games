import { Synth } from '@/lib/synth'

/** Adam-Man sound effects. */
export class Sfx extends Synth {
  private chompToggle = false

  chomp() {
    this.chompToggle = !this.chompToggle
    this.play([{ freq: this.chompToggle ? 520 : 380, to: this.chompToggle ? 300 : 560, dur: 0.07, type: 'triangle', vol: 0.12 }])
  }

  /** Burp: a low, wobbling sawtooth through a lowpass filter. */
  burger() {
    const ctx = this.ctx
    if (!ctx || this.muted) return
    const start = ctx.currentTime
    const dur = 0.55

    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(110, start)
    osc.frequency.linearRampToValueAtTime(85, start + dur * 0.4)
    osc.frequency.linearRampToValueAtTime(65, start + dur)

    // Irregular vibrato gives the throaty rattle.
    const wobble = ctx.createOscillator()
    wobble.type = 'square'
    wobble.frequency.setValueAtTime(22, start)
    wobble.frequency.linearRampToValueAtTime(14, start + dur)
    const wobbleDepth = ctx.createGain()
    wobbleDepth.gain.value = 18
    wobble.connect(wobbleDepth).connect(osc.frequency)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(900, start)
    filter.frequency.linearRampToValueAtTime(400, start + dur)
    filter.Q.value = 6

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.04)
    gain.gain.setValueAtTime(0.22, start + dur * 0.6)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)

    osc.connect(filter).connect(gain).connect(ctx.destination)
    for (const node of [osc, wobble]) {
      node.start(start)
      node.stop(start + dur + 0.02)
    }
  }

  eatGhost() {
    this.play([{ freq: 200, to: 1400, dur: 0.35, type: 'sawtooth', vol: 0.05 }])
  }

  bonus() {
    this.play([
      { freq: 880, dur: 0.08, type: 'triangle', vol: 0.12 },
      { freq: 1320, dur: 0.12, at: 0.08, type: 'triangle', vol: 0.12 },
    ])
  }

  extraLife() {
    this.play([0, 0.12, 0.24].map((at) => ({ freq: 1046, dur: 0.1, at, type: 'square' as const })))
  }

  death() {
    this.play([
      { freq: 900, to: 120, dur: 1.2, type: 'square', vol: 0.05 },
      { freq: 160, to: 60, dur: 0.25, at: 1.25, type: 'square', vol: 0.06 },
      { freq: 160, to: 60, dur: 0.25, at: 1.5, type: 'square', vol: 0.06 },
    ])
  }

  start() {
    const melody = [523, 1046, 784, 659, 1046, 784, 659, 0, 554, 1108, 831, 698, 1108, 831, 698]
    this.play(
      melody.flatMap((freq, i) => (freq ? [{ freq, dur: 0.12, at: i * 0.14, type: 'square' as const, vol: 0.05 }] : [])),
    )
  }

  levelClear() {
    this.play([523, 659, 784, 1046].map((freq, i) => ({ freq, dur: 0.16, at: i * 0.12, type: 'triangle' as const, vol: 0.1 })))
  }
}
