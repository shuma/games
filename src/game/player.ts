import { PLAYER_START, type Maze } from './maze'
import { advance, OPPOSITE, VEC, type Dir } from './movement'

export class Player {
  x = PLAYER_START.x
  y = PLAYER_START.y
  dir: Dir = 'left'
  nextDir: Dir = 'none'
  facing: Dir = 'left'
  /** Distance travelled, drives the chomp animation. */
  travelled = 0

  reset() {
    this.x = PLAYER_START.x
    this.y = PLAYER_START.y
    this.dir = 'left'
    this.nextDir = 'none'
    this.facing = 'left'
    this.travelled = 0
  }

  get moving() {
    return this.dir !== 'none'
  }

  update(dt: number, speed: number, maze: Maze) {
    if (this.nextDir !== 'none' && this.nextDir === OPPOSITE[this.dir]) {
      this.dir = this.nextDir
    }
    const before = { x: this.x, y: this.y }
    advance(
      this,
      speed * dt,
      (c, r) => maze.walkable(c, r),
      (m) => {
        if (this.nextDir !== 'none') {
          const n = VEC[this.nextDir]
          if (maze.walkable(m.x + n.x, m.y + n.y)) this.dir = this.nextDir
        }
        const v = VEC[this.dir]
        if (this.dir !== 'none' && !maze.walkable(m.x + v.x, m.y + v.y)) this.dir = 'none'
        return true
      },
    )
    if (this.dir !== 'none') this.facing = this.dir
    const dx = Math.abs(this.x - before.x)
    this.travelled += (dx > 1 ? 0 : dx) + Math.abs(this.y - before.y)
  }

  /** Chomp cycle 0 → 1 → 2 → 1 over each tile travelled; closed smile when stopped. */
  get frame() {
    if (!this.moving) return 0
    return [0, 1, 2, 1][Math.floor(this.travelled * 4) % 4]
  }
}
