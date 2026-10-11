import { useId } from 'react'
import { Switch } from '@/components/ui/switch'

export function SoundSwitch({ muted, onMutedChange }: { muted: boolean; onMutedChange: (muted: boolean) => void }) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-(--space-xs)">
      <label htmlFor={id} className="type-s font-(--weight-ui-medium)">
        Sound
      </label>
      <Switch id={id} checked={!muted} onCheckedChange={(on) => onMutedChange(!on)} />
    </div>
  )
}
