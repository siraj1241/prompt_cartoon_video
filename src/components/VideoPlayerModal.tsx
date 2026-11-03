'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, X, ChevronLeft, ChevronRight, Volume2, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Scene {
  order: number
  title: string
  description: string
  duration: number
  visualCues: string[]
  narration: string
  imageUrl?: string  // AI-generated image from Pollinations.ai
}

interface VideoPlayerModalProps {
  open: boolean
  onClose: () => void
  scenes: Scene[]
  prompt: string
}

/**
 * Video Player Modal — plays the AI-generated storyboard as a slideshow.
 *
 * Each scene displays:
 *   - Scene number + title
 *   - Visual description (large text)
 *   - Narration text (as "subtitles")
 *   - Visual cue tags
 *   - Animated gradient background that shifts per scene
 *
 * Auto-advances through scenes based on their duration.
 * User can pause, skip forward/back, and see a progress bar.
 */
export default function VideoPlayerModal({ open, onClose, scenes, prompt }: VideoPlayerModalProps) {
  const [currentScene, setCurrentScene] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [progress, setProgress] = useState(0) // 0-100 within current scene
  const [elapsed, setElapsed] = useState(0) // total seconds elapsed
  const [totalDuration, setTotalDuration] = useState(0)

  const scene = scenes[currentScene]

  useEffect(() => {
    if (scenes.length > 0) {
      setTotalDuration(scenes.reduce((sum, s) => sum + (s.duration || 5), 0))
    }
  }, [scenes])

  // Auto-advance timer
  useEffect(() => {
    if (!open || !playing || !scene) return

    const sceneDuration = (scene.duration || 5) * 1000 // ms
    const tickInterval = 50 // ms
    const increment = (tickInterval / sceneDuration) * 100

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment
        if (next >= 100) {
          // Move to next scene
          setCurrentScene((cs) => {
            if (cs >= scenes.length - 1) {
              setPlaying(false)
              return cs
            }
            return cs + 1
          })
          return 0
        }
        return next
      })
      setElapsed((e) => e + tickInterval / 1000)
    }, tickInterval)

    return () => clearInterval(timer)
  }, [open, playing, scene, scenes.length])

  // Reset when opened
  useEffect(() => {
    if (open) {
      setCurrentScene(0)
      setProgress(0)
      setElapsed(0)
      setPlaying(true)
    }
  }, [open])

  const handlePrev = useCallback(() => {
    setCurrentScene((cs) => Math.max(0, cs - 1))
    setProgress(0)
  }, [])

  const handleNext = useCallback(() => {
    setCurrentScene((cs) => Math.min(scenes.length - 1, cs + 1))
    setProgress(0)
  }, [scenes.length])

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60)
    const secs = Math.floor(s % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!scene) return null

  // Scene-specific gradient backgrounds
  const sceneGradients = [
    'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
    'linear-gradient(135deg, #2d1b4e, #1a1a2e, #4a1942)',
    'linear-gradient(135deg, #0f3460, #533483, #e94560)',
    'linear-gradient(135deg, #1a0a2e, #3c096c, #5a189a)',
    'linear-gradient(135deg, #240046, #3c096c, #9d4edd)',
  ]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

          {/* Player */}
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20 }}
            className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-20 p-2 rounded-lg bg-black/50 text-white/80 hover:bg-black/70 hover:text-white transition-colors"
              aria-label="Close player"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Video area — 16:9 aspect ratio */}
            <div
              className="relative aspect-video overflow-hidden"
              style={{ background: scene.imageUrl ? '#000' : sceneGradients[currentScene % sceneGradients.length] }}
            >
              {/* AI-generated image as scene background with Ken Burns effect */}
              {scene.imageUrl && (
                <motion.img
                  key={`img-${currentScene}`}
                  src={scene.imageUrl}
                  alt={scene.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  initial={{ scale: 1.15, opacity: 0, x: -20 }}
                  animate={{ scale: 1.0, opacity: 1, x: 0 }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}

              {/* Secondary zoom layer for continuous Ken Burns motion */}
              {scene.imageUrl && playing && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ scale: 1.0 }}
                  animate={{ scale: 1.08 }}
                  transition={{ duration: (scene.duration || 5), ease: 'linear' }}
                  style={{
                    backgroundImage: `url(${scene.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              )}

              {/* Dark gradient overlay for text readability */}
              {scene.imageUrl && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
              )}

              {/* Animated grid overlay */}
              {!scene.imageUrl && (
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)',
                    backgroundSize: '50px 50px',
                  }}
                />
              )}

              {/* Floating particles */}
              {Array.from({ length: 15 }).map((_, i) => (
                <motion.div
                  key={`p-${i}`}
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{
                    background: ['rgba(168,85,247,0.6)', 'rgba(236,72,153,0.6)', 'rgba(245,158,11,0.6)'][i % 3],
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -30 - Math.random() * 50, 0],
                    opacity: [0, 0.8, 0],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: 'easeInOut',
                  }}
                />
              ))}

              {/* Scene content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentScene}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 flex flex-col items-center justify-center p-8 sm:p-12 text-center"
                >
                  {/* Scene badge */}
                  <div className="mb-4 flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-purple-500/30 backdrop-blur text-white text-xs font-bold border border-purple-400/30">
                      Scene {scene.order}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-white/10 backdrop-blur text-white/70 text-xs">
                      {scene.duration}s
                    </span>
                  </div>

                  {/* Scene title */}
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                    {scene.title}
                  </h3>

                  {/* Scene description */}
                  <p className="text-sm sm:text-base text-white/70 max-w-lg leading-relaxed mb-4">
                    {scene.description}
                  </p>

                  {/* Visual cues */}
                  {scene.visualCues && scene.visualCues.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {scene.visualCues.map((cue, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-200 text-[10px] font-medium border border-purple-400/20"
                        >
                          {cue}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Narration (subtitle style) */}
                  {scene.narration && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="absolute bottom-8 left-1/2 -translate-x-1/2 max-w-md"
                    >
                      <p className="text-sm text-white/80 italic bg-black/40 backdrop-blur px-4 py-2 rounded-lg">
                        "{scene.narration}"
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Scene progress bar (at top) */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Controls bar */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-slate-900 to-purple-950">
              {/* Play/Pause */}
              <button
                onClick={() => setPlaying(!playing)}
                className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white hover:scale-110 transition-transform"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              {/* Prev/Next */}
              <button
                onClick={handlePrev}
                disabled={currentScene === 0}
                className="p-2 text-white/60 hover:text-white disabled:opacity-30 transition-colors"
                aria-label="Previous scene"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                disabled={currentScene >= scenes.length - 1}
                className="p-2 text-white/60 hover:text-white disabled:opacity-30 transition-colors"
                aria-label="Next scene"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Time */}
              <div className="text-xs text-white/50 font-mono">
                {formatTime(elapsed)} / {formatTime(totalDuration)}
              </div>

              {/* Scene dots */}
              <div className="flex gap-1.5 ml-2">
                {scenes.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentScene(i); setProgress(0) }}
                    className={`h-1.5 rounded-full transition-all ${
                      i === currentScene
                        ? 'w-6 bg-purple-400'
                        : i < currentScene
                        ? 'w-1.5 bg-purple-400/50'
                        : 'w-1.5 bg-white/20'
                    }`}
                    aria-label={`Scene ${i + 1}`}
                  />
                ))}
              </div>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Volume (visual only) */}
              <Volume2 className="w-5 h-5 text-white/40" />
              <Maximize2 className="w-5 h-5 text-white/40" />
            </div>

            {/* Bottom info bar */}
            <div className="px-4 py-2 bg-black/80 flex items-center justify-between">
              <span className="text-xs text-white/40 truncate max-w-xs">
                Prompt: "{prompt}"
              </span>
              <span className="text-xs text-white/40">
                {currentScene + 1} / {scenes.length} scenes
                {geminiBadge()}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  function geminiBadge() {
    return ' · Generated by Gemini AI'
  }
}
