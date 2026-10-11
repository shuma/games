import { PauseIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Snapshot } from '@/game/game'
import { SpriteFrames } from './SpriteFrames'
import { Stat } from './Stat'

export function Hud({ snap, onPause }: { snap: Snapshot; onPause: () => void }) {
  const spareLives = Math.max(0, snap.lives - 1)
  const playing = snap.phase !== 'menu' && snap.phase !== 'gameOver'

  return (
    <>
      <div className="flex items-end gap-(--space-l)">
        <Stat label="Score" value={snap.score} />
        <Stat label="Best" value={snap.highScore} />
      </div>
      <div className="flex items-center gap-(--space-s)">
        {playing && (
          <>
            <div className="flex items-center gap-(--space-xxs)" aria-label={`${spareLives} spare lives`}>
              {Array.from({ length: spareLives }, (_, i) => (
                <SpriteFrames key={i} className="size-6" />
              ))}
            </div>
            <Badge variant="secondary" className="max-sm:hidden">
              Level {snap.level}
            </Badge>
            <Button variant="ghost" size="icon" aria-label="Pause" onClick={onPause}>
              <PauseIcon />
            </Button>
          </>
        )}
      </div>
    </>
  )
}
