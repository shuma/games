import { Synth } from '@/lib/synth'

/** DagRacer sounds, including a looping engine whose pitch follows the speed. */
export class RacerSfx extends Synth {
  private engine: { osc: OscillatorNode; gain: GainNode } | null = null

  /** Engine level: 0 is silent, 1 is full revs. */
  setEngine(revs: number) {
    const ctx = this.ctx
    if (!ctx) return
    if (!this.engine) {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 500
      const gain = ctx.createGain()
      gain.gain.value = 0
      osc.connect(filter).connect(gain).connect(ctx.destination)
      osc.start()
      this.engine = { osc, gain }
    }
    const now = ctx.currentTime
    const on = revs > 0 && !this.muted
    this.engine.gain.gain.setTargetAtTime(on ? 0.035 : 0, now, 0.05)
    if (on) this.engine.osc.frequency.setTargetAtTime(55 + revs * 70, now, 0.1)
  }

  jump() {
    this.play([{ freq: 300, to: 900, dur: 0.18, type: 'square', vol: 0.05 }])
  }

  land() {
    this.play([{ freq: 120, to: 60, dur: 0.08, type: 'sine', vol: 0.2 }])
  }

  coin() {
    this.play([
      { freq: 988, dur: 0.06, type: 'square', vol: 0.04 },
      { freq: 1319, dur: 0.14, at: 0.06, type: 'square', vol: 0.04 },
    ])
  }

  /** Cash register "ka-ching". */
  cash() {
    this.play([
      { freq: 2400, to: 1200, dur: 0.04, type: 'square', vol: 0.05 },
      { freq: 1568, dur: 0.3, at: 0.05, type: 'triangle', vol: 0.1 },
      { freq: 2093, dur: 0.35, at: 0.05, type: 'triangle', vol: 0.06 },
    ])
  }

  bag() {
    this.play([1047, 1319, 1568, 2093, 2637].map((freq, i) => ({ freq, dur: 0.1, at: i * 0.05, type: 'triangle' as const, vol: 0.09 })))
  }

  burn() {
    this.play([
      { freq: 400, to: 80, dur: 0.4, type: 'sawtooth', vol: 0.08 },
      { freq: 150, to: 50, dur: 0.3, type: 'square', vol: 0.06 },
    ])
  }

  beep(high: boolean) {
    this.play([{ freq: high ? 1046 : 523, dur: high ? 0.4 : 0.15, type: 'square', vol: 0.05 }])
  }

  crash() {
    this.play([
      { freq: 600, to: 60, dur: 0.9, type: 'sawtooth', vol: 0.07 },
      { freq: 90, to: 40, dur: 0.5, type: 'sine', vol: 0.3 },
    ])
  }
}
