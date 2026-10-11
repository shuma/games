import { HeartIcon, PauseIcon, PlayIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CatchGame as Engine, HEIGHT, LIVES, WIDTH } from '@/catch/game'
import { cn } from '@/lib/utils'
import { useGameCanvas } from '@/lib/use-game-canvas'
import { BackButton } from './BackButton'
import { FullscreenButton } from './FullscreenButton'
import { GameOverDialog } from './GameOverDialog'
import { PauseDialog } from './PauseDialog'
import { SoundSwitch } from './SoundSwitch'
import { SpriteFrames } from './SpriteFrames'
import { Stat } from './Stat'

const RULES = [
  { label: 'Pizza, apple, strawberry, cookie', value: '+1' },
  { label: 'Burger, hot dog, taco, watermelon', value: '+2' },
  { label: 'Cupcake, donut, ice cream', value: '+5' },
  { label: 'Broccoli or a stinky sock', value: '−1 life' },
]

const STEER: Record<string, number> = { ArrowLeft: -1, a: -1, A: -1, ArrowRight: 1, d: 1, D: 1 }

export function CatchGame({ onExit }: { onExit: () => void }) {
  const [game] = useState(() => new Engine())
  const [snap, setSnap] = useState(() => game.snapshot)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const playing = snap.phase === 'playing'

  useEffect(() => game.subscribe(setSnap), [game])

  const attach = useCallback((canvas: HTMLCanvasElement) => game.attach(canvas), [game])
  useGameCanvas(canvasRef, WIDTH, HEIGHT, attach)
  const setMuted = useCallback((muted: boolean) => game.setMuted(muted), [game])

  // Follow the mouse anywhere on the page, so Adam keeps up even when the pointer leaves the canvas.
  useEffect(() => {
    if (!playing) return
    const onMove = (e: PointerEvent) => {
      const box = canvasRef.current?.getBoundingClientRect()
      if (box) game.aim(((e.clientX - box.left) / box.width) * WIDTH)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerdown', onMove)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onMove)
    }
  }, [game, playing])

  useEffect(() => {
    const held = new Set<number>()
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key in STEER) {
        e.preventDefault()
        held.add(STEER[e.key])
        game.steer = STEER[e.key]
        return
      }
      const key = e.key.toLowerCase()
      if (key === 'p') game.setPaused(!game.paused)
      else if (key === 'escape' && !game.paused) game.setPaused(true)
      else if (key === 'm') game.setMuted(!game.sfx.muted)
    }
    const onUp = (e: KeyboardEvent) => {
      if (!(e.key in STEER)) return
      held.delete(STEER[e.key])
      game.steer = held.size ? [...held][held.size - 1] : 0
    }
    const onHide = () => document.hidden && game.setPaused(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onUp)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onUp)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [game])

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-(--space-m)">
      <div className="flex w-[min(100%,calc((100dvh-var(--chrome))*2/3))] flex-col gap-(--space-s) [--chrome:184px]">
        <div className="flex items-center justify-between">
          <BackButton onClick={onExit} />
          <FullscreenButton />
        </div>
        <header className="flex items-end justify-between gap-(--space-m)">
          <div className="flex items-end gap-(--space-l)">
            <Stat label="Score" value={snap.score} />
            <Stat label="Best" value={snap.best} />
          </div>
          <div className="flex items-center gap-(--space-s)">
            <div className="flex gap-(--space-xxs)" aria-label={`${snap.lives} of ${LIVES} lives left`} role="img">
              {Array.from({ length: LIVES }, (_, i) => (
                <HeartIcon
                  key={i}
                  aria-hidden
                  className={cn('size-5', i < snap.lives ? 'fill-(--error) text-(--error)' : 'text-muted-foreground')}
                />
              ))}
            </div>
            {playing && (
              <Button variant="ghost" size="icon" aria-label="Pause" onClick={() => game.setPaused(true)}>
                <PauseIcon />
              </Button>
            )}
          </div>
        </header>
        <div className="relative">
          <canvas
            ref={canvasRef}
            aria-label="Catch the Food picnic"
            className={cn(
              'block aspect-[2/3] w-full touch-none rounded-m bg-background select-none',
              playing && !snap.paused && 'cursor-none',
            )}
          />
          {snap.phase === 'menu' && (
            <div className="absolute inset-0 flex items-center justify-center p-(--space-m)">
              <Card className="w-full max-w-xs">
                <CardHeader className="justify-items-center text-center">
                  <SpriteFrames animated className="size-18" />
                  <CardTitle className="type-xl font-(--weight-brand-heavy)">Catch the Food</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-(--space-s)">
                  <ul className="flex flex-col gap-(--space-xs) type-s">
                    {RULES.map((r) => (
                      <li key={r.label} className="flex items-center justify-between gap-(--space-s)">
                        <span>{r.label}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">{r.value}</span>
                      </li>
                    ))}
                  </ul>
                  <SoundSwitch muted={snap.muted} onMutedChange={setMuted} />
                </CardContent>
                <CardFooter className="flex-col">
                  <Button className="w-full" onClick={() => game.newGame()} autoFocus>
                    <PlayIcon />
                    Play
                  </Button>
                  <p className="type-xs text-muted-foreground">Move the mouse or drag · ← → also work · P to pause</p>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </div>

      <PauseDialog
        open={snap.paused}
        muted={snap.muted}
        onMutedChange={setMuted}
        onResume={() => game.setPaused(false)}
        onQuit={() => game.toMenu()}
      />
      <GameOverDialog
        open={snap.phase === 'gameOver'}
        score={snap.score}
        detail={`Caught ${snap.caught} ${snap.caught === 1 ? 'snack' : 'snacks'}`}
        newHighScore={snap.newBest}
        onPlayAgain={() => game.newGame()}
        onMenu={() => game.toMenu()}
      />
    </main>
  )
}
