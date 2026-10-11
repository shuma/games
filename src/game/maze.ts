export const COLS = 28
export const ROWS = 31

// # wall  . pizza  o burger  - ghost-house door  (space) empty
const LAYOUT = [
  '############################',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#o####.#####.##.#####.####o#',
  '#.####.#####.##.#####.####.#',
  '#..........................#',
  '#.####.##.########.##.####.#',
  '#.####.##.########.##.####.#',
  '#......##....##....##......#',
  '######.##### ## #####.######',
  '     #.##### ## #####.#     ',
  '     #.##          ##.#     ',
  '     #.## ###--### ##.#     ',
  '######.## #      # ##.######',
  '      .   #      #   .      ',
  '######.## #      # ##.######',
  '     #.## ######## ##.#     ',
  '     #.##          ##.#     ',
  '     #.## ######## ##.#     ',
  '######.## ######## ##.######',
  '#............##............#',
  '#.####.#####.##.#####.####.#',
  '#.####.#####.##.#####.####.#',
  '#o..##.......  .......##..o#',
  '###.##.##.########.##.##.###',
  '###.##.##.########.##.##.###',
  '#......##....##....##......#',
  '#.##########.##.##########.#',
  '#.##########.##.##########.#',
  '#..........................#',
  '############################',
]

export const TUNNEL_ROW = 14
export const PLAYER_START = { x: 13.5, y: 23 }
export const HOUSE_DOOR = { x: 13.5, y: 11 }
export const HOUSE_CENTER = { x: 13.5, y: 14 }
export const BONUS_POS = { x: 13.5, y: 17 }

export function isTunnel(c: number, r: number) {
  return r === TUNNEL_ROW && (c <= 5 || c >= 22)
}

export function wrapCol(c: number) {
  return ((c % COLS) + COLS) % COLS
}

export class Maze {
  tiles: string[][] = []
  remaining = 0

  constructor() {
    this.reset()
  }

  reset() {
    this.tiles = LAYOUT.map((row) => row.split(''))
    this.remaining = this.tiles.flat().filter((t) => t === '.' || t === 'o').length
  }

  get(c: number, r: number): string {
    if (r < 0 || r >= ROWS) return '#'
    if (c < 0 || c >= COLS) return r === TUNNEL_ROW ? ' ' : '#'
    return this.tiles[r][c]
  }

  isWall(c: number, r: number) {
    return this.get(c, r) === '#'
  }

  /** Walkable for the player and roaming ghosts (the door is closed to them). */
  walkable(c: number, r: number) {
    const t = this.get(c, r)
    return t !== '#' && t !== '-'
  }

  eat(c: number, r: number): 'pizza' | 'burger' | null {
    const cc = wrapCol(c)
    const t = this.get(cc, r)
    if (t !== '.' && t !== 'o') return null
    this.tiles[r][cc] = ' '
    this.remaining--
    return t === '.' ? 'pizza' : 'burger'
  }
}
