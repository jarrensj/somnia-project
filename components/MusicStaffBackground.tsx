'use client'

import { useState, useImperativeHandle, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MusicNote {
  id: string
  x: number
  y: number
  symbol: string
  color: string
  size: number
  duration: number
}

export interface MusicStaffBackgroundRef {
  spawnNote: (frequency?: number) => void
}

const MUSIC_SYMBOLS = ['♪', '♫', '♬']

export const MusicStaffBackground = forwardRef<MusicStaffBackgroundRef>((props, ref) => {
  const [notes, setNotes] = useState<MusicNote[]>([])

  const spawnNote = (frequency: number = 800) => {
    // Map frequency to visual properties
    const minFreq = 500
    const maxFreq = 1400
    const normalizedFreq = (frequency - minFreq) / (maxFreq - minFreq)
    
    // Higher frequencies = smaller, faster notes with warmer colors
    // Lower frequencies = larger, slower notes with cooler colors
    const hue = Math.round(180 + (normalizedFreq * 60)) // Blue to orange
    const size = 24 + (1 - normalizedFreq) * 20 // 24-44px
    const duration = 2 + (1 - normalizedFreq) * 2 // 2-4 seconds
    
    const note: MusicNote = {
      id: `${Date.now()}-${Math.random()}`,
      x: Math.random() * 100, // percentage
      y: 20 + Math.random() * 60, // start between 20-80% from top
      symbol: MUSIC_SYMBOLS[Math.floor(Math.random() * MUSIC_SYMBOLS.length)],
      color: `hsl(${hue}, 70%, 50%)`,
      size,
      duration
    }
    
    setNotes(prev => [...prev, note])
    
    // Remove note after animation completes
    setTimeout(() => {
      setNotes(prev => prev.filter(n => n.id !== note.id))
    }, duration * 1000)
  }

  useImperativeHandle(ref, () => ({
    spawnNote
  }))

  return (
    <>
      {/* Music Staff Lines */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, groupIndex) => (
          <div
            key={groupIndex}
            className="relative"
            style={{
              marginTop: groupIndex === 0 ? '80px' : '60px',
            }}
          >
            {/* Treble Clef */}
            <div 
              className="absolute left-4 z-10"
              style={{
                top: '-18px',
                fontSize: '96px',
                color: '#8b7355',
                opacity: 0.4,
                lineHeight: 1,
                fontFamily: 'serif',
              }}
            >
              𝄞
            </div>

            {/* Five staff lines per group */}
            {[...Array(5)].map((_, lineIndex) => (
              <div
                key={lineIndex}
                className="w-full h-[1.5px] bg-[#8b7355]/25"
                style={{
                  marginTop: lineIndex === 0 ? '0' : '14px',
                  boxShadow: '0 0.5px 0 rgba(139, 115, 85, 0.08)',
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Floating Music Notes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{
                x: `${note.x}vw`,
                y: `${note.y}vh`,
                opacity: 0,
                scale: 0,
                rotate: -20
              }}
              animate={{
                y: `${note.y - 50}vh`,
                opacity: [0, 0.5, 0.4, 0],
                scale: [0, 1, 1, 0.9],
                rotate: 20
              }}
              exit={{
                opacity: 0,
                scale: 0
              }}
              transition={{
                duration: note.duration,
                ease: "easeInOut",
                opacity: {
                  times: [0, 0.15, 0.75, 1],
                  duration: note.duration
                }
              }}
              style={{
                position: 'absolute',
                fontSize: `${note.size}px`,
                color: note.color,
                textShadow: '0 2px 8px rgba(0,0,0,0.15)',
                filter: 'drop-shadow(0 0 2px rgba(255,255,255,0.3))'
              }}
            >
              {note.symbol}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  )
})

MusicStaffBackground.displayName = 'MusicStaffBackground'

