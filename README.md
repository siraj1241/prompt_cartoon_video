# PromptReel — AI Video Generation Platform

> Turn a text prompt into cinematic video. 18 AI capabilities, 50+ languages, 4K output.

## 🎬 What is PromptReel?

PromptReel is a production-grade SaaS platform for AI-powered video generation. Users can:
- Generate video from text prompts
- Animate images into video
- Transform existing video with AI styles
- Generate AI voice, subtitles, and dubbing in 50+ languages
- Edit videos in a built-in multi-track timeline editor
- Export to YouTube, TikTok, and Instagram formats

## 🏗️ Architecture

**Clean layered architecture** with strict dependency direction:

```
┌─────────────────────────────────────────────────┐
│  Presentation (Next.js App Router + shadcn/ui)  │
│  Pages, components, animations (Framer Motion)  │
└───────────────────────┬─────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────┐
│  API Layer (Next.js Route Handlers)              │
│  Input validation (zod), auth middleware, jobs   │
└───────────────────────┬─────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────┐
│  Services (Business Logic)                       │
│  AI orchestration, video pipeline, audio, etc.   │
└───────────────────────┬─────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────┐
│  Domain (Core Business Rules)                    │
│  Entities, interfaces, value objects, events     │
└───────────────────────┬─────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────┐
│  Infrastructure (External Integrations)          │
│  Prisma + PostgreSQL, Redis, S3, AI providers   │
└─────────────────────────────────────────────────┘
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full details.

## 🧠 AI Provider Architecture

The platform uses a **pluggable provider system** — add new AI providers without touching existing code:

```typescript
// Define a new video provider
export class MyVideoProvider implements VideoProvider {
  name = 'my-provider'
  capabilities = ['text-to-video', 'image-to-video']

  async generateVideo(req: VideoGenRequest): Promise<VideoResult> {
    // Your implementation
  }
}

// Register it
providerRegistry.register('video', new MyVideoProvider())
```

See [AI_PROVIDERS.md](./AI_PROVIDERS.md) for the full provider catalog and how to add new ones.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript 5 |
| Styling | Tailwind CSS 4, shadcn/ui (New York) |
| Animations | Framer Motion, GSAP |
| 3D | Three.js, React Three Fiber |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (role-based) |
| Storage | S3-compatible (AWS S3 / MinIO) |
| Queue | Redis + BullMQ |
| State | Zustand (client), TanStack Query (server) |

## 🚀 Getting Started

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL, AI API keys, etc.

# Push database schema
bun run db:push

# Start dev server
bun run dev
```

Visit `http://localhost:3000` to see the platform.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── (auth)/             # Login, register, password reset
│   ├── (dashboard)/        # Authenticated user dashboard
│   ├── api/                # REST API route handlers
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── common/             # Shared components (buttons, cards)
│   ├── layout/             # Header, footer, sidebar
│   ├── editor/             # Video editor components
│   └── video/              # Video player, timeline, tracks
├── features/
│   ├── authentication/     # Auth UI + logic
│   ├── ai-generation/      # Prompt → video generation
│   ├── video-editor/       # Timeline editor
│   ├── projects/           # Project management
│   ├── media-library/      # Asset management
│   └── subscriptions/      # Billing + credits
├── services/
│   ├── ai/                 # AI provider orchestration
│   ├── video/              # Video processing pipeline
│   ├── audio/              # TTS, voice synthesis, dubbing
│   ├── translation/        # Language translation
│   ├── storage/            # S3 file management
│   └── authentication/     # Session management
├── domain/
│   ├── entities/           # Core domain models
│   ├── interfaces/         # Repository + service contracts
│   ├── enums/              # Status, role, plan enums
│   └── types/              # Shared type definitions
├── infrastructure/
│   ├── database/           # Prisma client + migrations
│   ├── queue/              # Redis + BullMQ job workers
│   ├── storage/            # S3 adapter
│   └── providers/          # AI provider implementations
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities (db, auth, utils)
├── config/                 # App configuration
└── styles/                 # Global styles
```

## 📚 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design + layer responsibilities
- [AI_PROVIDERS.md](./AI_PROVIDERS.md) — Provider catalog + integration guide
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — Prisma schema + ERD
- [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) — Env vars + local dev setup
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Docker + cloud deployment
- [CHANGELOG.md](./CHANGELOG.md) — Version history

## 🔒 Security

- API keys never exposed to the frontend (server-side only)
- Role-based access control (Free / Creator / Studio / Admin)
- Rate limiting on AI generation endpoints
- Input validation on all API routes (zod)
- Secure file upload validation (type + size)
- OWASP top 10 protections

## ⚠️ Honest Limitations

True text-to-video AI (Sora/Runway quality) requires either:
1. **Paid APIs** — Runway ML, Pika, Luma, Replicate ($0.05-0.50/sec)
2. **Self-hosted GPU clusters** — Stable Video Diffusion, AnimateDiff (needs A100/H100)

The platform's provider architecture supports both. The landing page demo shows a **simulated pipeline** — plug in real providers via env vars to make it production-functional.

## 📄 License

MIT — see [LICENSE](./LICENSE)
