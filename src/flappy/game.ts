import { FlappyArt, GROUND_Y, H, TOWER_W, W } from './art'
import { FlappySfx } from './audio'

export { W as WIDTH, H as HEIGHT }

export type Phase = 'menu' | 'ready' | 'playing' | 'dying' | 'gameOver'

export interface Snapshot {
  phase: Phase
  paused: boolean
  muted: boolean
  score: number
  best: number
  newBest: boolean
}

const BEST_KEY = 'flappy-aisha:best'
const GRAVITY = 1400
const FLAP_VELOCITY = -390
const MAX_FALL = 620
const WIZARD_X = 76
const SPACING = 170
const SNITCH_POINTS = 5
// Hitbox around the rider and broom, smaller than the 48×36 sprite.
const HIT = { left: 16, right: 18, top: 11, bottom: 12 }

interface Tower {
  x: number
  gapY: number
  gap: number
  scored: boolean
}

interface Snitch {
  x: number
  y: number
  baseY: number
}

interface Debris {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rot: number
  spin: number
  life: number
}

interface Blast {
  x: number
  y: number
  life: number
}

const DEBRIS_COLORS = ['#6b7390', '#8a93b0', '#3c4260', '#4b5270', '#ffcf5a']
const BLAST_LIFE = 0.4

interface Popup {
  x: number
  y: number
  text: string
  timer: number
}

export class FlappyGame {
  readonly art = new FlappyArt()
  readonly sfx = new FlappySfx()

  phase: Phase = 'menu'
  paused = false
  score = 0
  best = Number(localStorage.getItem(BEST_KEY)) || 0
  newBest = false

  private y = H * 0.42
  private vy = 0
  private time = 0
  private scroll = 0
  private flash = 0
  private towers: Tower[] = []
  private snitches: Snitch[] = []
  private popups: Popup[] = []
  private debris: Debris[] = []
  private blasts: Blast[] = []
  private shake = 0
  private dyingTimer = 0
  private lastSnapshot = ''
  private font = ''
  private listeners = new Set<(snapshot: Snapshot) => void>()

  get snapshot(): Snapshot {
    return {
      phase: this.phase,
      paused: this.paused,
      muted: this.sfx.muted,
      score: this.score,
      best: this.best,
      newBest: this.newBest,
    }
  }

  subscribe(listener: (snapshot: Snapshot) => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  // ---- Controls -----------------------------------------------------------

  /** Self-playing, silent preview that never saves scores. */
  private demo = false
  private demoWait = 0

  startDemo() {
    this.demo = true
    this.sfx.silent = true
    this.newGame()
  }

  /** Demo pilot: flap whenever the wizard sinks below the next gap's centre. */
  private autopilot(dt: number) {
    if (this.phase === 'gameOver' || this.phase === 'ready') {
      this.demoWait += dt
      if (this.demoWait < 0.8) return
      this.demoWait = 0
      if (this.phase === 'gameOver') this.newGame()
      else this.flap()
      return
    }
    if (this.phase !== 'playing') return
    const next = this.towers.find((t) => t.x + TOWER_W > WIZARD_X - HIT.left)
    const target = next ? next.gapY + next.gap * 0.1 : H * 0.45
    if (this.y > target && this.vy > -60) this.flap()
  }

  /** Puts the wizard in the hover state, waiting for the first flap. */
  newGame() {
    this.sfx.unlock()
    this.score = 0
    this.newBest = false
    this.paused = false
    this.y = H * 0.42
    this.vy = 0
    this.towers = []
    this.snitches = []
    this.popups = []
    this.debris = []
    this.blasts = []
    this.phase = 'ready'
    this.emit()
  }

  toMenu() {
    this.newGame()
    this.phase = 'menu'
    this.emit()
  }

  flap() {
    if (this.paused) return
    if (this.phase === 'ready') {
      this.phase = 'playing'
      this.spawnTower(W + 40)
    }
    if (this.phase !== 'playing') return
    this.vy = FLAP_VELOCITY
    this.sfx.flap()
  }

  setPaused(paused: boolean) {
    if (paused && this.phase !== 'playing' && this.phase !== 'ready') return
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
      this.update(dt)
      this.render(ctx, canvas.width / W)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }

  private get speed() {
    return Math.min(118 + this.score * 2.5, 190)
  }

  private get gap() {
    return Math.max(104, 138 - this.score * 1.2)
  }

  private update(dt: number) {
    this.time += dt
    if (this.paused) return
    if (this.demo) this.autopilot(dt)
    this.flash = Math.max(0, this.flash - dt)
    this.shake = Math.max(0, this.shake - dt)
    this.updateDebris(dt)
    this.popups = this.popups.filter((p) => ((p.y -= 30 * dt), (p.timer -= dt) > 0))

    switch (this.phase) {
      case 'menu':
      case 'ready':
        this.scroll += this.speed * dt
        this.y = H * 0.42 + Math.sin(this.time * 3) * 6
        break
      case 'playing':
        this.scroll += this.speed * dt
        this.physics(dt)
        this.moveWorld(dt)
        break
      case 'dying':
        this.physics(dt)
        if (this.y + HIT.bottom >= GROUND_Y) {
          this.y = GROUND_Y - HIT.bottom
          this.dyingTimer -= dt
          if (this.dyingTimer <= 0) this.endGame()
        }
        break
    }
    this.emit()
  }

  private physics(dt: number) {
    this.vy = Math.min(this.vy + GRAVITY * dt, MAX_FALL)
    this.y += this.vy * dt
    if (this.y - HIT.top < 0) {
      this.y = HIT.top
      this.vy = 0
    }
  }

  private moveWorld(dt: number) {
    const dx = this.speed * dt
    for (const t of this.towers) t.x -= dx
    for (const s of this.snitches) {
      s.x -= dx
      s.y = s.baseY + Math.sin(this.time * 4 + s.x * 0.05) * 10
    }
    this.towers = this.towers.filter((t) => t.x + TOWER_W > -20)
    const last = this.towers[this.towers.length - 1]
    if (!last || last.x < W - SPACING) this.spawnTower((last?.x ?? W) + SPACING)

    const left = WIZARD_X - HIT.left
    const right = WIZARD_X + HIT.right
    const top = this.y - HIT.top
    const bottom = this.y + HIT.bottom

    for (const t of this.towers) {
      if (!t.scored && t.x + TOWER_W < left) {
        t.scored = true
        this.addScore(1)
        this.explode(t)
        continue
      }
      const overlapsX = right > t.x && left < t.x + TOWER_W
      if (overlapsX && (top < t.gapY - t.gap / 2 || bottom > t.gapY + t.gap / 2)) return this.crash()
    }

    this.towers = this.towers.filter((t) => !t.scored)

    this.snitches = this.snitches.filter((s) => {
      if (s.x < -20) return false
      if (s.x > left - 6 && s.x < right + 6 && s.y > top - 6 && s.y < bottom + 6) {
        this.addScore(SNITCH_POINTS)
        this.popups.push({ x: s.x, y: s.y, text: `+${SNITCH_POINTS}`, timer: 0.9 })
        this.sfx.snitch()
        return false
      }
      return true
    })

    if (bottom >= GROUND_Y) this.crash()
  }

  private spawnTower(x: number) {
    const gap = this.gap
    const margin = 60
    // The menu preview crops to the middle of the sky, so keep demo gaps near the centre.
    const gapY = this.demo
      ? H * 0.45 + (Math.random() - 0.5) * 60
      : margin + gap / 2 + Math.random() * (GROUND_Y - margin * 2 - gap)
    this.towers.push({ x, gapY, gap, scored: false })
    if (this.score >= 2 && Math.random() < 0.35) {
      const sx = x + TOWER_W + (SPACING - TOWER_W) / 2
      const sy = Math.min(Math.max(gapY + (Math.random() - 0.5) * 60, 40), GROUND_Y - 40)
      this.snitches.push({ x: sx, y: sy, baseY: sy })
    }
  }

  /** Blows a passed tower apart into stone chunks, with a fireball at each battlement. */
  private explode(t: Tower) {
    const top = t.gapY - t.gap / 2
    const bottom = t.gapY + t.gap / 2
    for (const [from, to] of [[0, top], [bottom, GROUND_Y]]) {
      const count = Math.round(((to - from) / H) * 70) + 8
      for (let i = 0; i < count; i++) {
        const y = from + Math.random() * (to - from)
        // Chunks near the gap fly hardest.
        const nearGap = 1 - Math.min(Math.abs(y - t.gapY) / H, 1)
        this.debris.push({
          x: t.x + Math.random() * TOWER_W,
          y,
          vx: (Math.random() - 0.3) * 260 * nearGap + 40,
          vy: (y < t.gapY ? -1 : 1) * Math.random() * 120 - 180 * Math.random() * nearGap,
          size: 3 + Math.floor(Math.random() * 5),
          color: DEBRIS_COLORS[Math.floor(Math.random() * DEBRIS_COLORS.length)],
          rot: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 14,
          life: 0.9 + Math.random() * 0.6,
        })
      }
    }
    const cx = t.x + TOWER_W / 2
    this.blasts.push({ x: cx, y: top, life: BLAST_LIFE }, { x: cx, y: bottom, life: BLAST_LIFE })
    this.shake = 0.2
    this.popups.push({ x: WIZARD_X, y: this.y - 26, text: 'Haha!', timer: 0.8 })
    this.sfx.boom()
    this.sfx.laugh()
  }

  private updateDebris(dt: number) {
    const drift = this.phase === 'playing' ? this.speed * dt : 0
    for (const d of this.debris) {
      d.vy += GRAVITY * 0.7 * dt
      d.x += d.vx * dt - drift
      d.y += d.vy * dt
      d.rot += d.spin * dt
      d.life -= dt
      if (d.y > GROUND_Y - d.size / 2) {
        d.y = GROUND_Y - d.size / 2
        d.vy *= -0.3
        d.vx *= 0.6
      }
    }
    this.debris = this.debris.filter((d) => d.life > 0)
    for (const b of this.blasts) {
      b.x -= drift
      b.life -= dt
    }
    this.blasts = this.blasts.filter((b) => b.life > 0)
  }

  private crash() {
    this.phase = 'dying'
    this.dyingTimer = 0.5
    this.flash = 0.15
    this.vy = Math.min(this.vy, 0)
    this.sfx.hit()
  }

  private endGame() {
    this.phase = 'gameOver'
    if (!this.demo) localStorage.setItem(BEST_KEY, String(this.best))
  }

  private addScore(points: number) {
    this.score += points
    if (this.score > this.best) {
      this.best = this.score
      this.newBest = true
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
    const jolt = this.shake > 0 ? (this.shake / 0.2) * 3 : 0
    ctx.setTransform(scale, 0, 0, scale, (Math.random() - 0.5) * jolt * scale, (Math.random() - 0.5) * jolt * scale)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(art.sky, 0, 0)

    for (const s of art.stars) {
      ctx.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(this.time * 1.5 + s.phase))
      ctx.fillStyle = '#fff4c7'
      ctx.fillRect(s.x, s.y, s.size, s.size)
    }
    ctx.globalAlpha = 1

    const castleX = -((this.scroll * 0.25) % art.castle.width)
    const castleY = GROUND_Y - art.castle.height
    ctx.drawImage(art.castle, castleX, castleY)
    ctx.drawImage(art.castle, castleX + art.castle.width, castleY)

    for (const t of this.towers) art.drawTower(ctx, t.x, t.gapY, t.gap)
    for (const s of this.snitches) art.drawSnitch(ctx, s.x, s.y, this.time)

    for (const b of this.blasts) {
      const p = 1 - b.life / BLAST_LIFE
      const r = 10 + p * 34
      const glow = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r)
      glow.addColorStop(0, `rgba(255, 244, 199, ${1 - p})`)
      glow.addColorStop(0.4, `rgba(255, 170, 40, ${0.9 * (1 - p)})`)
      glow.addColorStop(1, 'rgba(200, 40, 20, 0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    for (const d of this.debris) {
      ctx.globalAlpha = Math.min(1, d.life * 2)
      ctx.save()
      ctx.translate(d.x, d.y)
      ctx.rotate(d.rot)
      ctx.fillStyle = d.color
      ctx.fillRect(-d.size / 2, -d.size / 2, d.size, d.size)
      ctx.restore()
    }
    ctx.globalAlpha = 1

    const groundX = -(this.scroll % W)
    ctx.drawImage(art.ground, groundX, GROUND_Y)

    this.drawWizard(ctx)

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    this.font ||= getComputedStyle(document.documentElement).getPropertyValue('--font-ui')
    const font = this.font
    for (const p of this.demo ? [] : this.popups) {
      ctx.font = `700 14px ${font}`
      ctx.fillStyle = p.text.startsWith('+') ? '#ffd23f' : '#ffffff'
      ctx.fillText(p.text, p.x, p.y)
    }
    if (this.phase === 'ready') {
      ctx.font = `700 16px ${font}`
      ctx.fillStyle = '#ffffff'
      ctx.fillText('Tap or press Space', W / 2, H * 0.62)
    }
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flash / 0.15})`
      ctx.fillRect(0, 0, W, H)
    }
  }

  private drawWizard(ctx: CanvasRenderingContext2D) {
    const img = this.art.wizard
    if (!img.complete || img.naturalWidth === 0) return
    const fw = img.naturalWidth / 3
    const fh = img.naturalHeight
    const flying = this.phase === 'playing' || this.phase === 'ready' || this.phase === 'menu'
    // Flap faster right after a flap; freeze on crash.
    const rate = this.vy < 0 ? 14 : 8
    const frame = flying ? Math.floor(this.time * rate) % 3 : 1
    let angle = 0
    if (this.phase === 'playing' || this.phase === 'dying') {
      angle = Math.min(Math.max(this.vy / 900, -0.35), this.phase === 'dying' ? 1.2 : 0.6)
    }
    ctx.save()
    ctx.translate(WIZARD_X, this.y)
    ctx.rotate(angle)
    ctx.drawImage(img, frame * fw, 0, fw, fh, -fw / 2, -fh / 2, fw, fh)
    ctx.restore()
  }
}
