import { drawFire, drawRoad, GROUND_Y, H, MONEY_POINTS, RacerArt, W, type MoneyKind } from './art'
import { RacerSfx } from './audio'

export { W as WIDTH, H as HEIGHT }

export type Phase = 'menu' | 'countdown' | 'playing' | 'dying' | 'gameOver'

export interface Snapshot {
  phase: Phase
  paused: boolean
  muted: boolean
  score: number
  best: number
  newBest: boolean
  lives: number
  fires: number
}

const BEST_KEY = 'dagracer:best'
export const LIVES = 3
const CAR_X = 56
const CAR_W = 64
const CAR_H = 34
const GRAVITY = 1600
const JUMP_VELOCITY = -560
const JUMP_BUFFER = 0.15
const START_SPEED = 190
const MAX_SPEED = 360
const COUNTDOWN = 2.4
const FIRE_W = 12

interface Fire {
  x: number
  flames: number
  passed: boolean
}

interface Money {
  kind: MoneyKind
  x: number
  y: number
  phase: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  color: string
  size: number
}

interface Popup {
  x: number
  y: number
  text: string
  good: boolean
  timer: number
}

export class RacerGame {
  readonly art = new RacerArt()
  readonly sfx = new RacerSfx()

  phase: Phase = 'menu'
  paused = false
  score = 0
  best = Number(localStorage.getItem(BEST_KEY)) || 0
  newBest = false
  lives = LIVES

  private y = GROUND_Y
  private vy = 0
  private onGround = true
  private jumpQueued = 0
  private spin = 0
  private hurt = 0
  private elapsed = 0
  private scroll = 0
  private time = 0
  private countdown = 0
  private gapLeft = 0
  private fires: Fire[] = []
  private money: Money[] = []
  private particles: Particle[] = []
  private popups: Popup[] = []
  private firesJumped = 0
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
      fires: this.firesJumped,
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
    this.lives = LIVES
    this.newBest = false
    this.firesJumped = 0
    this.y = GROUND_Y
    this.vy = 0
    this.onGround = true
    this.jumpQueued = 0
    this.spin = 0
    this.hurt = 0
    this.elapsed = 0
    this.fires = []
    this.money = []
    this.particles = []
    this.popups = []
    this.gapLeft = 120
    this.countdown = COUNTDOWN
    this.paused = false
    this.phase = 'countdown'
    this.sfx.beep(false)
    this.emit()
  }

  toMenu() {
    this.fires = []
    this.money = []
    this.particles = []
    this.popups = []
    this.y = GROUND_Y
    this.spin = 0
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

  /** Demo driver: jump just before each fire. */
  private autopilot(dt: number) {
    if (this.phase === 'gameOver') {
      this.demoWait += dt
      if (this.demoWait > 0.8) {
        this.demoWait = 0
        this.newGame()
      }
      return
    }
    if (this.phase !== 'playing' || !this.onGround) return
    const front = CAR_X + CAR_W - 6
    const next = this.fires.find((f) => f.x + 3 > front)
    if (next && next.x + 3 - front < this.speed * 0.06 + 4) this.jump()
  }

  jump() {
    if (this.phase !== 'playing' || this.paused) return
    this.jumpQueued = JUMP_BUFFER
  }

  setPaused(paused: boolean) {
    if (this.phase !== 'playing' && this.phase !== 'countdown') return
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
      this.updateEngine()
      this.render(ctx, canvas.width / W)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      this.sfx.setEngine(0)
    }
  }

  private get speed() {
    return Math.min(MAX_SPEED, START_SPEED + this.elapsed * 3.5)
  }

  private updateEngine() {
    if (this.paused) return this.sfx.setEngine(0)
    if (this.phase === 'countdown') return this.sfx.setEngine(0.3 + (1 - this.countdown / COUNTDOWN) * 0.3)
    if (this.phase === 'playing') {
      const revs = (this.speed - START_SPEED) / (MAX_SPEED - START_SPEED)
      return this.sfx.setEngine(0.5 + revs * 0.4 + (this.onGround ? 0 : 0.2))
    }
    this.sfx.setEngine(0)
  }

  private update(dt: number) {
    this.time += dt
    if (this.demo) this.autopilot(dt)
    this.updateEffects(dt)

    if (this.phase === 'countdown') {
      const before = Math.ceil((this.countdown / COUNTDOWN) * 3)
      this.countdown -= dt
      const after = Math.ceil((this.countdown / COUNTDOWN) * 3)
      if (this.countdown <= 0) {
        this.phase = 'playing'
        this.sfx.beep(true)
        this.popups.push({ x: W / 2, y: 110, text: 'GO!', good: true, timer: 0.7 })
      } else if (after !== before) this.sfx.beep(false)
      this.emit()
      return
    }

    if (this.phase === 'dying') {
      this.vy += GRAVITY * dt
      this.y += this.vy * dt
      this.spin += dt * 9
      this.dyingTimer -= dt
      if (this.dyingTimer <= 0) this.finish()
      this.emit()
      return
    }
    if (this.phase !== 'playing') return

    this.elapsed += dt
    const speed = this.speed
    const move = speed * dt
    this.scroll += move
    this.hurt = Math.max(0, this.hurt - dt)

    // Jump, with a short buffer so a press just before landing still counts.
    this.jumpQueued = Math.max(0, this.jumpQueued - dt)
    if (this.jumpQueued > 0 && this.onGround) {
      this.jumpQueued = 0
      this.vy = JUMP_VELOCITY
      this.onGround = false
      this.sfx.jump()
    }
    if (!this.onGround) {
      this.vy += GRAVITY * dt
      this.y += this.vy * dt
      if (this.y >= GROUND_Y) {
        this.y = GROUND_Y
        this.vy = 0
        this.onGround = true
        this.sfx.land()
        this.puff(8, '#c9c2b4')
      }
    } else if (Math.random() < dt * 30) {
      this.particles.push({
        x: CAR_X + 6,
        y: GROUND_Y - 3,
        vx: -speed * 0.4 - Math.random() * 30,
        vy: -Math.random() * 30,
        life: 0.4,
        max: 0.4,
        color: '#c9c2b4',
        size: 2,
      })
    }

    this.gapLeft -= move
    if (this.gapLeft <= 0) this.spawn(speed)

    for (const f of this.fires) f.x -= move
    for (const m of this.money) {
      m.x -= move
      m.phase += dt
    }

    this.checkFires()
    this.checkMoney()
    this.fires = this.fires.filter((f) => f.x + f.flames * FIRE_W > -20)
    this.money = this.money.filter((m) => m.x > -20)
    this.emit()
  }

  private updateEffects(dt: number) {
    for (const p of this.particles) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life -= dt
    }
    this.particles = this.particles.filter((p) => p.life > 0)
    for (const p of this.popups) {
      p.timer -= dt
      p.y -= 40 * dt
    }
    this.popups = this.popups.filter((p) => p.timer > 0)
  }

  private spawn(speed: number) {
    const x = W + 10
    const maxFlames = this.elapsed < 15 ? 1 : this.elapsed < 35 ? 2 : 3
    if (Math.random() < 0.25) {
      // A row of coins on the road.
      const count = 4 + Math.floor(Math.random() * 3)
      for (let i = 0; i < count; i++) this.money.push({ kind: 'coin', x: x + i * 16, y: GROUND_Y - 14, phase: i * 0.3 })
      this.gapLeft = count * 16 + speed * 0.4
      return
    }
    const flames = 1 + Math.floor(Math.random() * maxFlames)
    const width = flames * FIRE_W
    this.fires.push({ x, flames, passed: false })
    // Money arcs over the fire along the jump path; the top prize is sometimes a bill or a money bag.
    const count = 5
    const roll = Math.random()
    const top: MoneyKind = roll < 0.06 ? 'bag' : roll < 0.3 ? 'bill' : 'coin'
    for (let i = 0; i < count; i++) {
      const t = (i - (count - 1) / 2) / ((count + 1) / 2)
      const kind = i === (count - 1) / 2 ? top : 'coin'
      this.money.push({ kind, x: x + width / 2 + (i - (count - 1) / 2) * 18, y: GROUND_Y - 22 - 54 * (1 - t * t), phase: i * 0.3 })
    }
    this.gapLeft = width + speed * (0.8 + Math.random() * 0.7) + 110
  }

  private carBox(pad = 0) {
    return { left: CAR_X + 6 - pad, right: CAR_X + CAR_W - 6 + pad, top: this.y - 22 - pad, bottom: this.y + pad }
  }

  private checkFires() {
    const car = this.carBox()
    for (const f of this.fires) {
      const left = f.x + 3
      const right = f.x + f.flames * FIRE_W - 3
      if (!f.passed && right < car.left) {
        f.passed = true
        this.firesJumped++
      }
      if (this.hurt > 0 || f.passed) continue
      if (car.right > left && car.left < right && car.bottom > GROUND_Y - 18) this.burn()
    }
  }

  private burn() {
    this.lives--
    this.puff(14, '#4a4850')
    this.popups.push({ x: CAR_X + 32, y: this.y - 44, text: 'Hot!', good: false, timer: 0.8 })
    if (this.lives <= 0) {
      this.phase = 'dying'
      this.dyingTimer = 1.6
      this.vy = -520
      this.onGround = false
      this.sfx.crash()
      return
    }
    this.hurt = 1.6
    this.sfx.burn()
  }

  private checkMoney() {
    const car = this.carBox(6)
    this.money = this.money.filter((m) => {
      const sprite = this.art.money[m.kind]
      const hit =
        m.x + sprite.width / 2 > car.left &&
        m.x - sprite.width / 2 < car.right &&
        m.y + sprite.height / 2 > car.top &&
        m.y - sprite.height / 2 < car.bottom
      if (!hit) return true
      const points = MONEY_POINTS[m.kind]
      this.score += points
      this.popups.push({ x: m.x, y: m.y - 10, text: `+$${points}`, good: true, timer: 0.6 })
      for (let i = 0; i < 6; i++) {
        this.particles.push({
          x: m.x,
          y: m.y,
          vx: (Math.random() - 0.5) * 120,
          vy: (Math.random() - 0.5) * 120,
          life: 0.35,
          max: 0.35,
          color: '#ffd23f',
          size: 2,
        })
      }
      if (m.kind === 'bag') this.sfx.bag()
      else if (m.kind === 'bill') this.sfx.cash()
      else this.sfx.coin()
      return false
    })
  }

  private puff(count: number, color: string) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: CAR_X + 10 + Math.random() * 44,
        y: this.y - Math.random() * 10,
        vx: (Math.random() - 0.5) * 120,
        vy: -Math.random() * 80,
        life: 0.5,
        max: 0.5,
        color,
        size: 3,
      })
    }
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
    const art = this.art
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(art.sky, 0, 0)
    for (const [layer, rate] of [
      [art.hills, 0.15],
      [art.trees, 0.5],
    ] as const) {
      const off = -Math.round((this.scroll * rate) % W)
      ctx.drawImage(layer, off, 0)
      ctx.drawImage(layer, off + W, 0)
    }
    drawRoad(ctx, this.scroll)

    for (const f of this.fires) drawFire(ctx, f.x, f.flames, this.time)

    for (const m of this.money) {
      const sprite = art.money[m.kind]
      const bob = Math.sin(m.phase * 5) * 2
      // Coins spin by squashing horizontally.
      const squash = m.kind === 'coin' ? Math.max(0.2, Math.abs(Math.cos(m.phase * 4))) : 1
      const w = Math.max(2, Math.round(sprite.width * squash))
      ctx.drawImage(sprite, Math.round(m.x - w / 2), Math.round(m.y - sprite.height / 2 + bob), w, sprite.height)
    }

    for (const p of this.particles) {
      ctx.globalAlpha = p.life / p.max
      ctx.fillStyle = p.color
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size)
    }
    ctx.globalAlpha = 1

    if (this.phase !== 'menu') this.drawCar(ctx)
    else this.drawCar(ctx, true)

    this.font ||= getComputedStyle(document.documentElement).getPropertyValue('--font-ui')
    ctx.textAlign = 'center'
    if (this.phase === 'countdown') {
      const n = Math.ceil((this.countdown / COUNTDOWN) * 3)
      const pulse = 1 + ((this.countdown / COUNTDOWN) * 3 - (n - 1)) * 0.3
      ctx.font = `700 ${Math.round(56 * pulse)}px ${this.font}`
      this.outlinedText(ctx, String(n), W / 2, 120, '#ffd23f')
    }
    for (const p of this.demo ? [] : this.popups) {
      ctx.globalAlpha = Math.min(1, p.timer * 3)
      ctx.font = p.text === 'GO!' ? `700 56px ${this.font}` : `700 14px ${this.font}`
      this.outlinedText(ctx, p.text, p.x, p.y, p.good ? '#ffd23f' : '#ff6b4a')
    }
    ctx.globalAlpha = 1
  }

  private outlinedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
    ctx.lineWidth = 4
    ctx.strokeStyle = '#000000'
    ctx.strokeText(text, x, y)
    ctx.fillStyle = color
    ctx.fillText(text, x, y)
  }

  private drawCar(ctx: CanvasRenderingContext2D, idle = false) {
    const car = this.art.car
    if (!car.complete || car.naturalWidth === 0) return
    if (this.hurt > 0 && Math.floor(this.hurt * 12) % 2 === 0) return
    const rolling = this.onGround && (this.phase === 'playing' || this.phase === 'countdown') && !idle
    const frame = rolling ? Math.floor(this.time * (this.phase === 'playing' ? 16 : 6)) % 4 : 0
    // Nose up while rising, down while falling; tumbling when crashed.
    const tilt = this.phase === 'dying' ? this.spin : Math.max(-0.25, Math.min(0.25, this.vy / 1800))
    // Small idle rumble during the countdown.
    const rumble = this.phase === 'countdown' ? Math.round(Math.sin(this.time * 40)) * 0.5 : 0
    ctx.save()
    ctx.translate(CAR_X + CAR_W / 2, this.y - CAR_H / 2 + rumble)
    ctx.rotate(tilt)
    ctx.drawImage(car, frame * CAR_W, 0, CAR_W, CAR_H, -CAR_W / 2, -CAR_H / 2, CAR_W, CAR_H)
    ctx.restore()
  }
}
