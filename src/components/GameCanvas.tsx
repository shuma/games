import { useCallback, useEffect, useRef } from 'react'
import { HEIGHT, WIDTH, type Game } from '@/game/game'
import type { Dir } from '@/game/movement'
import { useGameCanvas } from '@/lib/use-game-canvas'

const SWIPE_MIN = 24

/** Hosts the game canvas, keeps its backing store sized to the element, and reads swipes. */
export function GameCanvas({ game, onSwipe }: { game: Game; onSwipe: (dir: Dir) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)

  const attach = useCallback((canvas: HTMLCanvasElement) => game.attach(canvas), [game])
  useGameCanvas(ref, WIDTH, HEIGHT, attach)

  useEffect(() => {
    const canvas = ref.current!
    let start: { x: number; y: number } | null = null
    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') start = { x: e.clientX, y: e.clientY }
    }
    const move = (e: PointerEvent) => {
      if (!start) return
      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN) return
      onSwipe(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')
      start = { x: e.clientX, y: e.clientY }
    }
    const up = () => (start = null)
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)
    return () => {
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
    }
  }, [onSwipe])

  return (
    <canvas
      ref={ref}
      aria-label="Adam-Man maze"
      className="block size-full touch-none rounded-m bg-background"
    />
  )
}
