import { PlayIcon } from 'lucide-react'
import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { Sprites } from '@/game/sprites'
import { SpriteFrames } from './SpriteFrames'
import { SoundSwitch } from './SoundSwitch'

interface Props {
  sprites: Sprites
  muted: boolean
  onMutedChange: (muted: boolean) => void
  onStart: () => void
}

export function StartScreen({ sprites, muted, onMutedChange, onStart }: Props) {
  const icons = useMemo(
    () => ({ pizza: sprites.pizza.toDataURL(), burger: sprites.burger.toDataURL() }),
    [sprites],
  )

  return (
    <Card>
      <CardHeader className="justify-items-center text-center">
        <SpriteFrames animated className="size-20 short:hidden" />
        <CardTitle className="type-xl font-(--weight-brand-heavy)">Adam-Man</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-(--space-s)">
        <ul className="flex flex-col gap-(--space-xs) type-s">
          <li className="flex items-center gap-(--space-s)">
            <img src={icons.pizza} alt="" className="size-6 object-contain [image-rendering:pixelated]" />
            <span className="flex-1">Pizza</span>
            <span className="tabular-nums text-muted-foreground">10</span>
          </li>
          <li className="flex items-center gap-(--space-s)">
            <img src={icons.burger} alt="" className="size-6 object-contain [image-rendering:pixelated]" />
            <span className="flex-1">Burger — ghosts turn edible</span>
            <span className="tabular-nums text-muted-foreground">50</span>
          </li>
        </ul>
        <SoundSwitch muted={muted} onMutedChange={onMutedChange} />
      </CardContent>
      <CardFooter className="flex-col">
        <Button className="w-full" onClick={onStart} autoFocus>
          <PlayIcon />
          Play
        </Button>
        <p className="type-xs text-muted-foreground short:hidden">Arrow keys, WASD or swipe · P to pause</p>
      </CardFooter>
    </Card>
  )
}
