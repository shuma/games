import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SoundSwitch } from './SoundSwitch'

interface Props {
  open: boolean
  muted: boolean
  onMutedChange: (muted: boolean) => void
  onResume: () => void
  onQuit: () => void
}

export function PauseDialog({ open, muted, onMutedChange, onResume, onQuit }: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onResume()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Paused</DialogTitle>
        </DialogHeader>
        <SoundSwitch muted={muted} onMutedChange={onMutedChange} />
        <DialogFooter>
          <Button variant="outline" onClick={onQuit}>
            Quit
          </Button>
          <Button onClick={onResume} autoFocus>
            Resume
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
