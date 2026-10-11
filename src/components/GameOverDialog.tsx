import { RotateCcwIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Props {
  open: boolean
  score: number
  detail?: string
  newHighScore: boolean
  onPlayAgain: () => void
  onMenu: () => void
}

export function GameOverDialog({ open, score, detail, newHighScore, onPlayAgain, onMenu }: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onMenu()} disablePointerDismissal>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Game over</DialogTitle>
          {detail && <DialogDescription>{detail}</DialogDescription>}
        </DialogHeader>
        <div className="flex items-center gap-(--space-s)">
          <span className="type-xxl font-(--weight-data-heavy) tabular-nums">{score.toLocaleString()}</span>
          {newHighScore && <Badge>New high score</Badge>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onMenu}>
            Menu
          </Button>
          <Button onClick={onPlayAgain} autoFocus>
            <RotateCcwIcon />
            Play again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
