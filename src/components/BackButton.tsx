import { ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" className="self-start" onClick={onClick}>
      <ArrowLeftIcon />
      Games
    </Button>
  )
}
