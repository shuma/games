const MUTE_KEY = 'arcade:muted'

export interface Note {
  freq: number
  to?: number
  dur: number
  at?: number
  type?: OscillatorType
  vol?: number
}

/** Tiny WebAudio synth for retro sound effects. Mute is shared by every game. */
export class Synth {
  protected ctx: AudioContext | null = null
  muted = localStorage.getItem(MUTE_KEY) === '1'
  /** Never makes a sound, e.g. for menu previews. Audio is simply never unlocked. */
  silent = false

  setMuted(muted: boolean) {
    this.muted = muted
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  }

  /** Must be called from a user gesture before sounds can play. */
  unlock() {
    if (this.silent) return
    if (!this.ctx) this.ctx = new AudioContext()
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }

  protected play(notes: Note[]) {
    const ctx = this.ctx
    if (!ctx || this.muted) return
    const now = ctx.currentTime
    for (const n of notes) {
      const start = now + (n.at ?? 0)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = n.type ?? 'square'
      osc.frequency.setValueAtTime(n.freq, start)
      if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, start + n.dur)
      gain.gain.setValueAtTime(n.vol ?? 0.06, start)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + n.dur)
      osc.connect(gain).connect(ctx.destination)
      osc.start(start)
      osc.stop(start + n.dur + 0.02)
    }
  }
}
