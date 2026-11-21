import { useEffect, useRef, useState } from 'react'

export function HoldButton({
  label,
  onHold,
  onRelease,
  testId = 'hold',
}: {
  label: string
  onHold: () => void
  onRelease?: () => void
  testId?: string
}) {
  const [progress, setProgress] = useState(0)
  const frame = useRef<number | null>(null)
  const done = useRef(false)

  const stop = () => {
    if (frame.current) cancelAnimationFrame(frame.current)
    frame.current = null
    if (!done.current) setProgress(0)
    else onRelease?.()
  }

  const start = () => {
    done.current = false
    const t0 = performance.now()
    const step = (now: number) => {
      const value = Math.min(1, (now - t0) / 600)
      setProgress(value)
      if (value >= 1) {
        done.current = true
        navigator.vibrate?.(12)
        onHold()
        return
      }
      frame.current = requestAnimationFrame(step)
    }
    frame.current = requestAnimationFrame(step)
  }

  return (
    <button
      type="button"
      className="hold"
      data-testid={testId}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        start()
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
    >
      <span className="hold-fill" style={{ transform: `scaleX(${progress})` }} />
      <span>{label}</span>
    </button>
  )
}

export function useBeat(ms: number, enabled: boolean, onEnd: () => void, token: string | number = 0) {
  const saved = useRef(onEnd)
  saved.current = onEnd
  useEffect(() => {
    if (!enabled) return
    const timer = window.setTimeout(() => saved.current(), ms)
    return () => window.clearTimeout(timer)
  }, [ms, enabled, token])
}

export function Timer({ seconds }: { seconds: number }) {
  return (
    <span className="timer" aria-label={`${seconds} ثانية`}>
      0:{String(Math.max(0, seconds)).padStart(2, '0')}
    </span>
  )
}

export function useCountdown(ms: number, enabled: boolean, token: string | number = 0) {
  const [left, setLeft] = useState(Math.ceil(ms / 1000))
  useEffect(() => {
    if (!enabled) return
    setLeft(Math.ceil(ms / 1000))
    const started = Date.now()
    const timer = window.setInterval(() => {
      setLeft(Math.max(0, Math.ceil((ms - (Date.now() - started)) / 1000)))
    }, 200)
    return () => window.clearInterval(timer)
  }, [ms, enabled, token])
  return left
}
