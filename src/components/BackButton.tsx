import { ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" className="shrink-0 max-sm:px-(--space-xs)" onClick={onClick}>
      <ArrowLeftIcon />
      <span className="max-sm:sr-only">Games</span>
    </Button>
  )
}
