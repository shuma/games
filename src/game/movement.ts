import { COLS, ROWS } from './maze'

export type Dir = 'up' | 'down' | 'left' | 'right' | 'none'

export const VEC: Record<Dir, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  none: { x: 0, y: 0 },
}

export const OPPOSITE: Record<Dir, Dir> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
  none: 'none',
}

export interface Mover {
  x: number
  y: number
  dir: Dir
}

const EPS = 1e-6

export function isAtCenter(m: Mover) {
  return Math.abs(m.x - Math.round(m.x)) < EPS && Math.abs(m.y - Math.round(m.y)) < EPS
}

/**
 * Moves `m` along its direction by `dist` tiles. Positions are in tile units with
 * integers at tile centers. `onCenter` runs at every tile center reached and may
 * change `m.dir`; returning false stops movement for this step.
 */
export function advance(
  m: Mover,
  dist: number,
  canEnter: (c: number, r: number) => boolean,
  onCenter: (m: Mover) => boolean,
) {
  for (let i = 0; i < 16 && dist > EPS; i++) {
    if (isAtCenter(m)) {
      m.x = Math.round(m.x)
      m.y = Math.round(m.y)
      if (!onCenter(m)) return
      const v = VEC[m.dir]
      if (m.dir === 'none' || !canEnter(m.x + v.x, m.y + v.y)) return
    }
    if (m.dir === 'none') return
    const v = VEC[m.dir]
    if (v.x !== 0) {
      const tx = v.x > 0 ? Math.floor(m.x + EPS) + 1 : Math.ceil(m.x - EPS) - 1
      const d = Math.abs(tx - m.x)
      if (dist >= d) {
        m.x = tx
        dist -= d
      } else {
        m.x += v.x * dist
        dist = 0
      }
      if (m.x <= -1) m.x += COLS
      else if (m.x >= COLS) m.x -= COLS
    } else {
      const ty = v.y > 0 ? Math.floor(m.y + EPS) + 1 : Math.ceil(m.y - EPS) - 1
      const d = Math.abs(ty - m.y)
      if (dist >= d) {
        m.y = ty
        dist -= d
      } else {
        m.y += v.y * dist
        dist = 0
      }
      m.y = Math.min(Math.max(m.y, 0), ROWS - 1)
    }
  }
}

/** Straight-line scripted move (ghost house): x first, then y. Returns true on arrival. */
export function moveToward(m: Mover, tx: number, ty: number, dist: number) {
  if (m.x !== tx) {
    const d = tx - m.x
    const step = Math.min(Math.abs(d), dist)
    m.x += Math.sign(d) * step
    m.dir = d > 0 ? 'right' : 'left'
    dist -= step
  }
  if (m.x === tx && m.y !== ty && dist > 0) {
    const d = ty - m.y
    const step = Math.min(Math.abs(d), dist)
    m.y += Math.sign(d) * step
    m.dir = d > 0 ? 'down' : 'up'
  }
  return m.x === tx && m.y === ty
}
