import { useEffect, type RefObject } from 'react'

/** Keeps a canvas backing store matched to its CSS size and runs `attach` (which returns a stop function). */
export function useGameCanvas(
  ref: RefObject<HTMLCanvasElement | null>,
  width: number,
  height: number,
  attach: (canvas: HTMLCanvasElement) => () => void,
) {
  useEffect(() => {
    const canvas = ref.current!
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(canvas.clientWidth * dpr)
      canvas.height = Math.round((canvas.width * height) / width)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    const stop = attach(canvas)
    return () => {
      observer.disconnect()
      stop()
    }
  }, [ref, width, height, attach])
}
