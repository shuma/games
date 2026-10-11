import { COLS, ROWS, type Maze } from './maze'
import { VEC, type Dir } from './movement'

export const TILE = 24

export type Palette = Record<string, string>

export function pixelSprite(rows: string[], palette: Palette, px: number) {
  const canvas = document.createElement('canvas')
  canvas.width = rows[0].length * px
  canvas.height = rows.length * px
  const ctx = canvas.getContext('2d')!
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const color = palette[ch]
      if (!color) return
      ctx.fillStyle = color
      ctx.fillRect(x * px, y * px, px, px)
    }),
  )
  return canvas
}

export const FOOD: Palette = {
  b: '#b8641f', // crust shade
  B: '#e8a24a', // crust
  Y: '#ffd23f', // cheese
  R: '#d7263d', // pepperoni / ketchup red
  T: '#e39b3b', // bun
  t: '#c27a24', // bun shade
  W: '#fff2c7', // sesame / cream
  G: '#5bbf3a', // lettuce
  M: '#6b3a1f', // patty
  P: '#ff8fc7', // icing
  S: '#7ad7ff', // sprinkles
  D: '#d9a066', // dough
  C: '#e0b070', // cone
  K: '#a8743a', // cone pattern
}

export const PIZZA = [
  'bbbbbbb',
  'BBBBBBB',
  'YRYYYRY',
  '.YYYRY.',
  '.YRYYY.',
  '..YYY..',
  '..YRY..',
  '...Y...',
]

export const BURGER = [
  '...TTTTT...',
  '.TTWTTTWTT.',
  'TTTTTWTTTTT',
  'tTTTTTTTTTt',
  'GGGGGGGGGGG',
  'YYYYYYYYYYY',
  'MMMMMMMMMMM',
  'MMMMMMMMMMM',
  'tTTTTTTTTTt',
  '.ttttttttt.',
]

export const FRIES = [
  '...Y.Y.Y...',
  '..YY.YYYY..',
  '..YYYYYYY..',
  '.YYYYYYYYY.',
  '.RRRRRRRRR.',
  '.RRRRRRRRR.',
  '.RRRYYYRRR.',
  '.RRRRRRRRR.',
  '..RRRRRRR..',
  '..RRRRRRR..',
  '..RRRRRRR..',
]

export const SODA = [
  '......W....',
  '.....W.....',
  '....W......',
  '.WWWWWWWWW.',
  '..RRRRRRR..',
  '..RRWWWRR..',
  '..RRWWWRR..',
  '..RRRRRRR..',
  '...RRRRR...',
  '...RRRRR...',
  '...RRRRR...',
]

export const DONUT = [
  '...PPPPP...',
  '.PPSPPPPSP.',
  '.PPPPPSPPP.',
  'PSPP...PPPP',
  'PPP.....PSP',
  'PPP.....PPP',
  'PPS.....PPP',
  'DPPP...PSPD',
  '.DPPSPPPPD.',
  '.DDPPPPPDD.',
  '...DDDDD...',
]

export const ICE_CREAM = [
  '.....R.....',
  '....PPP....',
  '...PPPPP...',
  '..PPWPPPP..',
  '..PPPPPPP..',
  '..CCKCCKC..',
  '...CCKCC...',
  '...KCCKC...',
  '....CKC....',
  '....CCC....',
  '.....C.....',
]

export interface BonusKind {
  name: string
  points: number
  sprite: HTMLCanvasElement
}

export class Sprites {
  readonly pizza = pixelSprite(PIZZA, FOOD, 2)
  readonly burger = pixelSprite(BURGER, FOOD, 2)
  readonly bonuses: BonusKind[] = [
    { name: 'Fries', points: 100, sprite: pixelSprite(FRIES, FOOD, 2) },
    { name: 'Soda', points: 300, sprite: pixelSprite(SODA, FOOD, 2) },
    { name: 'Donut', points: 500, sprite: pixelSprite(DONUT, FOOD, 2) },
    { name: 'Ice cream', points: 700, sprite: pixelSprite(ICE_CREAM, FOOD, 2) },
  ]
  readonly face = new Image()
  readonly ghostFace = new Image()
  /** Ghost face variants, built once the image loads. */
  ghostTints: { frightened: HTMLCanvasElement; flashing: HTMLCanvasElement } | null = null

  constructor() {
    this.face.src = '/sprites/face.png'
    this.ghostFace.onload = () => {
      this.ghostTints = {
        frightened: tinted(this.ghostFace, '#2b4bff', 0.6),
        flashing: tinted(this.ghostFace, '#ffffff', 0.7),
      }
    }
    this.ghostFace.src = '/sprites/dad.png'
  }

  bonusForLevel(level: number): BonusKind {
    const points = [100, 300, 500, 500, 700, 700, 1000, 1000, 2000, 2000, 3000, 3000, 5000]
    const kind = this.bonuses[(level - 1) % this.bonuses.length]
    return { ...kind, points: points[Math.min(level - 1, points.length - 1)] }
  }
}

function tinted(img: HTMLImageElement, color: string, strength: number) {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  ctx.globalCompositeOperation = 'source-atop'
  ctx.globalAlpha = strength
  ctx.fillStyle = color
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  return canvas
}

export interface MazeColors {
  fill: string
  edge: string
  door: string
}

/** Pre-renders walls as rounded neon outlines: a wide edge pass, then a narrower fill pass. */
export function renderMaze(maze: Maze, colors: MazeColors) {
  const canvas = document.createElement('canvas')
  canvas.width = COLS * TILE
  canvas.height = ROWS * TILE
  const ctx = canvas.getContext('2d')!
  const wall = (c: number, r: number) => c >= 0 && c < COLS && r >= 0 && r < ROWS && maze.isWall(c, r)
  const center = (n: number) => n * TILE + TILE / 2

  const pass = (color: string, width: number) => {
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!wall(c, r)) continue
        ctx.moveTo(center(c), center(r))
        ctx.lineTo(center(c) + 0.01, center(r))
        if (wall(c + 1, r)) {
          ctx.moveTo(center(c), center(r))
          ctx.lineTo(center(c + 1), center(r))
        }
        if (wall(c, r + 1)) {
          ctx.moveTo(center(c), center(r))
          ctx.lineTo(center(c), center(r + 1))
        }
      }
    }
    ctx.stroke()
    for (let r = 0; r < ROWS - 1; r++) {
      for (let c = 0; c < COLS - 1; c++) {
        if (wall(c, r) && wall(c + 1, r) && wall(c, r + 1) && wall(c + 1, r + 1)) {
          ctx.fillRect(center(c), center(r), TILE, TILE)
        }
      }
    }
  }

  pass(colors.edge, TILE * 0.8)
  pass(colors.fill, TILE * 0.8 - 6)

  ctx.fillStyle = colors.door
  for (let c = 0; c < COLS; c++) {
    if (maze.get(c, 12) === '-') ctx.fillRect(c * TILE, 12 * TILE + TILE / 2 - 2, TILE, 4)
  }
  return canvas
}

export interface GhostLook {
  color: string
  dir: Dir
  frightened: boolean
  flashing: boolean
  eyesOnly: boolean
}

const GHOST_TILT: Record<Dir, number> = { left: -0.12, right: 0.12, up: 0, down: 0, none: 0 }

export function drawGhost(
  ctx: CanvasRenderingContext2D,
  sprites: Sprites,
  cx: number,
  cy: number,
  look: GhostLook,
  time: number,
) {
  const size = TILE * 1.5

  if (look.eyesOnly) {
    const v = VEC[look.dir]
    for (const side of [-1, 1]) {
      const ex = cx + side * size * 0.2
      const ey = cy - size * 0.1
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.ellipse(ex + v.x * 2, ey + v.y * 2, size * 0.14, size * 0.18, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1d3cff'
      ctx.beginPath()
      ctx.arc(ex + v.x * 5, ey + v.y * 5, size * 0.08, 0, Math.PI * 2)
      ctx.fill()
    }
    return
  }

  const face = sprites.ghostFace
  if (!face.complete || face.naturalWidth === 0) return
  const faceSize = TILE * 1.9
  // Spritesheet frames: idle, grin, open mouth. Chasers chatter; frightened ones gasp.
  const frameSize = face.naturalHeight
  const frame = look.frightened ? 2 : [0, 1, 2, 1][Math.floor(time * 6) % 4]
  let img: CanvasImageSource = face
  if (look.frightened && sprites.ghostTints) {
    img = look.flashing ? sprites.ghostTints.flashing : sprites.ghostTints.frightened
  }

  const bob = Math.sin(time * 8 + cx) * 1.5
  ctx.save()
  ctx.translate(cx, cy + bob)
  ctx.rotate(GHOST_TILT[look.dir])
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, frame * frameSize, 0, frameSize, frameSize, -faceSize / 2, -faceSize / 2, faceSize, faceSize)
  ctx.restore()
}
