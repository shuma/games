import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const CYCLE = [0, 1, 2, 1]

/** One frame of a horizontal spritesheet (3 frames by default), optionally animated. */
export function SpriteFrames({
  src = '/sprites/face.png',
  frame = 0,
  frames = 3,
  animated = false,
  interval = 140,
  className,
}: {
  src?: string
  frame?: number
  frames?: number
  animated?: boolean
  interval?: number
  className?: string
}) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!animated || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setTick((t) => t + 1), interval)
    return () => window.clearInterval(id)
  }, [animated, interval])

  // Three-frame sheets ping-pong (0,1,2,1); longer sheets loop straight through.
  const shown = !animated ? frame : frames === 3 ? CYCLE[tick % CYCLE.length] : tick % frames
  return (
    <span
      aria-hidden
      className={cn('inline-block shrink-0 bg-no-repeat [image-rendering:pixelated]', className)}
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: `${frames * 100}% 100%`,
        backgroundPosition: `${(shown / (frames - 1)) * 100}% 0`,
      }}
    />
  )
}
