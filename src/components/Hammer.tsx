import { useImperativeHandle, useRef, type Ref } from 'react'

const PX = 4
// Head centre, where the hammer strikes, in sprite pixels (the sprite is 12×16).
const STRIKE = { x: 6, y: 2.5 }

export interface HammerHandle {
  move: (x: number, y: number) => void
  swing: (x: number, y: number, touch: boolean) => void
  hide: () => void
}

function restart(el: Element | null, className: string) {
  if (!el) return
  el.classList.remove(className)
  el.getBoundingClientRect() // Force a reflow so the animation plays again.
  el.classList.add(className)
}

/** Pixel hammer that follows the pointer and swings on each press. Positioned via refs to avoid re-renders. */
export function Hammer({ ref }: { ref: Ref<HammerHandle> }) {
  const holder = useRef<HTMLDivElement>(null)
  const head = useRef<SVGSVGElement>(null)
  const impact = useRef<HTMLSpanElement>(null)
  const hideTimer = useRef(0)

  useImperativeHandle(ref, () => {
    const place = (x: number, y: number) => {
      const el = holder.current
      if (!el) return
      el.style.transform = `translate(${x - STRIKE.x * PX}px, ${y - STRIKE.y * PX}px)`
      el.style.opacity = '1'
    }
    return {
      move: place,
      swing(x, y, touch) {
        place(x, y)
        restart(head.current, 'whack-swing')
        restart(impact.current, 'whack-impact')
        window.clearTimeout(hideTimer.current)
        // Touch has no hover, so show the hammer only around each tap.
        if (touch) hideTimer.current = window.setTimeout(() => holder.current && (holder.current.style.opacity = '0'), 450)
      },
      hide() {
        if (holder.current) holder.current.style.opacity = '0'
      },
    }
  }, [])

  return (
    <div ref={holder} aria-hidden className="pointer-events-none absolute top-0 left-0 z-10 opacity-0">
      <span
        ref={impact}
        className="absolute size-12 rounded-full shadow-[0_0_0_4px_var(--neutral-10)] opacity-0"
        style={{ left: STRIKE.x * PX - 24, top: STRIKE.y * PX - 24 }}
      />
      <svg
        ref={head}
        width={12 * PX}
        height={16 * PX}
        viewBox="0 0 12 16"
        shapeRendering="crispEdges"
        className="whack-hammer"
        style={{ transformOrigin: `${6 * PX}px ${16 * PX}px` }}
      >
        {/* Handle */}
        <rect x={4} y={5} width={4} height={11} fill="#000" />
        <rect x={5} y={5} width={2} height={10} fill="#b8641f" />
        <rect x={5} y={5} width={1} height={10} fill="#e8a24a" />
        {/* Head */}
        <rect x={0} y={0} width={12} height={5} fill="#000" />
        <rect x={1} y={1} width={10} height={3} fill="#8a8f98" />
        <rect x={1} y={1} width={10} height={1} fill="#c5cad3" />
        <rect x={1} y={3} width={10} height={1} fill="#4a4f58" />
      </svg>
    </div>
  )
}
