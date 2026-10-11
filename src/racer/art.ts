import { pixelSprite, type Palette } from '@/game/sprites'

export const W = 480
export const H = 270
/** Where the car's wheels touch the road. */
export const GROUND_Y = 236
const ROAD_TOP = 178
const ROAD_BOTTOM = 250

const PAL: Palette = {
  K: '#2b1a10', // outline
  Y: '#ffd23f', // gold
  y: '#e0a91f', // gold shade
  W: '#fff8d6', // shine
  G: '#4caf3a', // bill green
  g: '#2d7a2a', // bill shade
  L: '#9bd17a', // bill light
  B: '#d9a066', // sack
  b: '#a8743a', // sack shade
}

const COIN = [
  '..KKKK..',
  '.KYYYYK.',
  'KYYWYYyK',
  'KYWYYYyK',
  'KYYYYYyK',
  'KYYYYyyK',
  '.KyyyyK.',
  '..KKKK..',
]

const BILL = [
  'KKKKKKKKKKKKK',
  'KGGGGGGGGGGGK',
  'KGLLLGgGLLLGK',
  'KGLGGgLgGGLGK',
  'KGLLLGgGLLLGK',
  'KGGGGGGGGGGGK',
  'KKKKKKKKKKKKK',
]

const BAG = [
  '....KKK....',
  '...KbBbK...',
  '....KBK....',
  '..KKBBBKK..',
  '.KBBBBBBBK.',
  'KBBBYYYBBBK',
  'KBBYBBBBBBK',
  'KBBBYYYBBBK',
  'KBBBBBBYBBK',
  'KBBBYYYBBBK',
  '.KBBBBBBBK.',
  '..KKKKKKK..',
]

export type MoneyKind = 'coin' | 'bill' | 'bag'
export const MONEY_POINTS: Record<MoneyKind, number> = { coin: 1, bill: 3, bag: 10 }

export class RacerArt {
  readonly car = new Image()
  readonly money: Record<MoneyKind, HTMLCanvasElement> = {
    coin: pixelSprite(COIN, PAL, 1),
    bill: pixelSprite(BILL, PAL, 1),
    bag: pixelSprite(BAG, PAL, 1),
  }
  readonly sky = renderSky()
  readonly hills = renderHills()
  readonly trees = renderTrees()

  constructor() {
    this.car.src = '/sprites/racer.png'
  }
}

function canvas(width: number, height: number) {
  const c = document.createElement('canvas')
  c.width = width
  c.height = height
  return [c, c.getContext('2d')!] as const
}

function renderSky() {
  const [c, ctx] = canvas(W, ROAD_TOP)
  const sky = ctx.createLinearGradient(0, 0, 0, ROAD_TOP)
  sky.addColorStop(0, '#ff9a5c')
  sky.addColorStop(0.55, '#ffd28a')
  sky.addColorStop(1, '#fff1c9')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, ROAD_TOP)
  // Pixel sun.
  ctx.fillStyle = '#fff8d6'
  for (let y = -14; y <= 14; y += 2) {
    const half = Math.round(Math.sqrt(196 - y * y) / 2) * 2
    ctx.fillRect(360 - half, 70 + y, half * 2, 2)
  }
  return c
}

/** A seamless 480px strip of rolling hills, scrolled slowly. */
function renderHills() {
  const [c, ctx] = canvas(W, ROAD_TOP)
  for (const [color, base, amp, waves] of [
    ['#e0956a', 128, 22, 2],
    ['#b8735a', 150, 16, 3],
  ] as const) {
    ctx.fillStyle = color
    for (let x = 0; x < W; x += 2) {
      const top = Math.round((base - amp * (0.5 + 0.5 * Math.sin((x / W) * Math.PI * 2 * waves))) / 2) * 2
      ctx.fillRect(x, top, 2, ROAD_TOP - top)
    }
  }
  return c
}

/** Grass verge with pixel trees and lamp posts, scrolled at half speed. */
function renderTrees() {
  const [c, ctx] = canvas(W, ROAD_TOP)
  ctx.fillStyle = '#5aa83a'
  ctx.fillRect(0, 164, W, ROAD_TOP - 164)
  for (const x of [20, 110, 190, 300, 410]) {
    ctx.fillStyle = '#6b3a1f'
    ctx.fillRect(x + 6, 150, 4, 16)
    ctx.fillStyle = '#2d7a2a'
    ctx.fillRect(x, 134, 16, 18)
    ctx.fillRect(x + 2, 128, 12, 6)
    ctx.fillStyle = '#4caf3a'
    ctx.fillRect(x + 2, 136, 6, 6)
  }
  for (const x of [70, 250, 360]) {
    ctx.fillStyle = '#59544a'
    ctx.fillRect(x, 132, 2, 34)
    ctx.fillRect(x, 132, 8, 2)
    ctx.fillStyle = '#fff8d6'
    ctx.fillRect(x + 6, 134, 4, 2)
  }
  return c
}

/** Road, lane dashes and curbs, scrolled at full speed. */
export function drawRoad(ctx: CanvasRenderingContext2D, scroll: number) {
  ctx.fillStyle = '#3c3a40'
  ctx.fillRect(0, ROAD_TOP, W, ROAD_BOTTOM - ROAD_TOP)
  ctx.fillStyle = '#4a4850'
  ctx.fillRect(0, ROAD_TOP + 4, W, 2)
  const off = -(scroll % 32)
  ctx.fillStyle = '#fff8d6'
  for (let x = off; x < W; x += 32) ctx.fillRect(Math.round(x), 210, 16, 3)
  for (const y of [ROAD_TOP - 4, ROAD_BOTTOM]) {
    for (let x = -(scroll % 16); x < W; x += 16) {
      ctx.fillStyle = Math.floor((x + scroll) / 8) % 2 === 0 ? '#e23b3b' : '#ffffff'
      ctx.fillRect(Math.round(x), y, 8, 4)
      ctx.fillStyle = Math.floor((x + scroll) / 8) % 2 === 0 ? '#ffffff' : '#e23b3b'
      ctx.fillRect(Math.round(x) + 8, y, 8, 4)
    }
  }
  ctx.fillStyle = '#5aa83a'
  ctx.fillRect(0, ROAD_BOTTOM + 4, W, H - ROAD_BOTTOM - 4)
}

/** A fire pit: logs with flickering pixel flames, `flames` wide (12px each). */
export function drawFire(ctx: CanvasRenderingContext2D, x: number, flames: number, time: number) {
  const width = flames * 12
  const left = Math.round(x)
  for (let col = 0; col < width; col += 2) {
    const within = (col % 12) / 12
    const profile = Math.sin(within * Math.PI)
    const flicker = 0.8 + 0.2 * Math.sin(time * 22 + col * 1.7) + 0.1 * Math.sin(time * 13 + col)
    const height = Math.max(2, Math.round((profile * 24 * flicker) / 2) * 2)
    const base = GROUND_Y - 4
    ctx.fillStyle = '#e23b3b'
    ctx.fillRect(left + col, base - height, 2, height)
    ctx.fillStyle = '#ff9a3c'
    const mid = Math.round((height * 0.65) / 2) * 2
    ctx.fillRect(left + col, base - mid, 2, mid)
    ctx.fillStyle = '#ffd23f'
    const core = Math.round((height * 0.35) / 2) * 2
    ctx.fillRect(left + col, base - core, 2, core)
  }
  ctx.fillStyle = '#6b3a1f'
  ctx.fillRect(left - 2, GROUND_Y - 4, width + 4, 4)
  ctx.fillStyle = '#3d2210'
  for (let i = 0; i < width + 4; i += 6) ctx.fillRect(left - 2 + i, GROUND_Y - 4, 2, 4)
}
