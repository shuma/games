export const W = 288
export const H = 512
export const GROUND_Y = 448
export const TOWER_W = 52
const CAP_H = 22

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

/** Seeded random so the scenery looks the same every run. */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
}

const STONE = { base: '#6b7390', light: '#8a93b0', dark: '#3c4260', mortar: '#4b5270', glow: '#ffcf5a' }

function towerBody() {
  const [c, ctx] = canvas(TOWER_W, H)
  ctx.fillStyle = STONE.base
  ctx.fillRect(0, 0, TOWER_W, H)
  ctx.fillStyle = STONE.mortar
  for (let y = 0; y < H; y += 10) {
    ctx.fillRect(0, y, TOWER_W, 2)
    const offset = (y / 10) % 2 === 0 ? 0 : 9
    for (let x = offset; x < TOWER_W; x += 18) ctx.fillRect(x, y, 2, 10)
  }
  ctx.fillStyle = STONE.light
  ctx.fillRect(2, 0, 4, H)
  ctx.fillStyle = STONE.dark
  ctx.fillRect(TOWER_W - 8, 0, 8, H)
  // Lit arrow-slit windows.
  for (let y = 40; y < H; y += 90) {
    ctx.fillStyle = '#1c1f33'
    ctx.fillRect(TOWER_W / 2 - 4, y - 2, 8, 18)
    ctx.fillStyle = STONE.glow
    ctx.fillRect(TOWER_W / 2 - 2, y, 4, 14)
  }
  return c
}

/** Battlements, drawn pointing up; flipped for towers that hang from the top. */
function towerCap() {
  const w = TOWER_W + 10
  const [c, ctx] = canvas(w, CAP_H)
  ctx.fillStyle = STONE.dark
  ctx.fillRect(0, 8, w, CAP_H - 8)
  ctx.fillStyle = STONE.base
  ctx.fillRect(2, 10, w - 4, CAP_H - 12)
  for (let x = 0; x < w; x += 14) {
    ctx.fillStyle = STONE.dark
    ctx.fillRect(x, 0, 9, 10)
    ctx.fillStyle = STONE.light
    ctx.fillRect(x + 2, 2, 5, 8)
  }
  ctx.fillStyle = STONE.light
  ctx.fillRect(2, 10, w - 4, 2)
  return c
}

function sky() {
  const [c, ctx] = canvas(W, H)
  const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y)
  g.addColorStop(0, '#070b1f')
  g.addColorStop(0.6, '#16244a')
  g.addColorStop(1, '#2c3d6e')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
  // Moon with craters.
  ctx.fillStyle = '#fff4c7'
  ctx.beginPath()
  ctx.arc(222, 82, 26, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#efe0a8'
  for (const [x, y, r] of [[212, 74, 5], [230, 92, 4], [226, 70, 3]]) {
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  return c
}

/** Distant castle silhouette, tiles horizontally. */
function castle() {
  const w = W * 2
  const h = 170
  const [c, ctx] = canvas(w, h)
  const rand = rng(7)
  ctx.fillStyle = '#0d1430'
  ctx.fillRect(0, h - 40, w, 40)
  for (let x = 0; x < w; ) {
    const tw = 18 + Math.floor(rand() * 26)
    const th = 50 + Math.floor(rand() * 90)
    ctx.fillStyle = '#0d1430'
    ctx.fillRect(x, h - th, tw, th)
    // Conical roof.
    ctx.beginPath()
    ctx.moveTo(x - 3, h - th)
    ctx.lineTo(x + tw / 2, h - th - tw * 1.1)
    ctx.lineTo(x + tw + 3, h - th)
    ctx.fill()
    ctx.fillStyle = '#ffcf5a'
    for (let y = h - th + 10; y < h - 20; y += 18) {
      if (rand() < 0.45) ctx.fillRect(x + tw / 2 - 2, y, 3, 5)
    }
    x += tw + Math.floor(rand() * 20)
  }
  return c
}

function ground() {
  const w = W * 2
  const [c, ctx] = canvas(w, H - GROUND_Y)
  const rand = rng(3)
  ctx.fillStyle = '#2b1f17'
  ctx.fillRect(0, 0, w, H - GROUND_Y)
  ctx.fillStyle = '#3d2c20'
  for (let i = 0; i < 160; i++) ctx.fillRect(Math.floor(rand() * w), 14 + Math.floor(rand() * 50), 3, 2)
  ctx.fillStyle = '#2f6b3a'
  ctx.fillRect(0, 0, w, 12)
  ctx.fillStyle = '#4c9a4f'
  ctx.fillRect(0, 0, w, 3)
  for (let x = 0; x < w; x += 6) ctx.fillRect(x, 3, 2, 2 + Math.floor(rand() * 3))
  return c
}

export interface Star {
  x: number
  y: number
  phase: number
  size: number
}

export class FlappyArt {
  readonly sky = sky()
  readonly castle = castle()
  readonly ground = ground()
  readonly towerBody = towerBody()
  readonly towerCap = towerCap()
  readonly stars: Star[]
  readonly wizard = new Image()

  constructor() {
    const rand = rng(11)
    this.stars = Array.from({ length: 40 }, () => ({
      x: Math.floor(rand() * W),
      y: Math.floor(rand() * 260),
      phase: rand() * Math.PI * 2,
      size: rand() < 0.2 ? 2 : 1,
    }))
    this.wizard.src = '/sprites/aisha.png'
  }

  /** Draws a tower pair with the gap centred on `gapY`. */
  drawTower(ctx: CanvasRenderingContext2D, x: number, gapY: number, gap: number) {
    const top = gapY - gap / 2
    const bottom = gapY + gap / 2
    const capX = x - 5
    // Top tower hangs down from the sky.
    ctx.drawImage(this.towerBody, 0, H - top, TOWER_W, top, x, 0, TOWER_W, top)
    ctx.save()
    ctx.translate(capX, top)
    ctx.scale(1, -1)
    ctx.drawImage(this.towerCap, 0, 0)
    ctx.restore()
    // Bottom tower rises from the ground.
    const h = GROUND_Y - bottom
    ctx.drawImage(this.towerBody, 0, 0, TOWER_W, h, x, bottom, TOWER_W, h)
    ctx.drawImage(this.towerCap, capX, bottom)
  }

  drawSnitch(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
    const flap = Math.abs(Math.sin(time * 30))
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    for (const side of [-1, 1]) {
      ctx.beginPath()
      ctx.ellipse(x + side * 9, y - 3, 8, 2 + flap * 4, side * -0.4, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#c99a1e'
    ctx.beginPath()
    ctx.arc(x, y, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffd23f'
    ctx.beginPath()
    ctx.arc(x - 0.5, y - 0.5, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff2c7'
    ctx.fillRect(x - 3, y - 3, 2, 2)
  }
}
