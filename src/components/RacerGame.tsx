import { HeartIcon, PauseIcon, PlayIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useGameCanvas } from '@/lib/use-game-canvas'
import { MONEY_POINTS } from '@/racer/art'
import { HEIGHT, LIVES, RacerGame as Engine, WIDTH } from '@/racer/game'
import { GameOverDialog } from './GameOverDialog'
import { GameShell } from './GameShell'
import { PauseDialog } from './PauseDialog'
import { SoundSwitch } from './SoundSwitch'
import { SpriteFrames } from './SpriteFrames'
import { Stat } from './Stat'

const JUMP_KEYS = new Set([' ', 'ArrowUp', 'w', 'W'])

const RULES = [
  { label: 'Coin', value: `$${MONEY_POINTS.coin}` },
  { label: 'Cash', value: `$${MONEY_POINTS.bill}` },
  { label: 'Money bag', value: `$${MONEY_POINTS.bag}` },
  { label: 'Drive into fire', value: '−1 life' },
]

export function RacerGame({ onExit }: { onExit: () => void }) {
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
      if (JUMP_KEYS.has(e.key) && (game.phase === 'playing' || game.phase === 'countdown') && !game.paused) {
        e.preventDefault()
        if (!e.repeat) game.jump()
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

  const racing = snap.phase === 'playing' || snap.phase === 'countdown'

  return (
    <>
      <GameShell
        onExit={onExit}
        ratio={WIDTH / HEIGHT}
        hud={
          <>
            <div className="flex items-end gap-(--space-l)">
              <Stat label="Money" value={snap.score} />
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
              {racing && (
                <Button variant="ghost" size="icon" aria-label="Pause" onClick={() => game.setPaused(true)}>
                  <PauseIcon />
                </Button>
              )}
            </div>
          </>
        }
        overlay={
          snap.phase === 'menu' && (
            <Card>
              <CardHeader className="justify-items-center text-center">
                <SpriteFrames src="/sprites/racer.png" frames={4} animated interval={90} className="h-[51px] w-24 short:hidden" />
                <CardTitle className="type-xl font-(--weight-brand-heavy)">DagRacer</CardTitle>
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
                <p className="type-xs text-muted-foreground short:hidden">Space, click or tap to jump · P to pause</p>
              </CardFooter>
            </Card>
          )
        }
      >
        <canvas
          ref={canvasRef}
          aria-label="DagRacer road"
          className="block size-full touch-none rounded-m bg-background select-none"
          onPointerDown={(e) => {
            e.preventDefault()
            game.jump()
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
        detail={`Jumped ${snap.fires} ${snap.fires === 1 ? 'fire' : 'fires'}`}
        newHighScore={snap.newBest}
        onPlayAgain={() => game.newGame()}
        onMenu={() => game.toMenu()}
      />
    </>
  )
}
