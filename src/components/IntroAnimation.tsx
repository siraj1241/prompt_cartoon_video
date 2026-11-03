'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * 3D Rotating Globe Intro
 *
 * When the user opens the app:
 *   1. A 3D wireframe globe appears and rotates continuously
 *   2. Gradient arcs + orbiting dots circle the globe
 *   3. A "GO" button pulses below the globe
 *   4. User clicks GO → globe explodes into particles → app fades in
 *
 * The globe does NOT auto-dismiss. The user must click GO to enter.
 *
 * Uses CSS 3D transforms only (no Three.js) for performance.
 * Respects prefers-reduced-motion (shows static globe + GO button).
 */

interface Particle {
  id: number
  angle: number
  radius: number
  speed: number
  size: number
  color: string
  delay: number
}

const GLOBE_SIZE = 280 // px
const NUM_PARTICLES = 40

const COLORS = [
  'oklch(0.65 0.25 295)',   // purple
  'oklch(0.70 0.28 350)',   // pink
  'oklch(0.70 0.22 60)',    // orange
  'oklch(0.60 0.20 180)',   // cyan
  'oklch(0.75 0.25 330)',   // magenta
]

export default function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [show, setShow] = useState(true)
  const [exploding, setExploding] = useState(false)
  const [rotation, setRotation] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)

    if (!mq.matches) {
      // Continuous rotation loop
      const animate = () => {
        setRotation((r) => (r + 0.3) % 360)
        rafRef.current = requestAnimationFrame(animate)
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const handleGo = () => {
    setExploding(true)
    // Stop the rotation
    cancelAnimationFrame(rafRef.current)

    // After explosion animation, fade out + call onComplete
    setTimeout(() => {
      setShow(false)
      setTimeout(onComplete, 500)
    }, 1200)
  }

  // Generate particles for the explosion
  const particles: Particle[] = Array.from({ length: NUM_PARTICLES }, (_, i) => ({
    id: i,
    angle: (i / NUM_PARTICLES) * 360 + Math.random() * 20,
    radius: 80 + Math.random() * 200,
    speed: 0.8 + Math.random() * 0.4,
    size: 2 + Math.random() * 6,
    color: COLORS[i % COLORS.length],
    delay: Math.random() * 0.3,
  }))

  // ─── Reduced motion fallback ───
  if (reducedMotion) {
    return (
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background gap-8"
          >
            <GlobeStatic size={GLOBE_SIZE} />
            <GoButton onClick={handleGo} exploding={exploding} />
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at center, oklch(0.10 0.02 300), oklch(0.04 0.01 300))',
            perspective: '1000px',
          }}
        >
          {/* ─── Background glow orbs ─── */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, oklch(0.55 0.25 295 / 0.3), transparent 70%)' }}
            />
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, oklch(0.70 0.28 350 / 0.25), transparent 70%)' }}
            />
          </div>

          {/* ─── 3D Globe Scene ─── */}
          {!exploding ? (
            <div
              className="relative"
              style={{
                width: GLOBE_SIZE,
                height: GLOBE_SIZE,
                transformStyle: 'preserve-3d',
              }}
            >
              <Globe3D size={GLOBE_SIZE} rotation={rotation} />
            </div>
          ) : (
            /* ─── Explosion particles ─── */
            <div className="relative" style={{ width: GLOBE_SIZE, height: GLOBE_SIZE }}>
              {/* Central flash */}
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full"
                style={{ background: 'radial-gradient(circle, white, oklch(0.65 0.25 295 / 0.5), transparent)' }}
              />

              {/* Exploding particles */}
              {particles.map((p) => {
                const rad = (p.angle * Math.PI) / 180
                const targetX = Math.cos(rad) * p.radius
                const targetY = Math.sin(rad) * p.radius
                return (
                  <motion.div
                    key={p.id}
                    className="absolute top-1/2 left-1/2 rounded-full"
                    style={{
                      width: p.size,
                      height: p.size,
                      background: p.color,
                      boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                    }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{
                      x: targetX,
                      y: targetY,
                      opacity: [1, 1, 0],
                      scale: [1, 1.5, 0],
                      rotate: Math.random() * 720,
                    }}
                    transition={{
                      duration: 1.2,
                      delay: p.delay,
                      ease: 'easeOut',
                    }}
                  />
                )
              })}

              {/* Expanding ring */}
              <motion.div
                className="absolute top-1/2 left-1/2 rounded-full border-2"
                style={{
                  borderColor: 'oklch(0.65 0.25 295 / 0.5)',
                  width: GLOBE_SIZE * 0.4,
                  height: GLOBE_SIZE * 0.4,
                  marginLeft: -GLOBE_SIZE * 0.2,
                  marginTop: -GLOBE_SIZE * 0.2,
                }}
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 4, opacity: 0 }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          )}

          {/* ─── Wordmark ─── */}
          {!exploding && (
            <motion.div
              className="absolute bottom-[24%] flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
            >
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Prompt<span className="text-gradient">Reel</span>
              </h1>
              <p className="text-sm text-white/50 mt-1.5">
                AI Video Generation Platform
              </p>
            </motion.div>
          )}

          {/* ─── GO Button ─── */}
          {!exploding && (
            <motion.div
              className="absolute bottom-[10%]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
            >
              <GoButton onClick={handleGo} exploding={false} />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ═══════════════════════════════════════════════════════════════
//  3D Globe component
// ═══════════════════════════════════════════════════════════════

function Globe3D({ size, rotation }: { size: number; rotation: number }) {
  const half = size / 2

  return (
    <div
      className="absolute inset-0"
      style={{
        transformStyle: 'preserve-3d',
        transform: `rotateY(${rotation}deg)`,
      }}
    >
      {/* Wireframe latitude rings */}
      {[0, 30, 60, 90, 120, 150].map((lat) => (
        <div
          key={`lat-${lat}`}
          className="absolute rounded-full border"
          style={{
            width: size,
            height: size * Math.cos((lat * Math.PI) / 180),
            top: half - (size * Math.cos((lat * Math.PI) / 180)) / 2,
            left: 0,
            borderColor: `oklch(0.65 0.25 295 / ${0.15 + Math.abs(Math.sin((lat * Math.PI) / 180)) * 0.25})`,
            borderWidth: '1px',
            transform: `rotateX(${lat - 90}deg) translateZ(0)`,
          }}
        />
      ))}

      {/* Wireframe longitude lines */}
      {[0, 30, 60, 90, 120, 150].map((lng) => (
        <div
          key={`lng-${lng}`}
          className="absolute rounded-full border"
          style={{
            width: size,
            height: size,
            top: 0,
            left: 0,
            borderColor: `oklch(0.70 0.28 350 / 0.15)`,
            borderWidth: '1px',
            transform: `rotateY(${lng}deg)`,
          }}
        />
      ))}

      {/* Solid sphere base */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 0.85,
          height: size * 0.85,
          top: '7.5%',
          left: '7.5%',
          background: 'radial-gradient(circle at 30% 30%, oklch(0.20 0.05 295 / 0.8), oklch(0.10 0.02 300 / 0.6))',
          boxShadow: `inset -20px -20px 60px oklch(0.05 0.01 300 / 0.8),
                       inset 20px 20px 40px oklch(0.30 0.10 295 / 0.3),
                       0 0 60px oklch(0.55 0.25 295 / 0.3)`,
        }}
      />

      {/* Gradient glow overlay */}
      <div
        className="absolute rounded-full"
        style={{
          width: size * 0.85,
          height: size * 0.85,
          top: '7.5%',
          left: '7.5%',
          background: 'linear-gradient(135deg, oklch(0.55 0.25 295 / 0.15), oklch(0.65 0.28 350 / 0.1), oklch(0.70 0.22 60 / 0.1))',
          mixBlendMode: 'screen',
        }}
      />

      {/* Orbiting dots */}
      {[0, 120, 240].map((startAngle, i) => (
        <OrbitingDot
          key={`orbit-${i}`}
          size={size}
          startAngle={startAngle}
          speed={2 + i * 0.5}
          color={COLORS[i]}
          rotation={rotation}
        />
      ))}

      {/* Arc lines (gradient curves around the globe) */}
      {[0, 60, 120, 180, 240, 300].map((arcAngle, i) => (
        <div
          key={`arc-${i}`}
          className="absolute rounded-full"
          style={{
            width: size * 1.15,
            height: size * 1.15,
            top: -size * 0.075,
            left: -size * 0.075,
            borderTop: `2px solid oklch(${i % 2 === 0 ? '0.65 0.25 295' : '0.70 0.28 350'} / 0.3)`,
            borderRight: '2px solid transparent',
            borderBottom: '2px solid transparent',
            borderLeft: '2px solid transparent',
            transform: `rotateY(${arcAngle + rotation * 0.5}deg) rotateX(20deg)`,
          }}
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Orbiting dot
// ═══════════════════════════════════════════════════════════════

function OrbitingDot({
  size,
  startAngle,
  speed,
  color,
  rotation,
}: {
  size: number
  startAngle: number
  speed: number
  color: string
  rotation: number
}) {
  const angle = (startAngle + rotation * speed) % 360
  const rad = (angle * Math.PI) / 180
  const radius = size * 0.58

  return (
    <div
      className="absolute"
      style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 12px ${color}, 0 0 24px ${color}`,
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) translateX(${Math.cos(rad) * radius}px) translateY(${Math.sin(rad) * radius * 0.4}px)`,
        zIndex: Math.sin(rad) > 0 ? 10 : -1, // in front when on near side
      }}
    />
  )
}

// ═══════════════════════════════════════════════════════════════
//  Static globe (reduced motion)
// ═══════════════════════════════════════════════════════════════

function GlobeStatic({ size }: { size: number }) {
  return (
    <div
      className="relative rounded-full"
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle at 30% 30%, oklch(0.20 0.05 295 / 0.8), oklch(0.10 0.02 300 / 0.6))',
        boxShadow: 'inset -20px -20px 60px oklch(0.05 0.01 300 / 0.8), 0 0 60px oklch(0.55 0.25 295 / 0.3)',
        border: '1px solid oklch(0.65 0.25 295 / 0.2)',
      }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'linear-gradient(135deg, oklch(0.55 0.25 295 / 0.15), oklch(0.65 0.28 350 / 0.1))',
          mixBlendMode: 'screen',
        }}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  GO button
// ═══════════════════════════════════════════════════════════════

function GoButton({ onClick, exploding }: { onClick: () => void; exploding: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={exploding}
      className="relative px-10 py-4 rounded-full font-bold text-lg text-white overflow-hidden group"
      style={{
        background: 'linear-gradient(135deg, oklch(0.55 0.25 295), oklch(0.65 0.28 350), oklch(0.70 0.22 60))',
        boxShadow: '0 10px 30px -5px oklch(0.55 0.25 295 / 0.5)',
      }}
      animate={{
        scale: [1, 1.05, 1],
        boxShadow: [
          '0 10px 30px -5px oklch(0.55 0.25 295 / 0.5)',
          '0 15px 40px -5px oklch(0.65 0.28 350 / 0.6)',
          '0 10px 30px -5px oklch(0.55 0.25 295 / 0.5)',
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'linear-gradient(90deg, transparent, white, transparent)',
          backgroundSize: '200% 100%',
        }}
        animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      />

      <span className="relative z-10 flex items-center gap-2">
        GO
        <motion.svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </span>
    </motion.button>
  )
}
