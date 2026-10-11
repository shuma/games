import { Sfx } from '@/game/audio'

/** Catch the Food sounds: reuses Adam-Man's chomp and burp, plus a "bleh" for yucky food. */
export class CatchSfx extends Sfx {
  /** "Bleh!": a wobbling, falling buzz. */
  yuck() {
    this.play([
      { freq: 330, to: 110, dur: 0.45, type: 'sawtooth', vol: 0.06 },
      { freq: 340, to: 115, dur: 0.45, type: 'square', vol: 0.03 },
    ])
  }

  treat() {
    this.play([784, 988, 1175, 1568].map((freq, i) => ({ freq, dur: 0.09, at: i * 0.05, type: 'triangle' as const, vol: 0.09 })))
  }
}
