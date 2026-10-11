import { MaximizeIcon, MinimizeIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Older Safari (iPad) only exposes the prefixed API; iPhone Safari has none at all.
type WebkitDocument = Document & {
  webkitFullscreenEnabled?: boolean
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => void
}
type WebkitElement = HTMLElement & { webkitRequestFullscreen?: () => void }

const doc = document as WebkitDocument
const supported = Boolean(doc.fullscreenEnabled || doc.webkitFullscreenEnabled)
const isFullscreen = () => Boolean(doc.fullscreenElement || doc.webkitFullscreenElement)

function toggleFullscreen() {
  if (isFullscreen()) {
    if (doc.exitFullscreen) void doc.exitFullscreen()
    else doc.webkitExitFullscreen?.()
    return
  }
  const root = document.documentElement as WebkitElement
  if (root.requestFullscreen) void root.requestFullscreen().catch(() => {})
  else root.webkitRequestFullscreen?.()
}

/**
 * On touch devices, go fullscreen on the first tap (browsers only allow it from a gesture).
 * Once the player leaves fullscreen, leave the choice to the button instead of re-entering on every tap.
 */
export function useAutoFullscreen() {
  useEffect(() => {
    if (!supported || !window.matchMedia('(pointer: coarse)').matches) return
    let wasFullscreen = false
    const onTap = () => {
      if (!isFullscreen()) toggleFullscreen()
    }
    const onChange = () => {
      if (isFullscreen()) wasFullscreen = true
      else if (wasFullscreen) stop()
    }
    const stop = () => {
      window.removeEventListener('pointerup', onTap, true)
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
    // pointerup counts as a user gesture everywhere; pointerdown does not in some mobile browsers.
    window.addEventListener('pointerup', onTap, true)
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return stop
  }, [])
}

/** Toggles fullscreen for the whole page. F also toggles. Hidden where the browser can't go fullscreen. */
export function FullscreenButton({ className }: { className?: string }) {
  const [active, setActive] = useState(isFullscreen)

  useEffect(() => {
    const onChange = () => setActive(isFullscreen())
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || e.key.toLowerCase() !== 'f') return
      toggleFullscreen()
    }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  if (!supported) return null
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={cn(className)}
      aria-label={active ? 'Exit fullscreen' : 'Fullscreen'}
      title={active ? 'Exit fullscreen (F)' : 'Fullscreen (F)'}
      onClick={toggleFullscreen}
    >
      {active ? <MinimizeIcon /> : <MaximizeIcon />}
    </Button>
  )
}
