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
    mute,
    unmute,
    toggleMute,
    isMuted: () => isMutedRef.current
  }
}

