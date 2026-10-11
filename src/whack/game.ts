import { WhackSfx } from './audio'

export type Phase = 'menu' | 'playing' | 'gameOver'
export type Who = 'dad' | 'golden' | 'adam'

export interface HoleView {
  who: Who | null
  up: boolean
  hit: boolean
  /** Bumped on every whack so the score popup can restart its animation. */
  popupId: number
  popup: string
}

export interface Snapshot {
  phase: Phase
  paused: boolean
  muted: boolean
  score: number
  best: number
  newBest: boolean
  timeLeft: number
  whacked: number
  holes: HoleView[]
}

const BEST_KEY = 'whack-a-dad:best'
export const HOLES = 9
export const ROUND_SECONDS = 45
export const POINTS: Record<Who, number> = { dad: 1, golden: 3, adam: -2 }
const HIT_SHOW = 0.45

interface Hole extends HoleView {
  timer: number
}

const emptyHole = (): Hole => ({ who: null, up: false, hit: false, popupId: 0, popup: '', timer: 0 })

export class WhackGame {
  readonly sfx = new WhackSfx()

  phase: Phase = 'menu'
  paused = false
  score = 0
  best = Number(localStorage.getItem(BEST_KEY)) || 0
  newBest = false

  private holes: Hole[] = Array.from({ length: HOLES }, emptyHole)
  private timeLeft = ROUND_SECONDS
  private whacked = 0
  private spawnTimer = 0
  private frame = 0
  private last = 0
  private listeners = new Set<(snapshot: Snapshot) => void>()
  private lastSnapshot = ''

  get snapshot(): Snapshot {
    return {
      phase: this.phase,
      paused: this.paused,
      muted: this.sfx.muted,
      score: this.score,
      best: this.best,
      newBest: this.newBest,
      timeLeft: Math.ceil(this.timeLeft),
      whacked: this.whacked,
      holes: this.holes.map(({ who, up, hit, popupId, popup }) => ({ who, up, hit, popupId, popup })),
    }
  }

  subscribe(listener: (snapshot: Snapshot) => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  // ---- Controls -----------------------------------------------------------

  newGame() {
    this.sfx.unlock()
    this.holes = Array.from({ length: HOLES }, emptyHole)
    this.score = 0
    this.whacked = 0
    this.newBest = false
    this.timeLeft = ROUND_SECONDS
    this.spawnTimer = 0.6
    this.paused = false
    this.phase = 'playing'
    this.sfx.start()
    this.emit()
  }

  toMenu() {
    this.holes = Array.from({ length: HOLES }, emptyHole)
    this.paused = false
    this.phase = 'menu'
    this.emit()
  }

  setPaused(paused: boolean) {
    if (this.phase !== 'playing') return
    this.paused = paused
    this.emit()
  }

  setMuted(muted: boolean) {
    this.sfx.setMuted(muted)
    this.emit()
  }

  whack(index: number) {
    const hole = this.holes[index]
    if (this.phase !== 'playing' || this.paused || !hole?.up || hole.hit || !hole.who) return
    const points = POINTS[hole.who]
    this.score = Math.max(0, this.score + points)
    hole.hit = true
    hole.timer = HIT_SHOW
    hole.popupId++
    if (hole.who === 'adam') {
      hole.popup = 'Not Adam!'
      this.sfx.oops()
    } else {
      this.whacked++
      hole.popup = `+${points}`
      this.sfx.bonk()
      if (hole.who === 'golden') this.sfx.golden()
    }
    this.emit()
  }

  // ---- Loop ---------------------------------------------------------------

  start() {
    const loop = (now: number) => {
      const dt = Math.min((now - (this.last || now)) / 1000, 0.1)
      this.last = now
      if (this.phase === 'playing' && !this.paused) this.update(dt)
      this.frame = requestAnimationFrame(loop)
    }
    this.frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(this.frame)
  }

  private update(dt: number) {
    const before = Math.ceil(this.timeLeft)
    this.timeLeft = Math.max(0, this.timeLeft - dt)
    const now = Math.ceil(this.timeLeft)
    if (now !== before && now <= 5 && now > 0) this.sfx.tick()

    // Difficulty ramps from gentle to busy over the round.
    const progress = 1 - this.timeLeft / ROUND_SECONDS
    const upTime = 1.5 - progress * 0.8
    const spawnEvery = 0.95 - progress * 0.5
    const maxUp = progress < 0.35 ? 1 : progress < 0.7 ? 2 : 3

    for (const hole of this.holes) {
      if (!hole.up) continue
      hole.timer -= dt
      if (hole.timer <= 0) {
        hole.up = false
        hole.hit = false
      }
    }

    this.spawnTimer -= dt
    if (this.spawnTimer <= 0) {
      this.spawnTimer = spawnEvery * (0.7 + Math.random() * 0.6)
      const free = this.holes.filter((h) => !h.up)
      if (this.holes.length - free.length < maxUp && free.length) {
        const hole = free[Math.floor(Math.random() * free.length)]
        const roll = Math.random()
        hole.who = roll < 0.08 ? 'golden' : roll < 0.08 + progress * 0.2 ? 'adam' : 'dad'
        hole.up = true
        hole.hit = false
        hole.timer = hole.who === 'golden' ? upTime * 0.7 : upTime
        this.sfx.pop()
      }
    }

    if (this.timeLeft <= 0) this.finish()
    this.emit()
  }

  private finish() {
    for (const hole of this.holes) hole.up = false
    this.phase = 'gameOver'
    if (this.score > this.best) {
      this.best = this.score
      this.newBest = true
      localStorage.setItem(BEST_KEY, String(this.best))
    }
    this.sfx.end()
  }

  private emit() {
    const snap = this.snapshot
    const key = JSON.stringify(snap)
    if (key === this.lastSnapshot) return
    this.lastSnapshot = key
    this.listeners.forEach((l) => l(snap))
  }
}
