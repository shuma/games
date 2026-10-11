import { PauseIcon, PlayIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FlappyGame as Engine, HEIGHT, WIDTH } from '@/flappy/game'
import { useGameCanvas } from '@/lib/use-game-canvas'
import { GameOverDialog } from './GameOverDialog'
import { GameShell } from './GameShell'
import { PauseDialog } from './PauseDialog'
import { SoundSwitch } from './SoundSwitch'
import { SpriteFrames } from './SpriteFrames'
import { Stat } from './Stat'

const FLAP_KEYS = new Set([' ', 'ArrowUp', 'w', 'W'])

export function FlappyGame({ onExit }: { onExit: () => void }) {
  const [game] = useState(() => new Engine())
  const [snap, setSnap] = useState(() => game.snapshot)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => game.subscribe(setSnap), [game])

  const attach = useCallback((canvas: HTMLCanvasElement) => game.attach(canvas), [game])
  useGameCanvas(canvasRef, WIDTH, HEIGHT, attach)
  const setMuted = useCallback((muted: boolean) => game.setMuted(muted), [game])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const inFlight = game.phase === 'ready' || game.phase === 'playing'
      if (FLAP_KEYS.has(e.key) && inFlight && !game.paused) {
        e.preventDefault()
        if (!e.repeat) game.flap()
        return
      }
      const key = e.key.toLowerCase()
      if (key === 'p') game.setPaused(!game.paused)
      else if (key === 'escape' && !game.paused) game.setPaused(true)
      else if (key === 'm') game.setMuted(!game.sfx.muted)
    }
    const onHide = () => document.hidden && game.setPaused(true)
    window.addEventListener('keydown', onKey)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [game])

  const inFlight = snap.phase === 'ready' || snap.phase === 'playing'

  return (
    <>
      <GameShell
        onExit={onExit}
        ratio={WIDTH / HEIGHT}
        hud={
          <>
            <div className="flex items-end gap-(--space-l)">
              <Stat label="Score" value={snap.score} />
              <Stat label="Best" value={snap.best} />
            </div>
            {inFlight && (
              <Button variant="ghost" size="icon" aria-label="Pause" onClick={() => game.setPaused(true)}>
                <PauseIcon />
              </Button>
            )}
          </>
        }
        overlay={
          snap.phase === 'menu' && (
            <Card>
              <CardHeader className="justify-items-center text-center">
                <SpriteFrames src="/sprites/aisha.png" animated interval={110} className="h-18 w-24 short:hidden" />
                <CardTitle className="type-xl font-(--weight-brand-heavy)">FlappyAisha</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-(--space-s)">
                <ul className="flex flex-col gap-(--space-xs) type-s">
                  <li className="flex items-center justify-between gap-(--space-s)">
                    <span>Fly past a tower</span>
                    <span className="tabular-nums text-muted-foreground">1</span>
                  </li>
                  <li className="flex items-center justify-between gap-(--space-s)">
                    <span>Catch a golden snitch</span>
                    <span className="tabular-nums text-muted-foreground">5</span>
                  </li>
                </ul>
                <SoundSwitch muted={snap.muted} onMutedChange={setMuted} />
              </CardContent>
              <CardFooter className="flex-col">
                <Button className="w-full" onClick={() => game.newGame()} autoFocus>
                  <PlayIcon />
                  Play
                </Button>
                <p className="type-xs text-muted-foreground short:hidden">Space, click or tap to fly · P to pause</p>
              </CardFooter>
            </Card>
          )
        }
      >
        <canvas
          ref={canvasRef}
          aria-label="FlappyAisha sky"
          className="block size-full touch-none rounded-m bg-background select-none"
          onPointerDown={(e) => {
            e.preventDefault()
            game.flap()
          }}
        />
      </GameShell>

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
        newHighScore={snap.newBest}
        onPlayAgain={() => game.newGame()}
        onMenu={() => game.toMenu()}
      />
    </>
  )
}
