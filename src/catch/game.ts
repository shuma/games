import { CatchArt, GROUND_Y, H, pick, W, type FoodKind } from './art'
import { CatchSfx } from './audio'

export { W as WIDTH, H as HEIGHT }

export type Phase = 'menu' | 'playing' | 'dying' | 'gameOver'

export interface Snapshot {
  phase: Phase
  paused: boolean
  muted: boolean
  score: number
  best: number
  newBest: boolean
  lives: number
  caught: number
}

const BEST_KEY = 'catch-the-food:best'
export const LIVES = 3
const PLAYER_SIZE = 64
const PLAYER_Y = GROUND_Y - PLAYER_SIZE / 2 + 4
const KEY_SPEED = 420
// Points needed for full difficulty.
const RAMP = 150

interface Item {
  kind: FoodKind
  x: number
  y: number
  vy: number
  rot: number
  spin: number
}

interface Popup {
  x: number
  y: number
  text: string
  good: boolean
  timer: number
}

export class CatchGame {
  readonly art = new CatchArt()
  readonly sfx = new CatchSfx()

  phase: Phase = 'menu'
  paused = false
  score = 0
  best = Number(localStorage.getItem(BEST_KEY)) || 0
  newBest = false
  lives = LIVES

  /** Arrow-key steering: -1, 0 or 1. */
  steer = 0

  private x = W / 2
  private target = W / 2
  private items: Item[] = []
  private popups: Popup[] = []
  private caught = 0
  private time = 0
  private spawnTimer = 0
  private chew = 0
  private hurt = 0
  private dyingTimer = 0
  private font = ''
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
      lives: this.lives,
      caught: this.caught,
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
    this.score = 0
    this.caught = 0
    this.lives = LIVES
    this.newBest = false
    this.items = []
    this.popups = []
    this.x = this.target = W / 2
    this.spawnTimer = 0.8
    this.chew = this.hurt = 0
    this.paused = false
    this.phase = 'playing'
    this.emit()
  }

  toMenu() {
    this.items = []
    this.popups = []
    this.paused = false
    this.phase = 'menu'
    this.emit()
  }

  /** Self-playing, silent preview that never saves scores. */
  private demo = false
  private demoWait = 0

  startDemo() {
    this.demo = true
    this.sfx.silent = true
    this.newGame()
  }

  /** Demo player: chase the lowest snack, sidestepping yucky things about to land. */
  private autopilot(dt: number) {
    if (this.phase === 'gameOver') {
      this.demoWait += dt
      if (this.demoWait > 0.8) {
        this.demoWait = 0
        this.newGame()
      }
      return
    }
    if (this.phase !== 'playing') return
    const reachable = (i: Item) => Math.abs(i.x - this.x) / 600 < (PLAYER_Y - i.y) / i.vy + 0.05
    const food = this.items.filter((i) => i.kind.points > 0 && i.y < PLAYER_Y && reachable(i)).sort((a, b) => b.y - a.y)[0]
    let goal = food ? food.x : W / 2
    const threat = this.items.find((i) => i.kind.points === 0 && i.y > PLAYER_Y - 140 && i.y < PLAYER_Y && Math.abs(i.x - goal) < 44)
    if (threat) goal = threat.x + (goal < threat.x ? -50 : 50)
    this.aim(goal)
  }

  /** Move Adam toward an x position in game units. */
  aim(x: number) {
    this.target = Math.min(W - PLAYER_SIZE / 2, Math.max(PLAYER_SIZE / 2, x))
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

  // ---- Loop ---------------------------------------------------------------

  attach(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')!
    let last = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now
      if (!this.paused) this.update(dt)
      this.render(ctx, canvas.width / W)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }

  private update(dt: number) {
    this.time += dt
    if (this.demo) this.autopilot(dt)
    for (const p of this.popups) {
      p.timer -= dt
      p.y -= 40 * dt
    }
    this.popups = this.popups.filter((p) => p.timer > 0)
    this.chew = Math.max(0, this.chew - dt)
    this.hurt = Math.max(0, this.hurt - dt)

    if (this.phase === 'dying') {
      this.dyingTimer -= dt
      if (this.dyingTimer <= 0) this.finish()
      this.emit()
      return
    }
    if (this.phase !== 'playing') return

    if (this.steer) this.aim(this.target + this.steer * KEY_SPEED * dt)
    this.x += (this.target - this.x) * Math.min(1, dt * 18)

    const level = Math.min(1, this.score / RAMP)
    this.spawnTimer -= dt
    if (this.spawnTimer <= 0) {
      this.spawnTimer = (0.95 - level * 0.55) * (0.75 + Math.random() * 0.5)
      this.spawn(level)
    }

    for (const item of this.items) {
      item.y += item.vy * dt
      item.rot += item.spin * dt
    }
    this.items = this.items.filter((item) => {
      const caught = Math.abs(item.x - this.x) < 34 && item.y > PLAYER_Y - 38 && item.y < PLAYER_Y + 10
      if (caught) this.eat(item)
      return !caught && item.y < GROUND_Y + 12
    })
    this.emit()
  }

  private spawn(level: number) {
    const yucky = Math.random() < 0.15 + level * 0.15
    const kind = pick(yucky ? this.art.yucky : this.art.food)
    this.items.push({
      kind,
      x: 24 + Math.random() * (W - 48),
      y: -24,
      vy: (150 + level * 200) * (0.85 + Math.random() * 0.3),
      rot: 0,
      spin: (Math.random() - 0.5) * 3,
    })
  }

  private eat(item: Item) {
    const { kind } = item
    if (kind.points === 0) {
      this.lives--
      this.hurt = 0.6
      this.popups.push({ x: this.x, y: PLAYER_Y - 44, text: kind.stinky ? 'Stinky!' : 'Yuck!', good: false, timer: 0.8 })
      this.sfx.yuck()
      if (this.lives <= 0) {
        this.phase = 'dying'
        this.dyingTimer = 1.2
        this.items = []
        this.sfx.death()
      }
      return
    }
    this.score += kind.points
    this.caught++
    this.chew = 0.3
    this.popups.push({ x: this.x, y: PLAYER_Y - 44, text: `+${kind.points}`, good: true, timer: 0.7 })
    if (kind.name === 'burger') this.sfx.burger()
    else if (kind.points >= 5) this.sfx.treat()
    else this.sfx.chomp()
  }

  private finish() {
    this.phase = 'gameOver'
    if (this.score > this.best) {
      this.best = this.score
      this.newBest = true
      if (!this.demo) localStorage.setItem(BEST_KEY, String(this.best))
    }
  }

  private emit() {
    const snap = this.snapshot
    const key = JSON.stringify(snap)
    if (key === this.lastSnapshot) return
    this.lastSnapshot = key
    this.listeners.forEach((l) => l(snap))
  }

  // ---- Rendering ----------------------------------------------------------

  private render(ctx: CanvasRenderingContext2D, scale: number) {
    const jolt = this.hurt > 0.3 ? 4 : 0
    ctx.setTransform(scale, 0, 0, scale, (Math.random() - 0.5) * jolt * scale, 0)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.art.scene, 0, 0)

    for (const item of this.items) {
      const { sprite } = item.kind
      ctx.save()
      ctx.translate(item.x, item.y)
      ctx.rotate(Math.sin(item.rot) * 0.4)
      ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2)
      ctx.restore()
      if (item.kind.stinky) this.drawStink(ctx, item.x, item.y - sprite.height / 2)
    }

    if (this.phase !== 'menu') this.drawPlayer(ctx)

    this.font ||= getComputedStyle(document.documentElement).getPropertyValue('--font-ui')
    ctx.textAlign = 'center'
    ctx.font = `700 18px ${this.font}`
    for (const p of this.demo ? [] : this.popups) {
      ctx.globalAlpha = Math.min(1, p.timer * 3)
      ctx.lineWidth = 4
      ctx.strokeStyle = '#000000'
      ctx.strokeText(p.text, p.x, p.y)
      ctx.fillStyle = p.good ? '#ffd23f' : '#9bd17a'
      ctx.fillText(p.text, p.x, p.y)
    }
    ctx.globalAlpha = 1
  }

  /** Wavy green stink lines rising off the sock. */
  private drawStink(ctx: CanvasRenderingContext2D, x: number, top: number) {
    ctx.strokeStyle = '#7bc043'
    ctx.lineWidth = 2
    for (const dx of [-8, 0, 8]) {
      ctx.beginPath()
      for (let i = 0; i <= 12; i++) {
        const y = top - 4 - i
        const px = x + dx + Math.sin(this.time * 8 + i * 0.6 + dx) * 2
        if (i === 0) ctx.moveTo(px, y)
        else ctx.lineTo(px, y)
      }
      ctx.stroke()
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    const face = this.art.face
    if (!face.complete || face.naturalWidth === 0) return
    // Blink while hurt.
    if (this.hurt > 0 && Math.floor(this.hurt * 12) % 2 === 0) return
    const frameSize = face.naturalHeight
    // Mouth opens wide when food is about to land, and chews after a catch.
    const incoming = this.items.some(
      (i) => i.kind.points > 0 && Math.abs(i.x - this.x) < 50 && PLAYER_Y - i.y > 0 && PLAYER_Y - i.y < 110,
    )
    const frame = incoming ? 2 : this.chew > 0 ? (Math.floor(this.chew * 20) % 2 ? 1 : 0) : 0
    const bob = this.phase === 'playing' ? Math.abs(Math.sin(this.time * 10)) * Math.min(1, Math.abs(this.target - this.x) / 20) * 3 : 0
    ctx.drawImage(
      face,
      frame * frameSize,
      0,
      frameSize,
      frameSize,
      this.x - PLAYER_SIZE / 2,
      PLAYER_Y - PLAYER_SIZE / 2 - bob,
      PLAYER_SIZE,
      PLAYER_SIZE,
    )
  }
}
