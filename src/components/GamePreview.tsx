import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { CatchGame, HEIGHT as CATCH_H, WIDTH as CATCH_W } from '@/catch/game'
import { FlappyGame, HEIGHT as FLAPPY_H, WIDTH as FLAPPY_W } from '@/flappy/game'
import { Game as PacmanGame, HEIGHT as PACMAN_H, WIDTH as PACMAN_W } from '@/game/game'
import { useGameCanvas } from '@/lib/use-game-canvas'
import { RacerGame, HEIGHT as RACER_H, WIDTH as RACER_W } from '@/racer/game'
import { WhackGame } from '@/whack/game'
import type { GameId } from './GameMenu'
import { Hole } from './WhackGame'

interface DemoEngine {
  attach: (canvas: HTMLCanvasElement) => () => void
  startDemo: () => void
}

// How each game is framed in its panel: the point to keep in view when cropping (0 = left/top,
// 1 = right/bottom) and extra zoom beyond simply covering the panel. Whack-a-Dad is shown whole instead.
const FRAMING: Record<Exclude<GameId, 'whack-a-dad'>, { x: number; y: number; zoom: number }> = {
  pacman: { x: 0.5, y: 0.5, zoom: 1 },
  'flappy-aisha': { x: 0.5, y: 0.45, zoom: 1 },
  'catch-the-food': { x: 0.5, y: 1, zoom: 1 },
  dagracer: { x: 0, y: 1, zoom: 1.6 },
}

const CANVAS_GAMES: Record<Exclude<GameId, 'whack-a-dad'>, { create: () => DemoEngine; width: number; height: number }> = {
  pacman: { create: () => new PacmanGame(), width: PACMAN_W, height: PACMAN_H },
  'flappy-aisha': { create: () => new FlappyGame(), width: FLAPPY_W, height: FLAPPY_H },
  'catch-the-food': { create: () => new CatchGame(), width: CATCH_W, height: CATCH_H },
  dagracer: { create: () => new RacerGame(), width: RACER_W, height: RACER_H },
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * A silent, self-playing copy of a game for its menu card. It only runs while the card is on screen,
 * and stays on the still title scene for people who prefer reduced motion.
 */
export function GamePreview({ id }: { id: GameId }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    observer.observe(ref.current!)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} aria-hidden inert className="relative size-full overflow-hidden [container-type:size]">
      {visible && (id === 'whack-a-dad' ? <WhackPreview /> : <CanvasFrame id={id} />)}
      {/* Soft blurred fade from the preview into the card body. */}
      <div className="absolute inset-x-0 bottom-0 h-1/5 [mask-image:linear-gradient(to_top,#000,transparent)] backdrop-blur-sm" />
      <div className="absolute inset-x-0 bottom-0 h-1/5 bg-linear-to-t from-card to-transparent" />
    </div>
  )
}

/** Covers the panel at the game's aspect ratio, zoomed and cropped around its focus point. */
function CanvasFrame({ id }: { id: keyof typeof CANVAS_GAMES }) {
  const { width, height } = CANVAS_GAMES[id]
  const { x, y, zoom } = FRAMING[id]
  const ratio = width / height
  return (
    <div
      className="absolute"
      style={
        {
          '--w': `calc(max(100cqw, 100cqh * ${ratio}) * ${zoom})`,
          width: 'var(--w)',
          aspectRatio: ratio,
          left: `calc((100cqw - var(--w)) * ${x})`,
          top: `calc((100cqh - var(--w) / ${ratio}) * ${y})`,
        } as CSSProperties
      }
    >
      <CanvasPreview id={id} />
    </div>
  )
}

function CanvasPreview({ id }: { id: keyof typeof CANVAS_GAMES }) {
  const { create, width, height } = CANVAS_GAMES[id]
  const [engine] = useState(create)
  const canvas = useRef<HTMLCanvasElement>(null)
  const attach = useCallback((c: HTMLCanvasElement) => engine.attach(c), [engine])
  useGameCanvas(canvas, width, height, attach)
  useEffect(() => {
    if (!reducedMotion()) engine.startDemo()
  }, [engine])
  return <canvas ref={canvas} className="block size-full" />
}

function WhackPreview() {
  const [engine] = useState(() => new WhackGame())
  const [snap, setSnap] = useState(() => engine.snapshot)
  useEffect(() => engine.subscribe(setSnap), [engine])
  useEffect(() => engine.start(), [engine])
  useEffect(() => {
    if (!reducedMotion()) engine.startDemo()
  }, [engine])
  return (
    // The whole board, square and centred, with the panel's tint around it. Score popups stay hidden.
    <div className="absolute inset-0 grid place-items-center p-(--space-s) pb-[20cqh] [&_.whack-popup]:hidden">
      <div className="grid aspect-square h-full grid-cols-3 grid-rows-3 gap-(--space-xs)">
        {snap.holes.map((hole, i) => (
          <Hole key={i} index={i} hole={hole} onWhack={() => {}} />
        ))}
      </div>
    </div>
  )
}
