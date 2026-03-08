"use client"

import { useEffect, useState } from "react"

interface AudiowaveProps {
  levels: number[]
  isRecording: boolean
  color?: string
}

export function Audiowave({ levels, isRecording, color = "var(--iv-accent)" }: AudiowaveProps) {
  const [displayLevels, setDisplayLevels] = useState<number[]>(Array(32).fill(0))

  useEffect(() => {
    // Pad or expand the levels array to 32 bars
    if (levels.length === 8) {
      // Interpolate 8 levels to 32 bars for smoother visualization
      const expanded = Array(32).fill(0)
      for (let i = 0; i < 32; i++) {
        const sourceIdx = (i / 32) * 8
        const idx = Math.floor(sourceIdx)
        const frac = sourceIdx - idx
        const val1 = levels[Math.min(idx, levels.length - 1)]
        const val2 = levels[Math.min(idx + 1, levels.length - 1)]
        expanded[i] = val1 * (1 - frac) + val2 * frac
      }
      setDisplayLevels(expanded)
    } else {
      setDisplayLevels(levels)
    }
  }, [levels])

  if (!isRecording) {
    return (
      <div className="flex gap-0.5 items-center justify-center h-12">
        {Array(32)
          .fill(0)
          .map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-full transition-all"
              style={{
                backgroundColor: color,
                height: `${2 + Math.sin(i / 4) * 2}px`,
                opacity: 0.3,
              }}
            />
          ))}
      </div>
    )
  }

  return (
    <div className="flex gap-0.5 items-center justify-center h-12 px-2">
      {displayLevels.map((level, i) => (
        <div
          key={i}
          className="flex-1 rounded-full transition-all duration-75"
          style={{
            backgroundColor: color,
            height: `${Math.max(2, level * 40)}px`,
            opacity: 0.6 + level * 0.4,
          }}
        />
      ))}
    </div>
  )
}
