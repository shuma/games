import { Synth } from '@/lib/synth'

/** FlappyAisha sound effects. */
export class FlappySfx extends Synth {
  /** Broom whoosh: a quick downward sweep. */
  flap() {
    this.play([{ freq: 640, to: 260, dur: 0.12, type: 'triangle', vol: 0.09 }])
  }

  private noiseBuffer: AudioBuffer | null = null

  private noise(ctx: AudioContext) {
    if (!this.noiseBuffer) {
      this.noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
      const data = this.noiseBuffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    }
    const src = ctx.createBufferSource()
    src.buffer = this.noiseBuffer
    return src
  }

  /** Tower explosion: a filtered noise burst over a low thump. */
  boom() {
    const ctx = this.ctx
    if (!ctx || this.muted) return
    const start = ctx.currentTime
    const src = this.noise(ctx)
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1800, start)
    filter.frequency.exponentialRampToValueAtTime(120, start + 0.6)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.35, start)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6)
    src.connect(filter).connect(gain).connect(ctx.destination)
    src.start(start)
    src.stop(start + 0.62)
    this.play([{ freq: 120, to: 40, dur: 0.35, type: 'sine', vol: 0.3 }])
  }

  /** "Ha-ha-ha-ha": a voiced buzz through vowel formants, one syllable at a time. */
  laugh() {
    const ctx = this.ctx
    if (!ctx || this.muted) return
    const begin = ctx.currentTime + 0.08
    for (let i = 0; i < 4; i++) {
      const start = begin + i * 0.12
      const pitch = 470 - i * 28
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(pitch * 1.06, start)
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.92, start + 0.09)
      const out = ctx.createGain()
      out.gain.setValueAtTime(0.0001, start)
      out.gain.exponentialRampToValueAtTime(0.5, start + 0.015)
      out.gain.exponentialRampToValueAtTime(0.0001, start + 0.1)
      for (const [freq, q] of [[850, 6], [1250, 8], [2800, 10]]) {
        const formant = ctx.createBiquadFilter()
        formant.type = 'bandpass'
        formant.frequency.value = freq
        formant.Q.value = q
        osc.connect(formant).connect(out)
      }
      // Breathy "h" at the start of each syllable.
      const breath = this.noise(ctx)
      const hiss = ctx.createBiquadFilter()
      hiss.type = 'highpass'
      hiss.frequency.value = 2200
      const breathGain = ctx.createGain()
      breathGain.gain.setValueAtTime(0.06, start - 0.02)
      breathGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.03)
      breath.connect(hiss).connect(breathGain).connect(ctx.destination)
      breath.start(start - 0.02)
      breath.stop(start + 0.04)
      out.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.11)
    }
  }

  snitch() {
    this.play([1319, 1568, 1976, 2637].map((freq, i) => ({ freq, dur: 0.09, at: i * 0.05, type: 'triangle' as const, vol: 0.08 })))
  }

  hit() {
    this.play([
      { freq: 180, to: 60, dur: 0.25, type: 'square', vol: 0.08 },
      { freq: 700, to: 150, dur: 0.6, at: 0.15, type: 'triangle', vol: 0.06 },
    ])
  }
}
