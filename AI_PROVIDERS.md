# AI Providers Catalog

This document catalogues AI providers that can be integrated into PromptReel.
Each entry is categorized by **cost model**, **license**, and **hardware requirements**.

> ⚠️ **Critical distinction:** "Open source" ≠ "Free hosted API".
> Most open-source AI models require significant GPU hardware to run locally.
> Cloud-hosted APIs (Runway, Pika, Replicate) charge per-second/per-request.

---

## 📊 Provider Summary

| Capability | Free / OSS Option | Paid API Option | Recommended |
|---|---|---|---|
| Text → Video | Stable Video Diffusion (GPU) | Runway Gen-3, Pika, Luma | Paid API for production |
| Image → Video | AnimateDiff (GPU) | Runway, Pika | Paid API |
| Image Generation | Stable Diffusion (GPU) | DALL-E 3, Midjourney API | OSS for cost control |
| Text → Speech | Coqui TTS, Piper | ElevenLabs, Azure TTS | OSS for languages |
| Voice Cloning | Coqui XTTS (GPU) | ElevenLabs | Paid for quality |
| Translation | NLLB, OPUS-MT | DeepL, Google Translate | OSS for privacy |
| Subtitles | Whisper (CPU OK) | AssemblyAI, Rev | OSS Whisper |
| Lip Sync | SadTalker (GPU) | SyncLabs API | Paid for quality |
| Upscaling | Real-ESRGAN (GPU) | Replicate, Topaz | OSS |
| Dubbing | Custom pipeline | ElevenLabs Dubbing | Paid |

---

## 🎬 Video Generation Providers

### 1. Runway ML (Gen-3 Alpha)
- **Type:** Paid API
- **Cost:** ~$0.05/second of generated video
- **Quality:** ⭐⭐⭐⭐⭐ (best in class)
- **Capabilities:** text-to-video, image-to-video, video-to-video
- **Max resolution:** 1920×1080
- **License:** Commercial (API ToS)
- **Setup:** Requires API key from runwayml.com
- **Docs:** https://docs.runwayml.com

### 2. Pika Labs
- **Type:** Paid API
- **Cost:** ~$0.03/second
- **Quality:** ⭐⭐⭐⭐
- **Capabilities:** text-to-video, image-to-video
- **Max resolution:** 1280×720
- **License:** Commercial
- **Setup:** API key from pika.art

### 3. Luma Dream Machine
- **Type:** Paid API
- **Cost:** ~$0.04/second
- **Quality:** ⭐⭐⭐⭐
- **Capabilities:** text-to-video, image-to-video
- **License:** Commercial
- **Setup:** API key from lumalabs.ai

### 4. Stable Video Diffusion (SVD)
- **Type:** Open source (self-hosted)
- **License:** Stability AI Community License (non-commercial without paid license)
- **Cost:** Free (software) + GPU hardware cost
- **Hardware:** Requires NVIDIA GPU with ≥16GB VRAM (RTX 4090, A100)
- **Quality:** ⭐⭐⭐
- **Max resolution:** 1024×576
- **Repo:** https://github.com/Stability-AI/generative-models
- **Limitation:** Cannot be used commercially without a paid license from Stability AI

### 5. AnimateDiff
- **Type:** Open source (self-hosted)
- **License:** Apache 2.0 ✅ Commercial use OK
- **Cost:** Free (software) + GPU hardware cost
- **Hardware:** NVIDIA GPU ≥8GB VRAM
- **Quality:** ⭐⭐⭐
- **Repo:** https://github.com/guoyww/AnimateDiff
- **Advantage:** Apache 2.0 license allows commercial use

### 6. ModelScope Text-to-Video
- **Type:** Open source
- **License:** Apache 2.0 ✅
- **Hardware:** GPU ≥10GB VRAM
- **Quality:** ⭐⭐
- **Repo:** https://huggingface.co/damo-vilab/text-to-video-ms-1.7b

### 7. Replicate (hosted inference)
- **Type:** Paid API (hosts open-source models)
- **Cost:** ~$0.02-0.10/second depending on model
- **Advantage:** No GPU needed — they run the models
- **Models available:** SVD, AnimateDiff, Deforum, etc.
- **Setup:** API key from replicate.com
- **Docs:** https://replicate.com/docs

---

## 🖼️ Image Generation Providers

### 1. Stable Diffusion (various models)
- **Type:** Open source (self-hosted)
- **License:** CreativeML Open RAIL-M (most models) — commercial use allowed with conditions
- **Hardware:** GPU ≥6GB VRAM (or CPU with ONNX, slow)
- **Models:** SD 1.5, SDXL, SD 3.5, various fine-tunes
- **Repo:** https://github.com/AUTOMATIC1111/stable-diffusion-webui
- **Quality:** ⭐⭐⭐⭐ (SDXL)

### 2. FLUX.1 (Black Forest Labs)
- **Type:** Open source
- **License:** Apache 2.0 (FLUX.1-dev is non-commercial; FLUX.1-schnell is Apache 2.0) ✅
- **Hardware:** GPU ≥24GB VRAM for full quality
- **Quality:** ⭐⭐⭐⭐⭐ (state of the art)
- **Repo:** https://github.com/black-forest-labs/flux

### 3. DALL-E 3 (OpenAI)
- **Type:** Paid API
- **Cost:** $0.040/image (standard) / $0.080/image (HD)
- **Quality:** ⭐⭐⭐⭐⭐
- **Docs:** https://platform.openai.com/docs/api-reference/images

---

## 🎙️ Voice / TTS Providers

### 1. Coqui TTS (XTTS)
- **Type:** Open source
- **License:** MPL 2.0 (Coqui TTS) / CPML (XTTS voice cloning model) ⚠️ Check license
- **Hardware:** GPU recommended, CPU works (slower)
- **Capabilities:** TTS in 17 languages, voice cloning
- **Repo:** https://github.com/coqui-ai/TTS
- **Limitation:** CPML license restricts some commercial uses — verify before deploying

### 2. Piper TTS
- **Type:** Open source
- **License:** MIT ✅ Commercial use OK
- **Hardware:** CPU-friendly (optimized for Raspberry Pi)
- **Capabilities:** TTS in 30+ languages
- **Quality:** ⭐⭐⭐ (good for subtitles/voiceover)
- **Repo:** https://github.com/rhasspy/piper
- **Advantage:** Runs on CPU, no GPU needed, MIT licensed

### 3. ElevenLabs
- **Type:** Paid API
- **Cost:** $5/month (Creator) → $99/month (Business)
- **Quality:** ⭐⭐⭐⭐⭐ (best voice quality)
- **Capabilities:** TTS, voice cloning, dubbing
- **Docs:** https://elevenlabs.io/docs

### 4. OpenAI TTS
- **Type:** Paid API
- **Cost:** $0.015/1K chars (tts-1) / $0.030/1K chars (tts-1-hd)
- **Quality:** ⭐⭐⭐⭐
- **Docs:** https://platform.openai.com/docs/guides/text-to-speech

---

## 🌐 Translation Providers

### 1. NLLB (No Language Left Behind) — Meta
- **Type:** Open source
- **License:** MIT ✅
- **Hardware:** GPU recommended, CPU works
- **Languages:** 200+ languages
- **Quality:** ⭐⭐⭐⭐
- **Repo:** https://github.com/facebookresearch/nllb

### 2. OPUS-MT (Helsinki-NLP)
- **Type:** Open source
- **License:** MIT ✅
- **Hardware:** CPU OK
- **Languages:** 100+ language pairs
- **Repo:** https://github.com/Helsinki-NLP/Opus-MT

### 3. DeepL API
- **Type:** Paid API
- **Cost:** $25/month (Advanced) → $50/month (Ultimate)
- **Quality:** ⭐⭐⭐⭐⭐ (best quality)
- **Docs:** https://www.deepl.com/docs-api

---

## 📝 Subtitle / Speech-to-Text Providers

### 1. OpenAI Whisper
- **Type:** Open source ✅
- **License:** MIT
- **Hardware:** CPU OK (slow), GPU faster
- **Languages:** 90+ languages
- **Quality:** ⭐⭐⭐⭐⭐
- **Repo:** https://github.com/openai/whisper
- **Advantage:** MIT license, runs on CPU, best-in-class for free

### 2. Faster-Whisper
- **Type:** Open source
- **License:** MIT ✅
- **Hardware:** CPU with CTranslate2 acceleration (4x faster than original Whisper)
- **Repo:** https://github.com/SYSTRAN/faster-whisper

### 3. AssemblyAI
- **Type:** Paid API
- **Cost:** $0.37/hour of audio
- **Docs:** https://www.assemblyai.com/docs

---

## 👄 Lip Sync / Dubbing

### 1. SadTalker
- **Type:** Open source
- **License:** Apache 2.0 ✅ (with model-specific restrictions)
- **Hardware:** GPU ≥8GB VRAM
- **Quality:** ⭐⭐⭐
- **Repo:** https://github.com/OpenTalker/SadTalker

### 2. Wav2Lip
- **Type:** Open source
- **License:** BSD ✅ (but uses models with their own licenses)
- **Hardware:** GPU recommended
- **Quality:** ⭐⭐⭐
- **Repo:** https://github.com/Rudrabha/Wav2Lip

### 3. SyncLabs API
- **Type:** Paid API
- **Docs:** https://synclabs.so

---

## 🔼 Upscaling

### 1. Real-ESRGAN
- **Type:** Open source
- **License:** BSD-3-Clause ✅
- **Hardware:** GPU recommended, CPU works
- **Quality:** ⭐⭐⭐⭐
- **Repo:** https://github.com/xinntao/Real-ESRGAN

### 2. Topaz Video AI
- **Type:** Paid software (one-time license)
- **Cost:** $299 one-time
- **Quality:** ⭐⭐⭐⭐⭐

---

## 🔧 Integration Guide

### Adding a New Provider

```typescript
// 1. Create the provider implementation
// src/infrastructure/providers/video/runway.ts
import { VideoProvider, GenerationRequest, GenerationResult, ProviderConfig } from '@/services/ai/interfaces/providers'

export class RunwayVideoProvider implements VideoProvider {
  name = 'runway'
  capabilities = ['text-to-video', 'image-to-video']
  requiresApiKey = true
  selfHostable = false
  maxResolution = '1920x1080'
  costPerSecond = 0.05

  async generateVideo(req: GenerationRequest, config?: ProviderConfig): Promise<GenerationResult> {
    // Call Runway API
    const response = await fetch('https://api.runwayml.com/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config?.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: req.prompt,
        duration: req.duration ?? 5,
        resolution: req.resolution ?? '1280x720',
      }),
    })
    // ... handle response, upload to S3, return result
  }
}

// 2. Register it at startup
// src/lib/providers.ts
import { providerRegistry } from '@/services/ai/registry'
import { RunwayVideoProvider } from '@/infrastructure/providers/video/runway'

providerRegistry.register('video', new RunwayVideoProvider())

// 3. Use it — no changes to existing code needed
// POST /api/generations
{ "type": "text-to-video", "provider": "runway", "prompt": "..." }
```

### Environment Variables

```env
# Video providers
RUNWAY_API_KEY=
PIKA_API_KEY=
LUMA_API_KEY=
REPLICATE_API_TOKEN=

# Image providers
OPENAI_API_KEY=
STABILITY_API_KEY=

# Voice providers
ELEVENLABS_API_KEY=

# Translation
DEEPL_API_KEY=

# Storage
S3_ENDPOINT=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=

# Queue
REDIS_URL=
```

### Provider Selection Logic

The service layer selects providers based on:
1. **User preference** (explicit `provider` in request)
2. **Cost optimization** (cheapest provider that supports the capability)
3. **Availability** (skip providers whose API is down)
4. **Quality tier** (Free → open-source, Creator → mid-tier, Studio → premium)
