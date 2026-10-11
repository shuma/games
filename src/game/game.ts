import { Sfx } from './audio'
import { Ghost, type GhostContext, type GhostName } from './ghost'
import { BONUS_POS, COLS, Maze, ROWS, wrapCol } from './maze'
import { VEC, type Dir } from './movement'
import { Player } from './player'
import { drawGhost, renderMaze, Sprites, TILE, type BonusKind } from './sprites'

export const WIDTH = COLS * TILE
export const HEIGHT = ROWS * TILE

export type Phase = 'menu' | 'ready' | 'playing' | 'dying' | 'levelComplete' | 'gameOver'

export interface Snapshot {
  phase: Phase
  paused: boolean
  muted: boolean
  score: number
  highScore: number
  newHighScore: boolean
  level: number
  lives: number
}

const HIGH_SCORE_KEY = 'adam-man:high-score'
const BASE_SPEED = 9.47 // tiles per second at 100%
const START_LIVES = 3
const EXTRA_LIFE_AT = 10_000
const FRIGHT_SECONDS = [6, 5, 4, 3, 2, 5, 2, 2, 1, 5, 2, 1, 1, 3, 1, 1, 0, 1]
const DEATH_FREEZE = 0.5
const DEATH_SPIN = 1.7
const GLOBAL_RELEASE: Record<GhostName, number> = { blinky: 0, pinky: 7, inky: 17, clyde: 32 }

function levelSpec(level: number) {
  const tier = level === 1 ? 0 : level < 5 ? 1 : 2
  return {
    pac: (level >= 21 ? 0.9 : [0.8, 0.9, 1][tier]) * BASE_SPEED,
    pacFright: [0.9, 0.95, 1][tier] * BASE_SPEED,
    ghost: [0.75, 0.85, 0.95][tier] * BASE_SPEED,
    ghostFright: [0.5, 0.55, 0.6][tier] * BASE_SPEED,
    tunnel: [0.4, 0.45, 0.5][tier] * BASE_SPEED,
    elroy: [0.8, 0.9, 1][tier] * BASE_SPEED,
    elroyDots: 20 + 10 * Math.min(level - 1, 4),
    fright: FRIGHT_SECONDS[level - 1] ?? 0,
    // Alternating scatter/chase durations, starting with scatter.
    modes:
      tier === 0
        ? [7, 20, 7, 20, 5, 20, 5, Infinity]
        : tier === 1
          ? [7, 20, 7, 20, 5, 1033, 1 / 60, Infinity]
          : [5, 20, 5, 20, 5, 1037, 1 / 60, Infinity],
    releaseDots: { blinky: 0, pinky: 0, inky: level === 1 ? 30 : 0, clyde: level === 1 ? 60 : level === 2 ? 50 : 0 },
    idleRelease: level < 5 ? 4 : 3,
  }
}

interface Popup {
  x: number
  y: number
  text: string
  timer: number
}

interface Palette {
  background: string
  wallFill: string
  wallEdge: string
  door: string
  ready: string
  danger: string
  popup: string
  font: string
}

function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement)
  const v = (name: string) => css.getPropertyValue(name).trim()
  return {
    background: v('--neutral-1'),
    wallFill: v('--color-2'),
    wallEdge: v('--color-4'),
    door: v('--color-3'),
    ready: v('--warning'),
    danger: v('--error'),
    popup: v('--color-4'),
    font: v('--font-ui'),
  }
}

export class Game {
  readonly maze = new Maze()
  readonly player = new Player()
  readonly ghosts = (['blinky', 'pinky', 'inky', 'clyde'] as const).map((n) => new Ghost(n))
  readonly sprites = new Sprites()
  readonly sfx = new Sfx()

  phase: Phase = 'menu'
  paused = false
  level = 1
  score = 0
  lives = START_LIVES
  highScore = Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0
  newHighScore = false

  private spec = levelSpec(1)
  private time = 0
  private phaseTimer = 0
  private modeIndex = 0
  private modeTimer = 0
  private frightTimer = 0
  private combo = 0
  private freeze = 0
  private popups: Popup[] = []
  private bonus: { kind: BonusKind; timer: number } | null = null
  private eatenThisLevel = 0
  private extraLifeGiven = false
  private dotCounter = 0
  private idleTimer = 0
  private globalCounter: number | null = null
  private palette = readPalette()
  private mazeCanvas = renderMaze(this.maze, { fill: this.palette.wallFill, edge: this.palette.wallEdge, door: this.palette.door })
  private flashCanvas = renderMaze(this.maze, { fill: this.palette.background, edge: '#ffffff', door: this.palette.background })
  /** Self-playing, silent preview that never saves scores. */
  private demo = false
  private demoThink = 0
  private lastSnapshot = ''
  private listeners = new Set<(snapshot: Snapshot) => void>()

  get snapshot(): Snapshot {
    return {
      phase: this.phase,
      paused: this.paused,
      muted: this.sfx.muted,
      score: this.score,
      highScore: this.highScore,
      newHighScore: this.newHighScore,
      level: this.level,
      lives: this.lives,
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
    this.level = 1
    this.score = 0
    this.lives = START_LIVES
    this.extraLifeGiven = false
    this.newHighScore = false
    this.paused = false
    this.maze.reset()
    this.startLevel(true)
    this.emit()
  }

  toMenu() {
    this.saveHighScore()
    this.phase = 'menu'
    this.paused = false
    this.level = 1
    this.maze.reset()
    this.spec = levelSpec(1)
    this.resetActors()
    this.emit()
  }

  startDemo() {
    this.demo = true
    this.sfx.silent = true
    this.newGame()
  }

  setDirection(dir: Dir) {
    this.player.nextDir = dir
  }

  get pausable() {
    return this.phase === 'ready' || this.phase === 'playing' || this.phase === 'dying' || this.phase === 'levelComplete'
  }

  setPaused(paused: boolean) {
    if (paused && !this.pausable) return
    this.paused = paused
    if (paused) this.saveHighScore()
    this.emit()
  }

  setMuted(muted: boolean) {
    this.sfx.setMuted(muted)
    this.emit()
  }

  // ---- Loop ---------------------------------------------------------------

  /** Starts the render loop on `canvas`; returns a stop function. */
  attach(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')!
    let last = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now
      this.update(dt)
      this.render(ctx, canvas.width / WIDTH)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }

  private update(dt: number) {
    this.time += dt
    if (this.paused) return
    if (this.demo) this.autopilot(dt)
    switch (this.phase) {
      case 'ready':
        this.phaseTimer -= dt
        if (this.phaseTimer <= 0) this.phase = 'playing'
        break
      case 'playing':
        this.tick(dt)
        break
      case 'dying':
        this.phaseTimer -= dt
        if (this.phaseTimer <= 0) {
          this.lives--
          if (this.lives <= 0) {
            this.phase = 'gameOver'
            this.saveHighScore()
          } else {
            this.resetActors()
            this.globalCounter = 0
            this.phase = 'ready'
            this.phaseTimer = 2
          }
        }
        break
      case 'levelComplete':
        this.phaseTimer -= dt
        if (this.phaseTimer <= 0) {
          this.level++
          this.maze.reset()
          this.startLevel(false)
        }
        break
    }
    this.emit()
  }

  /** Demo player: head for the nearest food along paths that keep clear of dangerous ghosts. */
  private autopilot(dt: number) {
    if (this.phase === 'gameOver') {
      this.newGame()
      return
    }
    this.demoThink -= dt
    if (this.phase !== 'playing' || this.demoThink > 0) return
    this.demoThink = 0.08
    const start = { c: Math.round(this.player.x), r: Math.round(this.player.y) }
    const danger = this.ghosts
      .filter((g) => g.state === 'active' && !g.frightened)
      .map((g) => ({ c: Math.round(g.x), r: Math.round(g.y) }))
    const unsafe = (c: number, r: number) => danger.some((g) => Math.abs(g.c - c) + Math.abs(g.r - r) <= 2)
    const seen = new Set([`${start.c},${start.r}`])
    const queue: { c: number; r: number; first: Dir }[] = []
    for (const dir of ['up', 'down', 'left', 'right'] as const) {
      const c = wrapCol(start.c + VEC[dir].x)
      const r = start.r + VEC[dir].y
      if (!this.maze.walkable(c, r) || unsafe(c, r)) continue
      seen.add(`${c},${r}`)
      queue.push({ c, r, first: dir })
    }
    while (queue.length) {
      const { c, r, first } = queue.shift()!
      const tile = this.maze.get(c, r)
      if (tile === '.' || tile === 'o') {
        this.player.nextDir = first
        return
      }
      for (const dir of ['up', 'down', 'left', 'right'] as const) {
        const nc = wrapCol(c + VEC[dir].x)
        const nr = r + VEC[dir].y
        const key = `${nc},${nr}`
        if (seen.has(key) || !this.maze.walkable(nc, nr) || unsafe(nc, nr)) continue
        seen.add(key)
        queue.push({ c: nc, r: nr, first })
      }
    }
  }

  private startLevel(first: boolean) {
    this.spec = levelSpec(this.level)
    this.eatenThisLevel = 0
    this.bonus = null
    this.dotCounter = 0
    this.globalCounter = null
    this.resetActors()
    this.phase = 'ready'
    this.phaseTimer = first ? 4.2 : 2
    if (first) this.sfx.start()
  }

  private resetActors() {
    this.player.reset()
    this.ghosts.forEach((g) => g.reset())
    this.modeIndex = 0
    this.modeTimer = this.spec.modes[0]
    this.frightTimer = 0
    this.combo = 0
    this.freeze = 0
    this.popups = []
    this.idleTimer = 0
  }

  private tick(dt: number) {
    this.popups = this.popups.filter((p) => (p.timer -= dt) > 0)
    if (this.freeze > 0) {
      this.freeze -= dt
      return
    }

    if (this.frightTimer > 0) {
      this.frightTimer -= dt
      if (this.frightTimer <= 0) this.ghosts.forEach((g) => (g.frightened = false))
    } else {
      this.modeTimer -= dt
      if (this.modeTimer <= 0 && this.modeIndex < this.spec.modes.length - 1) {
        this.modeIndex++
        this.modeTimer = this.spec.modes[this.modeIndex]
        this.ghosts.forEach((g) => g.flip())
      }
    }

    const frightened = this.frightTimer > 0
    this.player.update(dt, frightened ? this.spec.pacFright : this.spec.pac, this.maze)
    const eaten = this.maze.eat(Math.round(this.player.x), Math.round(this.player.y))
    if (eaten) this.handleEat(eaten)
    else this.idleTimer += dt

    this.updateReleases()

    const elroy = this.maze.remaining <= this.spec.elroyDots && this.ghosts.every((g) => g.state !== 'house')
    const ctx: GhostContext = {
      maze: this.maze,
      player: this.player,
      blinky: this.ghosts[0],
      scatter: this.modeIndex % 2 === 0,
      speeds: {
        ghost: this.spec.ghost,
        fright: this.spec.ghostFright,
        tunnel: this.spec.tunnel,
        elroy: elroy ? this.spec.elroy : 0,
      },
    }
    this.ghosts.forEach((g) => g.update(dt, ctx))

    if (this.bonus) {
      this.bonus.timer -= dt
      if (this.bonus.timer <= 0) this.bonus = null
      else if (Math.abs(this.player.x - BONUS_POS.x) < 0.6 && Math.abs(this.player.y - BONUS_POS.y) < 0.6) {
        this.addScore(this.bonus.kind.points)
        this.popups.push({ ...BONUS_POS, text: String(this.bonus.kind.points), timer: 2 })
        this.sfx.bonus()
        this.bonus = null
      }
    }

    if (this.checkCollisions()) return

    if (this.maze.remaining === 0) {
      this.phase = 'levelComplete'
      this.phaseTimer = 2.4
      this.sfx.levelClear()
    }
  }

  private handleEat(kind: 'pizza' | 'burger') {
    this.idleTimer = 0
    this.eatenThisLevel++
    if (this.globalCounter !== null) this.globalCounter++
    else this.dotCounter++

    if (kind === 'pizza') {
      this.addScore(10)
      this.sfx.chomp()
    } else {
      this.addScore(50)
      this.sfx.burger()
      this.combo = 0
      this.frightTimer = this.spec.fright
      this.ghosts.forEach((g) => (this.spec.fright > 0 ? g.frighten() : g.flip()))
    }

    if (this.eatenThisLevel === 70 || this.eatenThisLevel === 170) {
      this.bonus = { kind: this.sprites.bonusForLevel(this.level), timer: 9.5 }
    }
  }

  private updateReleases() {
    const waiting = this.ghosts.filter((g) => g.state === 'house')
    if (waiting.length === 0) {
      this.globalCounter = null
      return
    }
    if (this.idleTimer >= this.spec.idleRelease) {
      this.idleTimer = 0
      waiting[0].release()
      return
    }
    if (this.globalCounter !== null) {
      for (const g of waiting) if (this.globalCounter >= GLOBAL_RELEASE[g.name]) g.release()
    } else if (this.dotCounter >= this.spec.releaseDots[waiting[0].name]) {
      waiting[0].release()
      this.dotCounter = 0
    }
  }

  /** Returns true when the player died. */
  private checkCollisions() {
    const p = this.player
    for (const g of this.ghosts) {
      if (!g.roaming) continue
      let dx = Math.abs(g.x - p.x)
      if (dx > COLS / 2) dx = COLS - dx
      if (dx > 0.6 || Math.abs(g.y - p.y) > 0.6) continue
      if (g.frightened) {
        g.eat()
        this.combo++
        const points = 200 * 2 ** (this.combo - 1)
        this.addScore(points)
        this.popups.push({ x: g.x, y: g.y, text: String(points), timer: 1 })
        this.sfx.eatGhost()
        this.freeze = 0.6
      } else {
        this.phase = 'dying'
        this.phaseTimer = DEATH_FREEZE + DEATH_SPIN
        this.sfx.death()
        return true
      }
    }
    return false
  }

  private addScore(points: number) {
    this.score += points
    if (!this.extraLifeGiven && this.score >= EXTRA_LIFE_AT) {
      this.extraLifeGiven = true
      this.lives++
      this.sfx.extraLife()
    }
    if (this.score > this.highScore) {
      this.highScore = this.score
      this.newHighScore = true
    }
  }

  private saveHighScore() {
    if (this.demo) return
    localStorage.setItem(HIGH_SCORE_KEY, String(this.highScore))
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
    const pal = this.palette
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    ctx.fillStyle = pal.background
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

    const flash =
      this.phase === 'levelComplete' && this.phaseTimer < 2 && Math.floor(this.phaseTimer * 4) % 2 === 0
    ctx.drawImage(flash ? this.flashCanvas : this.mazeCanvas, 0, 0)

    ctx.imageSmoothingEnabled = false
    const pulse = 1 + 0.12 * Math.sin(this.time * 6)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = this.maze.tiles[r][c]
        if (t === '.') this.drawCentered(ctx, this.sprites.pizza, c, r, 1)
        else if (t === 'o') this.drawCentered(ctx, this.sprites.burger, c, r, pulse)
      }
    }
    if (this.bonus) this.drawCentered(ctx, this.bonus.kind.sprite, BONUS_POS.x, BONUS_POS.y, 1)

    const showGhosts =
      this.phase !== 'menu' &&
      this.phase !== 'gameOver' &&
      this.phase !== 'levelComplete' &&
      !(this.phase === 'dying' && this.phaseTimer < DEATH_SPIN)
    if (showGhosts) {
      for (const g of this.ghosts) {
        const eyesOnly = g.state === 'eaten' || g.state === 'entering'
        const flashing = g.frightened && this.frightTimer < 2 && Math.floor(this.time * 5) % 2 === 0
        drawGhost(
          ctx,
          this.sprites,
          (g.x + 0.5) * TILE,
          (g.y + 0.5) * TILE,
          { color: g.color, dir: g.dir, frightened: g.frightened && !eyesOnly, flashing, eyesOnly },
          this.time,
        )
      }
    }

    if (this.phase !== 'gameOver') this.drawPlayer(ctx)

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const p of this.demo ? [] : this.popups) {
      ctx.font = `700 14px ${pal.font}`
      ctx.fillStyle = pal.popup
      ctx.fillText(p.text, (p.x + 0.5) * TILE, (p.y + 0.5) * TILE)
    }
    const banner = (text: string, color: string) => {
      ctx.font = `700 22px ${pal.font}`
      ctx.fillStyle = color
      ctx.fillText(text, WIDTH / 2, (BONUS_POS.y + 0.5) * TILE)
    }
    if (this.phase === 'ready') banner(this.level > 1 && this.phaseTimer > 1 ? `Level ${this.level}` : 'Ready!', pal.ready)
    if (this.phase === 'gameOver') banner('Game over', pal.danger)
  }

  private drawCentered(ctx: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, x: number, y: number, s: number) {
    const w = img.width * s
    const h = img.height * s
    ctx.drawImage(img, (x + 0.5) * TILE - w / 2, (y + 0.5) * TILE - h / 2, w, h)
  }

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    const face = this.sprites.face
    if (!face.complete || face.naturalWidth === 0) return
    const p = this.player
    const frameSize = face.naturalHeight
    let frame = p.frame
    let size = TILE * 1.6
    let angle = { left: -0.12, right: 0.12, up: 0, down: 0, none: 0 }[p.facing]
    let squashY = p.facing === 'up' ? 0.94 : p.facing === 'down' ? 1.04 : 1

    if (this.phase === 'dying') {
      const t = Math.max(0, 1 - this.phaseTimer / DEATH_SPIN)
      frame = 2
      angle = t * Math.PI * 4
      size *= 1 - t
      squashY = 1
      if (size <= 0.5) return
    } else if (this.phase === 'ready' || this.phase === 'menu') {
      frame = 0
    }

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    for (const offset of [0, -COLS, COLS]) {
      const px = (p.x + offset + 0.5) * TILE
      if (px < -size || px > WIDTH + size) continue
      ctx.save()
      ctx.translate(px, (p.y + 0.5) * TILE)
      ctx.rotate(angle)
      ctx.scale(1, squashY)
      ctx.drawImage(face, frame * frameSize, 0, frameSize, frameSize, -size / 2, -size / 2, size, size)
      ctx.restore()
    }
  }
}
