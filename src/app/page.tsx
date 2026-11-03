'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Play, Video, Image as ImageIcon, Mic, Languages, Film,
  Wand2, Clapperboard, Subtitles, Volume2, Scissors, Layers,
  Palette, Zap, Globe, Cpu, ArrowRight, Check, Star, Menu, X,
  ChevronRight, Brain, Eye, MonitorPlay, Megaphone, Music,
  Sun, Moon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import TodoWidget from '@/features/todos/TodoWidget'
import AuthModal from '@/components/AuthModal'
import IntroAnimation from '@/components/IntroAnimation'
import VideoPlayerModal from '@/components/VideoPlayerModal'

// ═══════════════════════════════════════════════════════════════
//  Data
// ═══════════════════════════════════════════════════════════════

const AI_FEATURES = [
  { icon: Video, title: 'Text → Video', desc: 'Generate cinematic video from a text prompt', color: 'from-purple-500 to-pink-500' },
  { icon: ImageIcon, title: 'Image → Video', desc: 'Animate still images into motion sequences', color: 'from-pink-500 to-rose-500' },
  { icon: Film, title: 'Video → Video', desc: 'Transform existing footage with AI styles', color: 'from-rose-500 to-orange-500' },
  { icon: Clapperboard, title: 'Script → Video', desc: 'Full pipeline: script → storyboard → video', color: 'from-orange-500 to-amber-500' },
  { icon: ImageIcon, title: 'AI Image Gen', desc: 'Generate high-res images for any scene', color: 'from-amber-500 to-yellow-500' },
  { icon: Mic, title: 'AI Voice', desc: 'Natural voice synthesis + voice cloning', color: 'from-yellow-500 to-lime-500' },
  { icon: Volume2, title: 'Text → Speech', desc: '120+ languages, natural prosody', color: 'from-lime-500 to-green-500' },
  { icon: Subtitles, title: 'AI Subtitles', desc: 'Auto-generated, perfectly timed captions', color: 'from-green-500 to-emerald-500' },
  { icon: Languages, title: 'Translation', desc: 'Translate audio + subtitles across languages', color: 'from-emerald-500 to-teal-500' },
  { icon: Megaphone, title: 'AI Dubbing', desc: 'Lip-synced dubbing in 50+ languages', color: 'from-teal-500 to-cyan-500' },
  { icon: Music, title: 'Background Music', desc: 'AI-composed or licensed audio tracks', color: 'from-cyan-500 to-sky-500' },
  { icon: MonitorPlay, title: 'Format Resize', desc: 'Auto-resize for YouTube, TikTok, Instagram', color: 'from-sky-500 to-violet-500' },
  { icon: Zap, title: 'Upscaling', desc: 'Enhance to 4K with AI super-resolution', color: 'from-violet-500 to-purple-500' },
  { icon: Scissors, title: 'Video Summarization', desc: 'AI highlights the key moments', color: 'from-purple-500 to-fuchsia-500' },
  { icon: Layers, title: 'Scene Generation', desc: 'Auto-split scripts into visual scenes', color: 'from-fuchsia-500 to-pink-500' },
  { icon: Eye, title: 'AI Avatars', desc: 'Realistic presenters with lip sync', color: 'from-pink-500 to-rose-500' },
  { icon: Palette, title: 'Style Transfer', desc: 'Apply artistic styles to any video', color: 'from-rose-500 to-red-500' },
  { icon: Brain, title: 'Smart Editing', desc: 'AI suggests cuts, transitions, pacing', color: 'from-red-500 to-orange-500' },
]

const LANGUAGES = ['English', 'हिन्दी', 'తెలుగు', 'اردو', 'العربية', 'Español', 'Français', 'Deutsch', '日本語', '中文', '한국어', 'Português', 'Русский', 'Türkçe']

const PIPELINE_STEPS = [
  { label: 'Parsing prompt', icon: Brain },
  { label: 'Generating storyboard', icon: Layers },
  { label: 'Rendering scenes', icon: Video },
  { label: 'Synthesizing voice', icon: Mic },
  { label: 'Adding subtitles', icon: Subtitles },
  { label: 'Composing audio', icon: Music },
  { label: 'Finalizing export', icon: Film },
]

const PRICING = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'For trying things out',
    credits: '10 credits / month',
    features: ['720p export', 'Watermarked', '5 languages', 'Basic voices', 'Community support'],
    cta: 'Start free',
    highlighted: false,
  },
  {
    name: 'Creator',
    price: '$24',
    period: '/ month',
    desc: 'For solo creators',
    credits: '500 credits / month',
    features: ['4K export', 'No watermark', '50+ languages', 'Premium voices', 'AI avatars', 'Priority queue', 'Email support'],
    cta: 'Start 14-day trial',
    highlighted: true,
  },
  {
    name: 'Studio',
    price: '$99',
    period: '/ month',
    desc: 'For teams & agencies',
    credits: '2,500 credits / month',
    features: ['Everything in Creator', 'Team workspace (5 seats)', 'Voice cloning', 'API access', 'Custom avatars', 'Dedicated support', 'SLA guarantee'],
    cta: 'Contact sales',
    highlighted: false,
  },
]

const STATS = [
  { value: '18', label: 'AI capabilities' },
  { value: '50+', label: 'Languages' },
  { value: '4K', label: 'Max resolution' },
  { value: '∞', label: 'Extensible providers' },
]

// ═══════════════════════════════════════════════════════════════
//  Main Page
// ═══════════════════════════════════════════════════════════════

export default function Home() {
  const [darkMode, setDarkMode] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [genStep, setGenStep] = useState(0)
  const [genComplete, setGenComplete] = useState(false)
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [genError, setGenError] = useState('')
  const [storyboard, setStoryboard] = useState<Array<{
    order: number; title: string; description: string; duration: number; visualCues: string[]; narration: string; imageUrl?: string
  }> | null>(null)
  const [geminiEnabled, setGeminiEnabled] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [introComplete, setIntroComplete] = useState(false)
  const [playerOpen, setPlayerOpen] = useState(false)

  // Toggle dark mode class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  // Generation pipeline — creates a real DB record + calls Gemini AI +
  // animates the pipeline.
  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return
    setGenError('')
    setGenComplete(false)
    setGenStep(0)
    setGenerating(true)
    setGenerationId(null)
    setStoryboard(null)

    // Step 1: Create the generation record in Supabase + call Gemini
    try {
      const res = await fetch('/api/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TEXT_TO_VIDEO',
          prompt: prompt.trim(),
          provider: 'google-gemini',
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      const data = await res.json()
      setGenerationId(data.generation.id)
      setGeminiEnabled(data.geminiEnabled || false)
      if (data.storyboard?.scenes) {
        setStoryboard(data.storyboard.scenes)
      }
      if (data.aiError) {
        setGenError(`AI: ${data.aiError}`)
      } else if (!data.dbEnabled) {
        setGenError('DB not connected — generation not persisted')
      }
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Generation failed')
    }

    // Step 2: Animate the simulated pipeline (7 steps)
    let step = 0
    const interval = setInterval(() => {
      step += 1
      if (step >= PIPELINE_STEPS.length) {
        clearInterval(interval)
        setGenerating(false)
        setGenComplete(true)
      } else {
        setGenStep(step)
      }
    }, 700)
  }

  const handleReset = () => {
    setPrompt('')
    setGenComplete(false)
    setGenStep(0)
    setGenerationId(null)
    setGenError('')
    setStoryboard(null)
  }

  const openLogin = () => { setAuthMode('login'); setAuthOpen(true) }
  const openSignup = () => { setAuthMode('signup'); setAuthOpen(true) }

  return (
    <>
      {/* ─── 3D Intro Animation ─── */}
      <IntroAnimation onComplete={() => setIntroComplete(true)} />

      {/* ─── Main App (revealed after intro) ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: introComplete ? 1 : 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={introComplete ? '' : 'pointer-events-none fixed inset-0 overflow-hidden'}
      >
    <div className="min-h-screen bg-background text-foreground mesh-bg overflow-x-hidden">
      {/* ─── Nav ─── */}
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} menuOpen={menuOpen} setMenuOpen={setMenuOpen} onLogin={openLogin} onSignup={openSignup} user={user} />

      {/* ─── Hero ─── */}
      <Hero onGenerate={handleGenerate} prompt={prompt} setPrompt={setPrompt} />

      {/* ─── Generation Demo ─── */}
      <GenerationDemo
        prompt={prompt}
        generating={generating}
        genStep={genStep}
        genComplete={genComplete}
        onReset={handleReset}
        generationId={generationId}
        genError={genError}
        storyboard={storyboard}
        geminiEnabled={geminiEnabled}
        onPlay={() => setPlayerOpen(true)}
      />

      {/* ─── Stats ─── */}
      <StatsBar />

      {/* ─── Features Grid ─── */}
      <FeaturesSection onFeatureClick={(feature) => {
        // Click a feature → scroll to top + prefill the prompt with a relevant example
        const examples: Record<string, string> = {
          'Text → Video': 'A cinematic shot of a city at sunset, 4K, dramatic lighting',
          'Image → Video': 'A still photo of a mountain landscape coming to life with motion',
          'Video → Video': 'Transform a video into an anime style with vibrant colors',
          'Script → Video': 'A 3-scene video about a boy going to school, narrated',
          'AI Image Gen': 'A hyperrealistic portrait of a robot, studio lighting, 8K',
          'AI Voice': 'A warm female voice saying welcome to our platform',
          'Text → Speech': 'Convert this text to natural speech in English',
          'AI Subtitles': 'Generate subtitles for a 30 second product demo video',
          'Translation': 'Translate a video from English to Hindi with voice dubbing',
          'AI Dubbing': 'Dub a video from English to Spanish with lip sync',
          'Background Music': 'Generate upbeat background music for a tech product video',
          'Format Resize': 'Resize a 16:9 video to 9:16 vertical for TikTok',
          'Upscaling': 'Upscale a 720p video to 4K with AI enhancement',
          'Video Summarization': 'Summarize a 10 minute video into a 30 second highlight reel',
          'Scene Generation': 'Auto-split a script into 5 visual scenes with descriptions',
          'AI Avatars': 'A realistic AI presenter speaking about climate change',
          'Style Transfer': 'Apply Van Gogh Starry Night style to a city video',
          'Smart Editing': 'AI suggests the best cuts and transitions for a vlog',
        }
        const example = examples[feature.title] || `${feature.title}: create a sample video`
        setPrompt(example)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }} />

      {/* ─── Languages ─── */}
      <LanguagesSection onLanguageClick={(lang) => {
        // Click a language → scroll to top + prefill prompt with language context
        setPrompt(`Create a video about a boy going to school, narrated in ${lang}`)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }} />

      {/* ─── Editor Preview ─── */}
      <EditorSection />

      {/* ─── Architecture ─── */}
      <ArchitectureSection />

      {/* ─── Live Supabase Demo ─── */}
      <TodoWidget />

      {/* ─── Pricing ─── */}
      <PricingSection />

      {/* ─── CTA ─── */}
      <FinalCTA />

      {/* ─── Footer ─── */}
      <Footer />

      {/* ─── Auth Modal ─── */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
        onSuccess={(u) => setUser(u)}
      />

      {/* ─── Video Player Modal ─── */}
      <VideoPlayerModal
        open={playerOpen}
        onClose={() => setPlayerOpen(false)}
        scenes={storyboard || []}
        prompt={prompt}
      />
    </div>
      </motion.div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Navbar
// ═══════════════════════════════════════════════════════════════

function Navbar({ darkMode, setDarkMode, menuOpen, setMenuOpen, onLogin, onSignup, user }: {
  darkMode: boolean; setDarkMode: (v: boolean) => void
  menuOpen: boolean; setMenuOpen: (v: boolean) => void
  onLogin: () => void; onSignup: () => void
  user: { id: string; email: string } | null
}) {
  return (
    <header className="sticky top-0 z-50 glass border-b border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Clapperboard className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              Prompt<span className="text-gradient">Reel</span>
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#languages" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Languages</a>
            <a href="#editor" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Editor</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDarkMode(!darkMode)}
              className="hidden sm:flex"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:flex items-center gap-2 text-sm">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                    {user.email[0].toUpperCase()}
                  </div>
                  {user.email.split('@')[0]}
                </span>
              </div>
            ) : (
              <>
                <Button variant="ghost" className="hidden sm:flex text-sm font-medium" onClick={onLogin}>
                  Sign in
                </Button>
                <Button
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25"
                  onClick={onSignup}
                >
                  Get started <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-border/40"
            >
              <nav className="flex flex-col gap-1 py-4">
                <a href="#features" className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg">Features</a>
                <a href="#languages" className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg">Languages</a>
                <a href="#editor" className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg">Editor</a>
                <a href="#pricing" className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg">Pricing</a>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Hero
// ═══════════════════════════════════════════════════════════════

function Hero({ onGenerate, prompt, setPrompt }: {
  onGenerate: () => void; prompt: string; setPrompt: (v: string) => void
}) {
  return (
    <section className="relative pt-20 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500/20 dark:bg-purple-500/30 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-pink-500/15 dark:bg-pink-500/25 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-orange-500/10 dark:bg-orange-500/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge className="mb-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20 backdrop-blur">
            <Sparkles className="w-3 h-3 mr-1" />
            18 AI models · 50+ languages · 4K output
          </Badge>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]"
        >
          Turn a prompt into<br />
          <span className="text-gradient animate-gradient">cinematic video</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          Generate, edit, dub, and translate videos with AI. One platform for the entire
          pipeline — from text prompt to polished, multi-language export.
        </motion.p>

        {/* Prompt box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 mx-auto max-w-2xl"
        >
          <Card className="p-2 shadow-2xl shadow-purple-500/10 border-border/60 backdrop-blur glass">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onGenerate()}
                placeholder="A neon city at night, flying cars, cinematic, 4K..."
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-base"
              />
              <Button
                onClick={onGenerate}
                disabled={!prompt.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25 px-6"
              >
                <Wand2 className="w-4 h-4 mr-1.5" />
                Generate
              </Button>
            </div>
          </Card>
          <p className="mt-3 text-xs text-muted-foreground">
            Try: <button onClick={() => setPrompt('A serene mountain sunrise, time-lapse, cinematic')} className="underline hover:text-foreground">mountain sunrise</button> ·{' '}
            <button onClick={() => setPrompt('Cartoon astronaut exploring a colorful alien planet')} className="underline hover:text-foreground">cartoon space</button> ·{' '}
            <button onClick={() => setPrompt('Product showcase: luxury watch rotating on marble surface')} className="underline hover:text-foreground">product shot</button>
          </p>
        </motion.div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Generation Demo (simulated pipeline)
// ═══════════════════════════════════════════════════════════════

function GenerationDemo({ prompt, generating, genStep, genComplete, onReset, generationId, genError, storyboard, geminiEnabled, onPlay }: {
  prompt: string
  generating: boolean
  genStep: number
  genComplete: boolean
  onReset: () => void
  generationId: string | null
  genError: string
  storyboard: Array<{
    order: number; title: string; description: string; duration: number; visualCues: string[]; narration: string; imageUrl?: string
  }> | null
  geminiEnabled: boolean
  onPlay: () => void
}) {
  const showDemo = generating || genComplete || !!storyboard
  if (!showDemo && !prompt) return null

  return (
    <section className="relative py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {showDemo && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="overflow-hidden border-border/60 shadow-2xl shadow-purple-500/10">
                {/* Video preview area */}
                <div className="relative aspect-video bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 overflow-hidden">
                  {/* Animated grid */}
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'linear-gradient(rgba(168,85,247,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.3) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                  }} />

                  {/* Scanning line */}
                  {generating && (
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_20px_rgba(168,85,247,0.8)]" style={{
                      animation: 'scan-line 2s linear infinite',
                    }} />
                  )}

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                    {generating ? (
                      <>
                        <motion.div
                          key={genStep}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="mb-4"
                        >
                          {(() => {
                            const Icon = PIPELINE_STEPS[genStep].icon
                            return <Icon className="w-12 h-12 text-purple-400" />
                          })()}
                        </motion.div>
                        <p className="text-lg font-medium text-white">{PIPELINE_STEPS[genStep].label}...</p>
                        <p className="text-sm text-purple-300/60 mt-1">Step {genStep + 1} of {PIPELINE_STEPS.length}</p>
                      </>
                    ) : genComplete ? (
                      <>
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="mb-4"
                        >
                          <button
                            onClick={onPlay}
                            disabled={!storyboard || storyboard.length === 0}
                            className="group w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50 hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Play video"
                          >
                            <Play className="w-7 h-7 text-white ml-1 group-hover:scale-110 transition-transform" />
                          </button>
                        </motion.div>
                        <p className="text-lg font-medium text-white">
                          {storyboard && storyboard.length > 0 ? 'Video ready — click to play!' : 'Video ready!'}
                        </p>
                        <p className="text-sm text-purple-300/60 mt-1">
                          {storyboard ? `${storyboard.length} scenes · ${storyboard.reduce((s, sc) => s + sc.duration, 0)}s total` : '4K · 30fps · 15 seconds'}
                        </p>
                        <div className="flex gap-2 mt-4">
                          {storyboard && storyboard.length > 0 && (
                            <Button onClick={onPlay} size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                              <Play className="w-4 h-4 mr-1" /> Play
                            </Button>
                          )}
                          <Button onClick={onReset} variant="secondary" size="sm">
                            Generate another
                          </Button>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Pipeline progress */}
                <div className="p-4 bg-card/50 backdrop-blur">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Pipeline</span>
                    <span className="text-xs text-muted-foreground">
                      {genComplete ? '100%' : `${Math.round((genStep / PIPELINE_STEPS.length) * 100)}%`}
                    </span>
                  </div>
                  <Progress value={genComplete ? 100 : (genStep / PIPELINE_STEPS.length) * 100} className="h-2" />

                  {/* Real DB record indicator */}
                  {generationId && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-muted-foreground">
                        Saved to DB · ID: <code className="font-mono text-foreground">{generationId.slice(0, 8)}…</code>
                      </span>
                    </div>
                  )}
                  {genError && !generationId && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-muted-foreground">
                        DB not connected — running simulation only. {genError}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-3">
                    {PIPELINE_STEPS.map((step, i) => {
                      const Icon = step.icon
                      const done = i < genStep || genComplete
                      const active = i === genStep && !genComplete
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                            done ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                            : active ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300'
                            : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          {step.label}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Real AI storyboard from Gemini */}
                {storyboard && storyboard.length > 0 && (
                  <div className="mt-4 p-4 bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-bold">
                        AI Storyboard
                        {geminiEnabled && (
                          <span className="ml-2 text-xs font-normal text-purple-500">
                            via Google Gemini
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {storyboard.map((scene, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex gap-3 p-3 bg-background/50 rounded-lg border border-border/40"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                            {scene.order}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">{scene.title}</span>
                              <Badge variant="outline" className="text-xs">{scene.duration}s</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{scene.description}</p>
                            {scene.visualCues?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {scene.visualCues.slice(0, 4).map((cue, ci) => (
                                  <span key={ci} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300">
                                    {cue}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Stats Bar
// ═══════════════════════════════════════════════════════════════

function StatsBar() {
  return (
    <section className="py-12 border-y border-border/40 bg-card/30 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl sm:text-5xl font-bold text-gradient">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Features
// ═══════════════════════════════════════════════════════════════

function FeaturesSection({ onFeatureClick }: { onFeatureClick: (feature: typeof AI_FEATURES[0]) => void }) {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20">
            <Cpu className="w-3 h-3 mr-1" /> AI capabilities
          </Badge>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight">
            One platform.<br /><span className="text-gradient">Every AI tool.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Click any tool to try it. 18 production-ready AI capabilities, extensible provider architecture,
            and a unified API for the entire video pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {AI_FEATURES.map((feature, i) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: (i % 4) * 0.08 }}
                whileHover={{ y: -4 }}
              >
                <button
                  onClick={() => onFeatureClick(feature)}
                  className="w-full text-left"
                >
                  <Card className="p-5 h-full border-border/60 hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 cursor-pointer">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-base">{feature.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                    <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-purple-500">
                      Try it <ArrowRight className="w-3 h-3" />
                    </div>
                  </Card>
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Languages
// ═══════════════════════════════════════════════════════════════

function LanguagesSection({ onLanguageClick }: { onLanguageClick: (lang: string) => void }) {
  return (
    <section id="languages" className="py-24 bg-card/30 backdrop-blur border-y border-border/40">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        <Badge className="bg-pink-500/10 text-pink-600 dark:text-pink-300 border-pink-500/20">
          <Globe className="w-3 h-3 mr-1" /> Global reach
        </Badge>
        <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight">
          Speak to the <span className="text-gradient">whole world</span>
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Click a language to generate a video in that language. Voice synthesis, dubbing, and subtitles in 50+ languages.
        </p>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {LANGUAGES.map((lang, i) => (
            <motion.div
              key={lang}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ scale: 1.05, y: -2 }}
            >
              <button onClick={() => onLanguageClick(lang)} className="cursor-pointer">
                <Badge variant="outline" className="px-4 py-2 text-sm font-medium border-border/60 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all">
                  {lang}
                </Badge>
              </button>
            </motion.div>
          ))}
          <Badge className="px-4 py-2 text-sm bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
            +38 more
          </Badge>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Editor Preview
// ═══════════════════════════════════════════════════════════════

function EditorSection() {
  return (
    <section id="editor" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div>
            <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-300 border-orange-500/20">
              <Scissors className="w-3 h-3 mr-1" /> Built-in editor
            </Badge>
            <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight">
              Edit like a pro.<br /><span className="text-gradient">No learning curve.</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Multi-track timeline, drag-and-drop scenes, AI-assisted cuts, transitions,
              text overlays, and per-scene regeneration. All in your browser.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                { icon: Layers, label: 'Multi-track timeline' },
                { icon: Scissors, label: 'Trim, split, merge' },
                { icon: Wand2, label: 'AI smart cuts' },
                { icon: Subtitles, label: 'Auto subtitles' },
                { icon: Volume2, label: 'Audio mixing' },
                { icon: MonitorPlay, label: 'Format export' },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-purple-500" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                )
              })}
            </div>

            <Button className="mt-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25">
              Try the editor <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>

          {/* Editor mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="overflow-hidden shadow-2xl shadow-purple-500/10 border-border/60">
              {/* Editor header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 bg-card/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs text-muted-foreground ml-2">editor — project_final.mp4</span>
              </div>

              {/* Preview */}
              <div className="aspect-video bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center relative">
                <Play className="w-12 h-12 text-white/80" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
                  <div className="px-2 py-1 rounded bg-black/50 backdrop-blur text-xs text-white/80 font-mono">00:05 / 00:15</div>
                  <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-gradient-to-r from-purple-400 to-pink-400" />
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-3 space-y-1.5 bg-card/30">
                {/* Track: Video */}
                <div className="flex items-center gap-2">
                  <div className="w-16 text-xs text-muted-foreground font-medium">Video</div>
                  <div className="flex-1 flex gap-1">
                    <div className="h-8 flex-1 rounded bg-gradient-to-r from-purple-500/40 to-purple-500/60" />
                    <div className="h-8 w-12 rounded bg-gradient-to-r from-pink-500/40 to-pink-500/60" />
                    <div className="h-8 flex-[2] rounded bg-gradient-to-r from-orange-500/40 to-orange-500/60" />
                  </div>
                </div>
                {/* Track: Audio */}
                <div className="flex items-center gap-2">
                  <div className="w-16 text-xs text-muted-foreground font-medium">Audio</div>
                  <div className="flex-1 h-8 rounded bg-green-500/20 flex items-center px-2 gap-0.5">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div key={i} className="w-1 bg-green-500/60 rounded-full" style={{ height: `${20 + Math.sin(i * 0.5) * 40 + 40}%` }} />
                    ))}
                  </div>
                </div>
                {/* Track: Subtitles */}
                <div className="flex items-center gap-2">
                  <div className="w-16 text-xs text-muted-foreground font-medium">Subtitles</div>
                  <div className="flex-1 flex gap-1">
                    <div className="h-6 flex-1 rounded bg-yellow-500/20 flex items-center px-2 text-[10px] text-yellow-600 dark:text-yellow-400 truncate">A neon city...</div>
                    <div className="h-6 w-20 rounded bg-yellow-500/20" />
                    <div className="h-6 flex-1 rounded bg-yellow-500/20" />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Architecture
// ═══════════════════════════════════════════════════════════════

function ArchitectureSection() {
  const layers = [
    { name: 'Presentation', items: ['Next.js App Router', 'React Server Components', 'shadcn/ui', 'Framer Motion', 'Three.js / R3F'], color: 'from-purple-500 to-pink-500' },
    { name: 'API Layer', items: ['Route Handlers', 'Input Validation (zod)', 'Auth Middleware', 'Rate Limiting', 'Job Dispatch'], color: 'from-pink-500 to-rose-500' },
    { name: 'Services', items: ['AI Orchestration', 'Video Pipeline', 'Audio Synthesis', 'Translation', 'Storage Manager'], color: 'from-rose-500 to-orange-500' },
    { name: 'Domain', items: ['Entities', 'Interfaces', 'Value Objects', 'Domain Events', 'Business Rules'], color: 'from-orange-500 to-amber-500' },
    { name: 'Infrastructure', items: ['Prisma + PostgreSQL', 'Redis Queue', 'S3 Storage', 'AI Provider Adapters', 'External APIs'], color: 'from-amber-500 to-yellow-500' },
  ]

  return (
    <section className="py-24 bg-card/30 backdrop-blur border-y border-border/40">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20">
            <Layers className="w-3 h-3 mr-1" /> Clean architecture
          </Badge>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight">
            Built to <span className="text-gradient">scale & extend</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Layered, SOLID, dependency-injected. Add new AI providers, features, or
            languages without touching existing code.
          </p>
        </div>

        <div className="space-y-3">
          {layers.map((layer, i) => (
            <motion.div
              key={layer.name}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="p-4 border-border/60 hover:shadow-lg transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 sm:w-48 flex-shrink-0">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${layer.color} flex items-center justify-center text-white text-xs font-bold`}>
                      {i + 1}
                    </div>
                    <span className="font-semibold">{layer.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {layer.items.map((item) => (
                      <Badge key={item} variant="outline" className="text-xs font-normal border-border/60">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Pricing
// ═══════════════════════════════════════════════════════════════

function PricingSection() {
  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="bg-pink-500/10 text-pink-600 dark:text-pink-300 border-pink-500/20">
            <Star className="w-3 h-3 mr-1" /> Pricing
          </Badge>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight">
            Simple, <span className="text-gradient">credit-based</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            No hidden fees. Credits roll over. Cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {PRICING.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card className={`p-6 h-full flex flex-col border-border/60 transition-all ${
                tier.highlighted
                  ? 'border-purple-500/40 shadow-2xl shadow-purple-500/10 ring-1 ring-purple-500/20'
                  : 'hover:border-purple-500/20 hover:shadow-lg'
              }`}>
                {tier.highlighted && (
                  <Badge className="self-start mb-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    Most popular
                  </Badge>
                )}
                <h3 className="text-xl font-bold">{tier.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{tier.desc}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">{tier.period}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-purple-600 dark:text-purple-300">{tier.credits}</p>

                <Button
                  className={`mt-6 w-full ${
                    tier.highlighted
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25'
                      : ''
                  }`}
                  variant={tier.highlighted ? 'default' : 'outline'}
                >
                  {tier.cta}
                </Button>

                <ul className="mt-6 space-y-3 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Final CTA
// ═══════════════════════════════════════════════════════════════

function FinalCTA() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Card className="relative overflow-hidden p-12 text-center border-border/60">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />

          <div className="relative">
            <Sparkles className="w-10 h-10 text-purple-500 mx-auto mb-4" />
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
              Ready to create?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
              Start with 10 free credits. No credit card required.
              Generate your first video in under 2 minutes.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/25">
                Start free <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
              <Button size="lg" variant="outline">
                <Play className="w-4 h-4 mr-1.5" /> Watch demo
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Footer
// ═══════════════════════════════════════════════════════════════

function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/30 backdrop-blur mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                <Clapperboard className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold">
                Prompt<span className="text-gradient">Reel</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              The AI video generation platform for creators, teams, and studios.
              Prompt to video in any language.
            </p>
          </div>

          {/* Links */}
          {[
            { title: 'Product', links: ['Features', 'Pricing', 'Editor', 'API', 'Changelog'] },
            { title: 'Resources', links: ['Docs', 'Tutorials', 'Blog', 'Community', 'Status'] },
            { title: 'Company', links: ['About', 'Careers', 'Privacy', 'Terms', 'Contact'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 PromptReel. Built with Next.js + AI.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
