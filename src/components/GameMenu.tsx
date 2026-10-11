import type React from 'react'
import { PlayIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { FullscreenButton } from './FullscreenButton'
import { NyanCat } from './NyanCat'
import { SpriteFrames } from './SpriteFrames'

export type GameId = 'pacman' | 'flappy-aisha' | 'whack-a-dad' | 'catch-the-food' | 'dagracer'

const GAMES: {
  id: GameId
  name: string
  sprite: string
  spriteClass: string
  frames?: number
  stageClass: string
  bestKey: string
  blurb: string
}[] = [
  {
    id: 'pacman',
    name: 'Adam-Man',
    sprite: '/sprites/face.png',
    spriteClass: 'size-28',
    stageClass: 'bg-(--color-1-transparent)',
    bestKey: 'adam-man:high-score',
    blurb: 'Eat the pizzas, dodge dad.',
  },
  {
    id: 'flappy-aisha',
    name: 'FlappyAisha',
    sprite: '/sprites/aisha.png',
    spriteClass: 'h-28 w-[149px]',
    stageClass: 'bg-(--color-3-transparent)',
    bestKey: 'flappy-aisha:best',
    blurb: 'Fly between the castle towers.',
  },
  {
    id: 'whack-a-dad',
    name: 'Whack-a-Dad',
    sprite: '/sprites/dad.png',
    spriteClass: 'size-28',
    stageClass: 'bg-(--color-4-transparent)',
    bestKey: 'whack-a-dad:best',
    blurb: 'Bonk dad before he hides.',
  },
  {
    id: 'catch-the-food',
    name: 'Catch the Food',
    sprite: '/sprites/face.png',
    spriteClass: 'size-28',
    stageClass: 'bg-(--color-2-transparent)',
    bestKey: 'catch-the-food:best',
    blurb: 'Catch the snacks, dodge the broccoli.',
  },
  {
    id: 'dagracer',
    name: 'DagRacer',
    sprite: '/sprites/racer.png',
    spriteClass: 'h-[102px] w-48',
    frames: 4,
    stageClass: 'bg-(--color-3-transparent)',
    bestKey: 'dagracer:best',
    blurb: 'Jump the fires, grab the cash.',
  },
]

const TITLE_COLORS = ['--color-1', '--color-3', '--color-4', '--color-1', '--color-3'].map((v) => `var(${v})`)

export function GameMenu({ onPick }: { onPick: (id: GameId) => void }) {
  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-center gap-(--space-xl) p-(--space-m)">
      <div className="menu-backdrop" aria-hidden>
        <NyanCat />
      </div>
      <FullscreenButton className="absolute top-(--space-m) right-(--space-m)" />
      <h1 className="menu-title" aria-label="Games">
        {[...'Games'].map((ch, i) => (
          <span key={i} aria-hidden style={{ '--i': i, '--c': TITLE_COLORS[i] } as React.CSSProperties}>
            {ch}
          </span>
        ))}
      </h1>
      <div className="grid w-full max-w-5xl gap-(--space-m) sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((g) => {
          const best = Number(localStorage.getItem(g.bestKey)) || 0
          return (
            // The Play button stays the keyboard target; clicks anywhere on the card bubble to the same handler.
            <Card
              key={g.id}
              onClick={() => onPick(g.id)}
              className="cursor-pointer pt-0 transition-transform duration-(--motion-duration) ease-(--motion-easing) motion-safe:hover:-translate-y-(--space-xxs)"
            >
              <div className={`grid h-40 place-items-center ${g.stageClass}`}>
                <SpriteFrames src={g.sprite} frames={g.frames} animated className={g.spriteClass} />
              </div>
              <CardHeader className="justify-items-center gap-(--space-xs) text-center">
                <CardTitle className="type-l font-(--weight-brand-heavy)">{g.name}</CardTitle>
                <CardDescription>{g.blurb}</CardDescription>
                <p className="type-s text-muted-foreground">
                  {best > 0 ? (
                    <>
                      Best ·{' '}
                      <span className="font-(family-name:--font-data) font-(--weight-data-medium) text-foreground tabular-nums">
                        {best.toLocaleString()}
                      </span>
                    </>
                  ) : (
                    'No score yet'
                  )}
                </p>
              </CardHeader>
              <CardFooter className="mt-auto">
                <Button className="w-full">
                  <PlayIcon />
                  Play
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </main>
  )
}
