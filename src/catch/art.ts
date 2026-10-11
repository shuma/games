import { BURGER, DONUT, FOOD, ICE_CREAM, PIZZA, pixelSprite, type Palette } from '@/game/sprites'

export const W = 360
export const H = 540
export const GROUND_Y = H - 48
const PX = 3

const PAL: Palette = {
  K: '#2b1a10', // outline
  R: '#e23b3b', // red
  r: '#a8232a', // red shade
  W: '#ffffff',
  Y: '#ffd23f', // yellow
  y: '#e0a91f', // yellow shade
  B: '#d9a066', // bread
  b: '#a8743a', // bread shade
  G: '#4caf3a', // green
  g: '#2d7a2a', // green shade
  L: '#9bd17a', // light green
  P: '#ff8fc7', // icing
  p: '#d95f9e', // icing shade
  C: '#6b3a1f', // chocolate
  M: '#c0583a', // sausage
  E: '#1a1a1a', // seeds
  S: '#b8bcc4', // sock
  s: '#7d828c', // sock shade
  N: '#3a6fd8', // sock stripe
}

const HOT_DOG = [
  '..BBBBBBBBB..',
  '.BbbbbbbbbbB.',
  'MMMMMMMMMMMMM',
  'MYMMYMMYMMYMM',
  'MMYMMYMMYMMMM',
  '.BbbbbbbbbbB.',
  '..BBBBBBBBB..',
]

const TACO = [
  '....LGRGL....',
  '..GRLYGRLG...',
  '.YYYYYYYYYYY.',
  'YYYyYYYYyYYYY',
  'YYYYYYYYYYYYY',
  '.YYYYyYYYYYY.',
  '..YYYYYYYYY..',
  '....YYYYY....',
]

const WATERMELON = [
  'RRRRRRRRRRRRR',
  'RRERRRERRRERR',
  'WRRRRRRRRRRRW',
  'GWRRERRRERRWG',
  '.GWWRRRRRWWG.',
  '..GGWWWWWGG..',
  '....GGGGG....',
]

const CUPCAKE = [
  '.....R.....',
  '....PPP....',
  '..PPPWPPP..',
  '.PPWPPPPPP.',
  'PPPPPPPWPPP',
  'pPPPPPPPPPp',
  '.bBbBbBbBb.',
  '.bBbBbBbBb.',
  '..bBbBbBb..',
  '..bBbBbBb..',
  '...bbbbb...',
]

const APPLE = [
  '.....b.....',
  '.....bG....',
  '..RR.bGG...',
  '.RRRRRRRR..',
  'RRWRRRRRRR.',
  'RWRRRRRRRRr',
  'RRRRRRRRRRr',
  'RRRRRRRRRRr',
  '.RRRRRRRRr.',
  '..RRrRRrr..',
  '...rr.rr...',
]

const COOKIE = [
  '...bbbbb...',
  '..bBBBBBb..',
  '.bBCBBBBCb.',
  'bBBBBBCBBBb',
  'bBCBBBBBBBb',
  'bBBBBCBBCBb',
  'bBBBBBBBBBb',
  '.bBCBBBCBb.',
  '..bBBBBBb..',
  '...bbbbb...',
]

const STRAWBERRY = [
  '...GgGgG...',
  '..GGGGGGG..',
  '.RRRGGGRRR.',
  'RRYRRRRRYRR',
  'RRRRRYRRRRR',
  'RYRRRRRRYRR',
  '.RRRYRRRRR.',
  '.RRRRRRYRR.',
  '..RYRRRRR..',
  '...RRRYR...',
  '....RRR....',
]

const BROCCOLI = [
  '...GGGGG...',
  '..GgGGGgG..',
  '.GGGGgGGGG.',
  'GGgGGGGGgGG',
  'GGGGGgGGGGG',
  '.GGgGGGgGG.',
  '...LLLLL...',
  '....LLL....',
  '....LLL....',
  '....LLL....',
  '...LLLLL...',
]

const SOCK = [
  '....WWWW...',
  '....NNNN...',
  '....SSSS...',
  '....SsSS...',
  '....SSSS...',
  '....SSsS...',
  '....SSSS...',
  '..SSSSSS...',
  '.SSSsSSS...',
  'SSSSSSSS...',
  'SSSSSSS....',
  '.NNNNN.....',
]

export interface FoodKind {
  name: string
  /** Points when caught; 0 marks something to avoid. */
  points: number
  /** Relative spawn weight within its group. */
  weight: number
  sprite: HTMLCanvasElement
  stinky?: boolean
}

const kind = (name: string, points: number, weight: number, rows: string[], palette = PAL, stinky = false): FoodKind => ({
  name,
  points,
  weight,
  sprite: pixelSprite(rows, palette, PX),
  stinky,
})

export class CatchArt {
  readonly face = new Image()
  readonly scene = renderScene()
  readonly food: FoodKind[] = [
    kind('pizza', 1, 6, PIZZA, FOOD),
    kind('apple', 1, 5, APPLE),
    kind('strawberry', 1, 5, STRAWBERRY),
    kind('cookie', 1, 5, COOKIE),
    kind('burger', 2, 3, BURGER, FOOD),
    kind('hot dog', 2, 3, HOT_DOG),
    kind('taco', 2, 3, TACO),
    kind('watermelon', 2, 3, WATERMELON),
    kind('cupcake', 5, 1, CUPCAKE),
    kind('donut', 5, 1, DONUT, FOOD),
    kind('ice cream', 5, 1, ICE_CREAM, FOOD),
  ]
  readonly yucky: FoodKind[] = [kind('broccoli', 0, 3, BROCCOLI), kind('sock', 0, 2, SOCK, PAL, true)]

  constructor() {
    this.face.src = '/sprites/face.png'
  }
}

export function pick(kinds: FoodKind[]) {
  let roll = Math.random() * kinds.reduce((sum, k) => sum + k.weight, 0)
  for (const k of kinds) {
    roll -= k.weight
    if (roll <= 0) return k
  }
  return kinds[0]
}

/** Sky, pixel clouds, grass and a picnic blanket, drawn once. */
function renderScene() {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y)
  sky.addColorStop(0, '#5ec4ff')
  sky.addColorStop(1, '#c9ecff')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, GROUND_Y)

  ctx.fillStyle = '#ffffff'
  for (const [x, y, s] of [
    [40, 70, 1],
    [230, 40, 1.3],
    [150, 160, 0.9],
    [290, 230, 1.1],
    [30, 300, 0.8],
  ]) {
    ctx.fillRect(x, y, 48 * s, 12 * s)
    ctx.fillRect(x + 8 * s, y - 8 * s, 24 * s, 8 * s)
    ctx.fillRect(x + 28 * s, y - 4 * s, 12 * s, 4 * s)
  }

  ctx.fillStyle = '#4caf3a'
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y)
  ctx.fillStyle = '#2d7a2a'
  for (let x = 0; x < W; x += 12) ctx.fillRect(x + 4, GROUND_Y, 3, 4)

  // Red and white picnic checks.
  const cell = 12
  for (let y = GROUND_Y + 8; y < H; y += cell) {
    for (let x = 0; x < W; x += cell) {
      ctx.fillStyle = ((x + y) / cell) % 2 < 1 ? '#e23b3b' : '#fff2f2'
      ctx.fillRect(x, y, cell, cell)
    }
  }
  return canvas
}
