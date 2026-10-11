import { useState, type AnimationEvent } from 'react'
import { Synth } from '@/lib/synth'

const PX = 4

// Pixel-art pop-tart cat, laid out as overlays on a 26×16 grid.
const BODY = [
  '.KKKKKKKKKKKKKKKK.',
  'KTTTTTTTTTTTTTTTTK',
  'KTTPPPPPPPPPPPPTTK',
  'KTPPPSPPPPSPPPPPTK',
  'KTPPPPPPPPPPPPSPTK',
  'KTPSPPPPPSPPPPPPTK',
  'KTPPPPPPPPPPPPPPTK',
  'KTPPPPSPPPPPSPPPTK',
  'KTPPPPPPPPPPPPPPTK',
  'KTPSPPPPPPSPPPPPTK',
  'KTPPPPPPPPPPPPSPTK',
  'KTTPPPPPPPPPPPPTTK',
  'KTTTTTTTTTTTTTTTTK',
  '.KKKKKKKKKKKKKKKK.',
]
const HEAD = [
  '..KK....KK..',
  '.KGGK..KGGK.',
  '.KGGGKKGGGK.',
  'KGGGGGGGGGGK',
  'KGGWKGGGWKGK',
  'KGGKKGGGKKGK',
  'KRRGGGGGGRRK',
  'KRRGKGGKGRRK',
  '.KGGKKKKGGK.',
  '..KKKKKKKK..',
]
const TAIL = ['KK.', 'KGGK', '.KK']
const LEG = ['KGGK', '.KK.']

const COLORS: Record<string, string> = {
  K: '#000000',
  T: '#ffcc99',
  P: '#ff99ff',
  S: '#ff3399',
  G: '#999999',
  W: '#ffffff',
  R: '#ff9999',
}
const RAINBOW = ['#ff0000', '#ff9900', '#ffff00', '#33ff00', '#0099ff', '#6633ff']

function pixels() {
  const cells = new Map<string, string>()
  const stamp = (rows: string[], col: number, row: number) =>
    rows.forEach((line, y) =>
      [...line].forEach((ch, x) => {
        if (COLORS[ch]) cells.set(`${col + x},${row + y}`, COLORS[ch])
      }),
    )
  stamp(TAIL, 0, 6)
  for (const col of [3, 7, 13, 17]) stamp(LEG, col, 13)
  stamp(BODY, 2, 0)
  stamp(HEAD, 14, 4)
  return [...cells].map(([key, fill]) => {
    const [x, y] = key.split(',').map(Number)
    return { x, y, fill }
  })
}

const CAT = pixels()
const SEGMENT = 8
const SEGMENTS = 8
const TRAIL_W = SEGMENT * SEGMENTS

/** One rainbow phase: segments step up and down alternately. */
function Rainbow({ phase }: { phase: 0 | 1 }) {
  return (
    <g className={phase ? 'nyan-phase-b' : 'nyan-phase-a'}>
      {Array.from({ length: SEGMENTS }, (_, i) =>
        RAINBOW.map((fill, band) => (
          <rect
            key={`${i}-${band}`}
            x={i * SEGMENT}
            y={2 + band * 2 + ((i + phase) % 2)}
            width={SEGMENT}
            height={2}
            fill={fill}
          />
        )),
      )}
    </g>
  )
}

const midi = (n: number) => 440 * 2 ** ((n - 69) / 12)

// An original bouncy chiptune loop: lead over a pulsing bass, two bars twice.
const STEP = 0.11
const LEAD = [76, 80, 83, 80, 85, 83, 80, 76, 78, 81, 85, 81, 83, 80, 76, 78, 80, 83, 88, 83, 85, 81, 78, 81, 83, 80, 76, 80, 78, 76, 76, 0]
const BASS = [52, 59, 57, 64, 52, 59, 59, 66]

class NyanTune extends Synth {
  private busyUntil = 0

  playTune() {
    this.unlock()
    const ctx = this.ctx
    // Browsers keep audio blocked until the first click or key press on the page.
    if (!ctx || ctx.state !== 'running' || ctx.currentTime < this.busyUntil) return
    const notes = [0, 1].flatMap((loop) => {
      const offset = loop * LEAD.length * STEP
      return [
        ...LEAD.flatMap((n, i) =>
          n ? [{ freq: midi(n), dur: STEP * 0.9, at: offset + i * STEP, type: 'square' as const, vol: 0.05 }] : [],
        ),
        ...BASS.map((n, i) => ({ freq: midi(n), dur: STEP * 3.5, at: offset + i * STEP * 4, type: 'triangle' as const, vol: 0.12 })),
      ]
    })
    this.play(notes)
    this.busyUntil = ctx.currentTime + LEAD.length * STEP * 2
  }
}

const tune = new NyanTune()
window.addEventListener('pointerdown', () => tune.unlock(), { once: true })

interface Flight {
  id: number
  top: number
  duration: number
  delay: number
  reverse: boolean
}

const random = (min: number, max: number) => min + Math.random() * (max - min)

function nextFlight(id: number, delay = random(1, 4)): Flight {
  return { id, top: random(5, 85), duration: random(8, 16), delay, reverse: Math.random() < 0.5 }
}

/** Nyan-style cat flying across the menu background on a new path each pass. Hover it for a tune. */
export function NyanCat() {
  const [flight, setFlight] = useState(() => nextFlight(0, random(0, 1)))

  const onEnd = (e: AnimationEvent) => {
    if (e.target === e.currentTarget) setFlight((f) => nextFlight(f.id + 1))
  }

  return (
    <div
      key={flight.id}
      className="nyan-flight"
      onAnimationEnd={onEnd}
      style={{
        top: `${flight.top}%`,
        animationName: flight.reverse ? 'nyan-fly-back' : 'nyan-fly',
        animationDuration: `${flight.duration}s`,
        animationDelay: `${flight.delay}s`,
      }}
    >
      <div className={flight.reverse ? '-scale-x-100' : undefined}>
        <svg
          className="nyan-bob"
          width={(TRAIL_W + 26) * PX}
          height={16 * PX}
          viewBox={`0 0 ${TRAIL_W + 26} 16`}
          shapeRendering="crispEdges"
        >
          <Rainbow phase={0} />
          <Rainbow phase={1} />
          <g
            transform={`translate(${TRAIL_W - 2} 0)`}
            className="pointer-events-auto cursor-pointer"
            onPointerEnter={() => tune.playTune()}
            onPointerDown={() => tune.playTune()}
          >
            {CAT.map((p) => (
              <rect key={`${p.x},${p.y}`} x={p.x} y={p.y} width={1} height={1} fill={p.fill} />
            ))}
          </g>
        </svg>
      </div>
    </div>
  )
}
