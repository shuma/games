import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { BackButton } from './BackButton'
import { FullscreenButton } from './FullscreenButton'

interface Props {
  onExit: () => void
  /** Width ÷ height of the play area. */
  ratio: number
  /** Stats and actions shown in the top bar between Back and Fullscreen. */
  hud: ReactNode
  /** Start card shown over the play area. */
  overlay?: ReactNode
  /** On-screen controls: below the play area in portrait, beside it in landscape (touch only). */
  controls?: ReactNode
  children: ReactNode
}

/**
 * Full-viewport game layout. The play area keeps its aspect ratio and grows to the largest size that
 * fits beside the top bar (and touch controls), in any orientation. Sizes come from container units
 * on <main>, so nothing needs measuring in JS.
 */
export function GameShell({ onExit, ratio, hud, overlay, controls, children }: Props) {
  return (
    <main
      className={cn(
        'game-shell h-dvh overflow-hidden [container-type:size] [--bar:3rem] [--controls-h:0px] [--controls-w:0px]',
        controls && 'pointer-coarse:portrait:[--controls-h:11.5rem] pointer-coarse:landscape:[--controls-w:11.5rem]',
      )}
      style={{ '--ratio': ratio } as CSSProperties}
    >
      <div className="mx-auto flex h-full w-[max(var(--fit),min(100cqw,22rem))] flex-col gap-(--space-s) [--fit:min(calc(100cqw-var(--controls-w)),calc((100cqh-var(--bar)-var(--space-s)-var(--controls-h))*var(--ratio)))]">
        <div className="flex h-(--bar) shrink-0 items-center gap-(--space-xs)">
          <BackButton onClick={onExit} />
          <div className="flex min-w-0 flex-1 items-center justify-between gap-(--space-s)">{hud}</div>
          <FullscreenButton />
        </div>
        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-(--space-s) pointer-coarse:landscape:flex-row">
          <div className="relative aspect-(--ratio) w-(--fit) max-w-full shrink-0">{children}</div>
          {controls}
          {overlay && (
            <div className="absolute inset-0 flex justify-center overflow-auto py-(--space-s)">
              {/* m-auto centres the card yet keeps its top reachable when it's taller than the screen. */}
              <div className="m-auto w-full max-w-xs">{overlay}</div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
