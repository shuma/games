import { HOUSE_CENTER, HOUSE_DOOR, isTunnel, wrapCol, type Maze } from './maze'
import { advance, moveToward, OPPOSITE, VEC, type Dir } from './movement'
import type { Player } from './player'

export type GhostName = 'blinky' | 'pinky' | 'inky' | 'clyde'
export type GhostState = 'house' | 'leaving' | 'active' | 'eaten' | 'entering'

export interface GhostContext {
  maze: Maze
  player: Player
  blinky: Ghost
  scatter: boolean
  speeds: { ghost: number; fright: number; tunnel: number; elroy: number }
}

const EYES_SPEED = 15
const HOUSE_SPEED = 3
const LEAVE_SPEED = 4.5
const CHOICE_ORDER: Dir[] = ['up', 'left', 'down', 'right']

const SPECS: Record<GhostName, { color: string; corner: [number, number]; homeX: number }> = {
  blinky: { color: '#ff3b30', corner: [25, -3], homeX: 13.5 },
  pinky: { color: '#ffb8ff', corner: [2, -3], homeX: 13.5 },
  inky: { color: '#00e5ff', corner: [27, 31], homeX: 11.5 },
  clyde: { color: '#ffb852', corner: [0, 31], homeX: 15.5 },
}

export class Ghost {
  readonly name: GhostName
  readonly color: string
  x = 0
  y = 0
  dir: Dir = 'left'
  state: GhostState = 'house'
  frightened = false
  private reverse = false
  private bobDir: Dir = 'up'

  constructor(name: GhostName) {
    this.name = name
    this.color = SPECS[name].color
    this.reset()
  }

  reset() {
    this.frightened = false
    this.reverse = false
    if (this.name === 'blinky') {
      this.x = HOUSE_DOOR.x
      this.y = HOUSE_DOOR.y
      this.state = 'active'
      this.dir = 'left'
    } else {
      this.x = SPECS[this.name].homeX
      this.y = HOUSE_CENTER.y
      this.state = 'house'
      this.dir = this.name === 'pinky' ? 'down' : 'up'
      this.bobDir = this.dir
    }
  }

  release() {
    if (this.state === 'house') this.state = 'leaving'
  }

  /** Reverse direction at the next update (mode change or burger eaten). */
  flip() {
    if (this.state === 'active') this.reverse = true
  }

  frighten() {
    if (this.state === 'eaten' || this.state === 'entering') return
    this.frightened = true
    this.flip()
  }

  eat() {
    this.frightened = false
    this.state = 'eaten'
  }

  get roaming() {
    return this.state === 'active'
  }

  update(dt: number, ctx: GhostContext) {
    switch (this.state) {
      case 'house': {
        const top = HOUSE_CENTER.y - 0.4
        const bottom = HOUSE_CENTER.y + 0.4
        this.y += (this.bobDir === 'up' ? -1 : 1) * HOUSE_SPEED * 0.5 * dt
        if (this.y <= top) {
          this.y = top
          this.bobDir = 'down'
        } else if (this.y >= bottom) {
          this.y = bottom
          this.bobDir = 'up'
        }
        this.dir = this.bobDir
        return
      }
      case 'leaving': {
        const speed = this.frightened ? LEAVE_SPEED * 0.6 : LEAVE_SPEED
        if (moveToward(this, HOUSE_CENTER.x, HOUSE_DOOR.y, speed * dt)) {
          this.state = 'active'
          this.dir = 'left'
        }
        return
      }
      case 'entering': {
        if (moveToward(this, HOUSE_CENTER.x, HOUSE_CENTER.y, EYES_SPEED * 0.5 * dt)) {
          this.state = 'leaving'
        }
        return
      }
      default:
        this.roam(dt, ctx)
    }
  }

  private roam(dt: number, ctx: GhostContext) {
    if (this.reverse) {
      this.reverse = false
      this.dir = OPPOSITE[this.dir]
    }
    const eaten = this.state === 'eaten'
    let speed = ctx.speeds.ghost
    if (eaten) speed = EYES_SPEED
    else if (isTunnel(wrapCol(Math.round(this.x)), Math.round(this.y))) speed = ctx.speeds.tunnel
    else if (this.frightened) speed = ctx.speeds.fright
    else if (this.name === 'blinky') speed = Math.max(speed, ctx.speeds.elroy)

    advance(
      this,
      speed * dt,
      (c, r) => ctx.maze.walkable(c, r),
      (m) => {
        if (eaten && m.y === HOUSE_DOOR.y && (m.x === 13 || m.x === 14)) {
          this.state = 'entering'
          return false
        }
        this.dir = this.choose(ctx)
        return true
      },
    )
  }

  private choose(ctx: GhostContext): Dir {
    const options = CHOICE_ORDER.filter((d) => {
      if (d === OPPOSITE[this.dir]) return false
      const v = VEC[d]
      return ctx.maze.walkable(this.x + v.x, this.y + v.y)
    })
    if (options.length === 0) return OPPOSITE[this.dir]
    if (this.frightened && this.state === 'active') {
      return options[Math.floor(Math.random() * options.length)]
    }
    const [tx, ty] = this.target(ctx)
    let best = options[0]
    let bestDist = Infinity
    for (const d of options) {
      const v = VEC[d]
      const dx = this.x + v.x - tx
      const dy = this.y + v.y - ty
      const dist = dx * dx + dy * dy
      if (dist < bestDist) {
        bestDist = dist
        best = d
      }
    }
    return best
  }

  private target(ctx: GhostContext): [number, number] {
    if (this.state === 'eaten') return [13, HOUSE_DOOR.y]
    const p = ctx.player
    const px = Math.round(p.x)
    const py = Math.round(p.y)
    const elroy = this.name === 'blinky' && ctx.speeds.elroy > 0
    if (ctx.scatter && !elroy) return SPECS[this.name].corner
    const f = VEC[p.facing]
    switch (this.name) {
      case 'blinky':
        return [px, py]
      case 'pinky':
        return [px + f.x * 4, py + f.y * 4]
      case 'inky': {
        const ax = px + f.x * 2
        const ay = py + f.y * 2
        return [ax * 2 - Math.round(ctx.blinky.x), ay * 2 - Math.round(ctx.blinky.y)]
      }
      case 'clyde': {
        const dx = this.x - px
        const dy = this.y - py
        return dx * dx + dy * dy > 64 ? [px, py] : SPECS.clyde.corner
      }
    }
  }
}
