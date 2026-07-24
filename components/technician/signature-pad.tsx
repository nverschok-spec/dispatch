"use client"

import { useEffect, useRef, useState } from "react"
import { Eraser } from "lucide-react"

export function SignaturePad({ onChange }: { onChange?: (hasSignature: boolean) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [hasInk, setHasInk] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    // Use the themed foreground color for the ink.
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--foreground")
      ? "oklch(0.208 0.042 265.75)"
      : "#0f172a"
  }, [])

  function getPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault()
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    drawing.current = true
    const { x, y } = getPoint(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    e.preventDefault()
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    const { x, y } = getPoint(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    if (!hasInk) {
      setHasInk(true)
      onChange?.(true)
    }
  }

  function end() {
    drawing.current = false
  }

  function clear() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasInk(false)
    onChange?.(false)
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        className="h-40 w-full touch-none rounded-xl border-2 border-dashed border-border bg-muted/40"
        aria-label="Unterschriftenfeld"
      />
      {!hasInk && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          Hier unterschreiben
        </p>
      )}
      <button
        type="button"
        onClick={clear}
        className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-card px-2 py-1 text-xs font-medium text-muted-foreground shadow-sm ring-1 ring-border transition-colors hover:text-foreground"
      >
        <Eraser className="h-3.5 w-3.5" aria-hidden="true" />
        Löschen
      </button>
    </div>
  )
}
