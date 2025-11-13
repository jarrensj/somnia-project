'use client'

import { useCallback, useRef } from 'react'

export type NotificationType = 'transfer' | 'contract' | 'highValue' | 'custom'

interface NotificationConfig {
  frequency: number
  duration: number
  volume: number
  waveType: OscillatorType
}

const NOTIFICATION_SOUNDS: Record<NotificationType, NotificationConfig> = {
  transfer: {
    frequency: 800,
    duration: 0.5,
    volume: 0.3,
    waveType: 'sine'
  },
  contract: {
    frequency: 600,
    duration: 0.4,
    volume: 0.25,
    waveType: 'square'
  },
  highValue: {
    frequency: 1000,
    duration: 0.6,
    volume: 0.35,
    waveType: 'sine'
  },
  custom: {
    frequency: 700,
    duration: 0.5,
    volume: 0.3,
    waveType: 'triangle'
  }
}

export function useNotifications() {
  const isMutedRef = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return audioContextRef.current
  }, [])

  const playSound = useCallback((config: NotificationConfig) => {
    if (isMutedRef.current) return

    try {
      const audioContext = getAudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = config.frequency
      oscillator.type = config.waveType
      
      gainNode.gain.setValueAtTime(config.volume, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + config.duration)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + config.duration)
    } catch (error) {
      console.error('Failed to play notification sound:', error)
    }
  }, [getAudioContext])

  const playNotification = useCallback((
    type: NotificationType = 'transfer',
    count: number = 1,
    delayMs: number = 600
  ) => {
    const config = NOTIFICATION_SOUNDS[type]
    
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        playSound(config)
      }, i * delayMs)
    }
  }, [playSound])

  const playCustomSound = useCallback((
    frequency: number,
    duration: number = 0.5,
    volume: number = 0.3,
    waveType: OscillatorType = 'sine'
  ) => {
    playSound({ frequency, duration, volume, waveType })
  }, [playSound])

  const playTransferSound = useCallback((amount: number) => {
    // Calculate frequency based on transfer amount
    // Use logarithmic scale for better perception across wide value ranges
    // Lower amounts (closer to 1 STT) = lower pitch, higher amounts = higher pitch
    const minFreq = 400  // Low note for small amounts
    const maxFreq = 1200 // High note for large amounts
    
    // Log scale: log(amount) maps to frequency range
    // Clamp amount between 0.1 and 1000 for reasonable frequency range
    const clampedAmount = Math.max(0.1, Math.min(1000, amount))
    const logMin = Math.log10(0.1)
    const logMax = Math.log10(1000)
    const logAmount = Math.log10(clampedAmount)
    
    // Map logarithmic amount to frequency range
    const normalizedValue = (logAmount - logMin) / (logMax - logMin)
    const frequency = minFreq + (normalizedValue * (maxFreq - minFreq))
    
    playSound({ frequency, duration: 0.5, volume: 0.3, waveType: 'sine' })
  }, [playSound])

  const mute = useCallback(() => {
    isMutedRef.current = true
  }, [])

  const unmute = useCallback(() => {
    isMutedRef.current = false
  }, [])

  const toggleMute = useCallback(() => {
    isMutedRef.current = !isMutedRef.current
    return isMutedRef.current
  }, [])

  return {
    playNotification,
    playCustomSound,
    playTransferSound,
    mute,
    unmute,
    toggleMute,
    isMuted: () => isMutedRef.current
  }
}

