import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Dir } from '@/game/movement'

const PADS: { dir: Dir; label: string; icon: typeof ChevronUpIcon; area: string }[] = [
  { dir: 'up', label: 'Up', icon: ChevronUpIcon, area: 'col-start-2 row-start-1' },
  { dir: 'left', label: 'Left', icon: ChevronLeftIcon, area: 'col-start-1 row-start-2' },
  { dir: 'right', label: 'Right', icon: ChevronRightIcon, area: 'col-start-3 row-start-2' },
  { dir: 'down', label: 'Down', icon: ChevronDownIcon, area: 'col-start-2 row-start-3' },
]

export function TouchControls({ onDirection }: { onDirection: (dir: Dir) => void }) {
  return (
    <div className="mx-auto hidden grid-cols-3 grid-rows-3 gap-(--space-xxs) pointer-coarse:grid">
      {PADS.map(({ dir, label, icon: Icon, area }) => (
        <Button
          key={dir}
          variant="secondary"
          size="icon-lg"
          aria-label={label}
          className={area}
          onPointerDown={(e) => {
            e.preventDefault()
            onDirection(dir)
          }}
        >
          <Icon />
        </Button>
      ))}
    </div>
  )
}
