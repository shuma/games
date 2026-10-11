import { useCallback, useEffect, useState } from 'react'
import { GameCanvas } from './GameCanvas'
import { GameOverDialog } from './GameOverDialog'
import { GameShell } from './GameShell'
import { Hud } from './Hud'
import { PauseDialog } from './PauseDialog'
import { StartScreen } from './StartScreen'
import { TouchControls } from './TouchControls'
import { Game, HEIGHT, WIDTH } from '@/game/game'
import type { Dir } from '@/game/movement'

const KEY_DIRS: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
}

export function PacmanGame({ onExit }: { onExit: () => void }) {
  const [game] = useState(() => new Game())
  const [snap, setSnap] = useState(() => game.snapshot)

  useEffect(() => game.subscribe(setSnap), [game])

  const setDirection = useCallback((dir: Dir) => game.setDirection(dir), [game])
  const setMuted = useCallback((muted: boolean) => game.setMuted(muted), [game])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const dir = KEY_DIRS[e.key] ?? KEY_DIRS[e.key.toLowerCase()]
      if (dir) {
        e.preventDefault()
        game.setDirection(dir)
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
        ratio={WIDTH / HEIGHT}
        hud={<Hud snap={snap} onPause={() => game.setPaused(true)} />}
        controls={<TouchControls onDirection={setDirection} />}
        overlay={
          snap.phase === 'menu' && (
            <StartScreen sprites={game.sprites} muted={snap.muted} onMutedChange={setMuted} onStart={() => game.newGame()} />
          )
        }
      >
        <GameCanvas game={game} onSwipe={setDirection} />
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
        detail={`Reached level ${snap.level}`}
        newHighScore={snap.newHighScore}
        onPlayAgain={() => game.newGame()}
        onMenu={() => game.toMenu()}
      />
    </>
  )
}
