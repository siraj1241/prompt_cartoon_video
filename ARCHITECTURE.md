# Architecture — PromptReel

## Overview

PromptReel follows a **Clean Layered Architecture** with strict dependency direction.
Dependencies always point inward — the domain layer has zero external dependencies.

```
┌─────────────────────────────────────────────────────────────┐
│  Presentation Layer                                         │
│  Next.js App Router + React + Tailwind + shadcn/ui         │
│  Framer Motion animations, Three.js / R3F for 3D           │
│                                                             │
│  Responsibility: Render UI, capture user input              │
│  Depends on: Services (via hooks)                           │
└──────────────────────────┬──────────────────────────────────┘
                           │ calls
┌──────────────────────────▼──────────────────────────────────┐
│  API Layer (Route Handlers)                                 │
│  Input validation (zod), auth middleware, rate limiting     │
│  Job dispatch to background queue                           │
│                                                             │
│  Responsibility: Validate, authorize, coordinate            │
│  Depends on: Services, Domain                               │
└──────────────────────────┬──────────────────────────────────┘
                           │ delegates to
┌──────────────────────────▼──────────────────────────────────┐
│  Services Layer                                              │
│  AI orchestration, video pipeline, audio synthesis,         │
│  translation, storage manager                               │
│                                                             │
│  Responsibility: Business logic, orchestration              │
│  Depends on: Domain interfaces, Infrastructure              │
└──────────────────────────┬──────────────────────────────────┘
                           │ implements contracts from
┌──────────────────────────▼──────────────────────────────────┐
│  Domain Layer (pure, no deps)                               │
│  Entities, interfaces, value objects, domain events        │
│                                                             │
│  Responsibility: Core business rules                        │
│  Depends on: NOTHING                                         │
└──────────────────────────┬──────────────────────────────────┘
                           │ implemented by
┌──────────────────────────▼──────────────────────────────────┐
│  Infrastructure Layer                                       │
│  Prisma + PostgreSQL, Redis + BullMQ, S3 storage,          │
│  AI provider adapters (Runway, Pika, Stable Video, etc.)  │
│                                                             │
│  Responsibility: External integrations                      │
│  Depends on: Domain interfaces                              │
└─────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. Presentation (`src/app`, `src/components`)
- Next.js App Router pages
- React Server Components for initial render
- Client components for interactivity
- shadcn/ui for consistent primitives
- Framer Motion for animations
- Three.js / R3F for 3D elements

**Rule:** No business logic. No direct database access. Only calls services via hooks.

### 2. API Layer (`src/app/api`)
- Next.js Route Handlers
- Input validation with zod schemas
- Auth middleware (NextAuth session check)
- Rate limiting (per user + per IP)
- Job dispatch to Redis/BullMQ for long-running tasks
- Returns standardized JSON responses

**Rule:** Validate → authorize → delegate to service → return result. No business logic here.

### 3. Services (`src/services`)
- **AI Orchestration** — coordinates multiple AI providers
- **Video Pipeline** — scene generation, rendering, export
- **Audio** — TTS, voice cloning, music generation
- **Translation** — text + audio translation
- **Storage** — S3 upload/download, presigned URLs
- **Authentication** — session management, role checks

**Rule:** Implements domain interfaces. Orchestrates infrastructure. Contains business logic.

### 4. Domain (`src/domain`)
- **Entities** — User, Project, Video, Generation, Asset
- **Interfaces** — repository contracts, service contracts
- **Enums** — UserRole, ProjectStatus, GenerationType
- **Value Objects** — Resolution, Duration, Language

**Rule:** Zero external dependencies. Pure TypeScript. No imports from infrastructure.

### 5. Infrastructure (`src/infrastructure`)
- **Database** — Prisma client, migrations
- **Queue** — Redis + BullMQ workers for async jobs
- **Storage** — S3 adapter (AWS S3 / MinIO)
- **Providers** — AI provider implementations (Runway, Pika, SVD, etc.)

**Rule:** Implements domain interfaces. All external API calls happen here. API keys NEVER leak to other layers.

## Dependency Injection

Services receive their dependencies via constructor injection:

```typescript
// Domain interface
interface VideoRepository {
  findById(id: string): Promise<Video | null>
  save(video: Video): Promise<void>
}

// Infrastructure implementation
class PrismaVideoRepository implements VideoRepository {
  constructor(private prisma: PrismaClient) {}
  async findById(id: string) { return this.prisma.video.findUnique({ where: { id } }) }
}

// Service depends on interface, not implementation
class VideoService {
  constructor(private videoRepo: VideoRepository) {}
}

// Wiring (in src/lib/container.ts)
const videoRepo = new PrismaVideoRepository(prisma)
const videoService = new VideoService(videoRepo)
```

This allows:
- Easy unit testing (mock the interface)
- Swapping implementations (e.g., test DB → production DB)
- Zero coupling between layers

## AI Provider Architecture

The provider system is **extensible by design**. Adding a new AI provider does NOT modify existing code:

```typescript
// 1. Define the provider (new file, no changes to existing code)
class RunwayVideoProvider implements VideoProvider {
  name = 'runway'
  capabilities = ['text-to-video', 'image-to-video']
  // ...implementation
}

// 2. Register it at startup
registry.register('video', new RunwayVideoProvider())

// 3. Users select it by name when generating
POST /api/generations { type: 'text-to-video', provider: 'runway', prompt: '...' }
```

See `AI_PROVIDERS.md` for the full catalog of supported providers.

## Background Job Pipeline

Long-running AI generation jobs go through a queue:

```
User clicks "Generate"
  → API route validates + creates Generation record (status: QUEUED)
  → Dispatches job to Redis/BullMQ
  → Returns 202 Accepted with generation ID
  → User polls GET /api/generations/:id for status
  → Worker picks up job, calls AI provider
  → Updates Generation status: PROCESSING → COMPLETED
  → Uploads result to S3
  → Notifies user via WebSocket (optional)
```

## Security Architecture

| Concern | Solution |
|---|---|
| API key storage | Server-side env vars only, never sent to client |
| Auth | NextAuth.js with JWT sessions |
| Authorization | Role-based (Free/Creator/Studio/Admin) |
| Input validation | zod schemas on every API route |
| Rate limiting | Per-user + per-IP, Redis-backed |
| File upload | Type + size validation, virus scan (optional) |
| SQL injection | Prisma parameterized queries |
| XSS | React auto-escaping, CSP headers |
| CSRF | NextAuth built-in CSRF tokens |

## Future-Proofing Rules

When adding a new feature:

1. **Inspect** the existing architecture
2. **Identify** reusable services and components
3. **Extend** existing modules — don't create parallel implementations
4. **Add migrations** when schema changes are needed
5. **Add tests** for new and affected functionality
6. **Update docs** (CHANGELOG, ARCHITECTURE, API docs)
7. **Maintain backward compatibility** — don't break existing API consumers

Never rewrite working modules. Never duplicate existing functionality. Every new feature integrates with the existing architecture rather than becoming an isolated implementation.
