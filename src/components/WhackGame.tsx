import { PauseIcon, PlayIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { POINTS, WhackGame as Engine, type HoleView } from '@/whack/game'
import { GameOverDialog } from './GameOverDialog'
import { GameShell } from './GameShell'
import { Hammer, type HammerHandle } from './Hammer'
import { PauseDialog } from './PauseDialog'
import { SoundSwitch } from './SoundSwitch'
import { SpriteFrames } from './SpriteFrames'
import { Stat } from './Stat'

// Number keys follow the numpad layout: 7 8 9 is the top row.
const KEY_TO_HOLE: Record<string, number> = { '7': 0, '8': 1, '9': 2, '4': 3, '5': 4, '6': 5, '1': 6, '2': 7, '3': 8 }

const RULES = [
  { label: 'Whack dad', points: POINTS.dad },
  { label: 'Whack golden dad', points: POINTS.golden },
  { label: 'Whack Adam by mistake', points: POINTS.adam },
]

export function WhackGame({ onExit }: { onExit: () => void }) {
  const [game] = useState(() => new Engine())
  const [snap, setSnap] = useState(() => game.snapshot)

  useEffect(() => game.subscribe(setSnap), [game])
  useEffect(() => game.start(), [game])
  const setMuted = useCallback((muted: boolean) => game.setMuted(muted), [game])
  const hammer = useRef<HammerHandle>(null)
  const playing = snap.phase === 'playing'

  const local = (e: PointerEvent<HTMLElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    return [e.clientX - box.left, e.clientY - box.top] as const
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key in KEY_TO_HOLE) {
        if (!e.repeat) game.whack(KEY_TO_HOLE[e.key])
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

  return (
    <>
      <GameShell
        onExit={onExit}
        ratio={1}
        hud={
          <>
            <div className="flex items-end gap-(--space-l)">
              <Stat label="Score" value={snap.score} />
              <Stat label="Best" value={snap.best} />
              <Stat label="Time" value={snap.timeLeft} />
            </div>
            {snap.phase === 'playing' && (
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
                <SpriteFrames src="/sprites/dad.png" animated interval={180} className="size-18 short:hidden" />
                <CardTitle className="type-xl font-(--weight-brand-heavy)">Whack-a-Dad</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-(--space-s)">
                <ul className="flex flex-col gap-(--space-xs) type-s">
                  {RULES.map((r) => (
                    <li key={r.label} className="flex items-center justify-between gap-(--space-s)">
                      <span>{r.label}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{r.points > 0 ? `+${r.points}` : r.points}</span>
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
                <p className="type-xs text-muted-foreground short:hidden">Tap, click or press 1–9 · P to pause</p>
              </CardFooter>
            </Card>
          )
        }
      >
        <div
          className={cn('size-full', playing && 'cursor-none')}
          onPointerMove={(e) => playing && e.pointerType === 'mouse' && hammer.current?.move(...local(e))}
          onPointerDown={(e) => playing && hammer.current?.swing(...local(e), e.pointerType !== 'mouse')}
          onPointerLeave={() => hammer.current?.hide()}
        >
          {playing && <Hammer ref={hammer} />}
          <div className="grid size-full touch-none grid-cols-3 grid-rows-3 gap-(--space-s) rounded-m bg-card p-(--space-m) shadow-(--shadow-m) select-none">
            {snap.holes.map((hole, i) => (
              <Hole key={i} index={i} hole={hole} onWhack={() => game.whack(i)} />
            ))}
          </div>
        </div>
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
        detail={`Whacked dad ${snap.whacked} ${snap.whacked === 1 ? 'time' : 'times'}`}
        newHighScore={snap.newBest}
        onPlayAgain={() => game.newGame()}
        onMenu={() => game.toMenu()}
      />
    </>
  )
}

export function Hole({ index, hole, onWhack }: { index: number; hole: HoleView; onWhack: () => void }) {
  const isAdam = hole.who === 'adam'
  return (
    <button
      type="button"
      aria-label={`Hole ${index + 1}`}
      className="relative min-h-0 cursor-[inherit] rounded-m outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      onPointerDown={(e) => {
        e.preventDefault()
        onWhack()
      }}
      // Keyboard activation; pointer presses are already handled above.
      onClick={(e) => e.detail === 0 && onWhack()}
    >
      <span className="absolute inset-x-[8%] bottom-[8%] h-1/4 rounded-full bg-(--neutral-1)" />
      {/* Clip at the hole's middle so the character rises out of it. */}
      <span className="absolute inset-x-0 top-0 bottom-[20.5%] overflow-hidden">
        <span
          className={cn(
            'absolute inset-x-[14%] bottom-0 flex justify-center transition-transform duration-(--motion-duration) ease-(--motion-easing)',
            hole.up ? 'translate-y-[8%]' : 'translate-y-full',
          )}
        >
          {hole.who && (
            <SpriteFrames
              src={isAdam ? '/sprites/face.png' : '/sprites/dad.png'}
              frame={hole.hit ? 2 : isAdam ? 0 : 1}
              className={cn(
                'aspect-square w-full origin-bottom transition-transform duration-(--motion-duration)',
                hole.hit && 'scale-y-75',
                hole.who === 'golden' && 'whack-golden',
              )}
            />
          )}
        </span>
      </span>
      {hole.popupId > 0 && (
        <span
          key={hole.popupId}
          className={cn(
            'whack-popup pointer-events-none absolute inset-x-0 top-[10%] text-center type-l font-(--weight-brand-heavy)',
            hole.popup.startsWith('+') ? 'text-primary' : 'text-(--error)',
          )}
        >
          {hole.popup}
        </span>
      )}
    </button>
  )
}
