# Technology Stack Analysis

## Decision Framework

Every choice is evaluated against four constraints:
1. **Latency:** Must serve translations in < 500ms at the edge
2. **Offline Capability:** Must function without internet at the gate
3. **Terminology Control:** Must enforce aviation-specific terms, no hallucinations
4. **Integration Surface:** Must connect to existing airport systems (FIDS, AODB, DCS)

---

## 1. Translation Model

### Option A: Fine-Tuned Open Model (Recommended)

**Candidate models:** Llama 3.3 8B, Mistral 8B, Gemma 9B, Qwen 2.5 7B

| Factor | Assessment |
|---|---|
| Latency | 100-300ms on Apple Silicon / modern GPU (4-bit quantized) |
| Offline | Yes — runs entirely on device |
| Terminology | Enforced via LoRA fine-tune on aviation corpus |
| Cost | One-time training cost, zero per-query cost |
| Maintenance | Model updates require redeployment |

**Fine-tuning approach:**
- LoRA adapters per language pair (keeps base model shared, only adapters differ)
- Training data: synthetic translations of aviation glossary + real THY communication examples
- Validation: BLEU + human evaluation on domain-specific test set

**Quantization:** 4-bit (GGUF or AWQ) for edge deployment. 8B model at 4-bit ≈ 5GB — fits on any modern tablet/laptop.

### Option B: Frontier API (GPT-4o, Claude, Gemini)

| Factor | Assessment |
|---|---|
| Latency | 500-2000ms (network round trip) |
| Offline | No — requires internet |
| Terminology | Good with system prompt, but no hard enforcement |
| Cost | Per-query cost at scale |
| Maintenance | No model maintenance, but prompt engineering needed |

**When to use:** As cloud fallback in Phase 3, or for low-volume languages where fine-tuning isn't justified.

### Option C: Specialized Translation Model (NLLB, SeamlessM4T, MADLAD)

| Factor | Assessment |
|---|---|
| Latency | 50-200ms (smaller models) |
| Offline | Yes |
| Terminology | No domain adaptation — generic translations, no aviation awareness |
| Cost | Free, open models |
| Maintenance | No fine-tuning path for terminology |

**When to use:** As baseline comparison. Good for generic "where is the bathroom" but fails on "boarding sequence for rows 15-25."

### Decision: Option A (Fine-Tuned Open Model)

**Primary:** Llama 3.3 8B with LoRA adapters per language pair  
**Fallback:** GPT-4o for low-volume languages (Phase 2+)  
**Comparison baseline:** NLLB-200 for latency benchmarking

---

## 2. Speech-to-Text (STT)

### Primary: OpenAI Whisper (local)

- Model size: `small` or `medium` for edge devices (~500MB-1.5GB)
- Latency: 100-300ms for short utterances on modern hardware
- Languages: 99 languages including all THY target languages
- Runs entirely on-device

### Alternative: Google Cloud Speech-to-Text

- Higher accuracy for noisy environments (airport terminals are loud)
- Requires internet
- Use as cloud fallback when internet is available

### Decision: Whisper medium on-device, Google STT as cloud fallback

---

## 3. Text-to-Speech (TTS)

### Primary: Edge TTS (Microsoft Edge TTS or Coqui AI)

- Natural-sounding voices in all target languages
- Runs locally
- Latency: <100ms

### Alternative: ElevenLabs

- Highest quality voices
- Requires internet + API key
- Use for announcement pre-generation only (not real-time)

### Decision: Coqui AI TTS (open source, local) for real-time. ElevenLabs for pre-recorded announcements.

---

## 4. Retrieval-Augmented Generation (RAG) Layer

### Vector Database: LanceDB or ChromaDB (embedded)

- Runs in-process, no separate server
- Stores aviation terminology embeddings
- Semantic search latency: <10ms

### Embedding Model: BGE-M3 or multilingual-e5

- Multilingual embeddings
- Small enough for edge (500MB)
- Good semantic matching across languages

### Terminology Index Structure:

```
{
  "term_en": "boarding pass",
  "term_tr": "biniş kartı",
  "context": ["CHECK_IN", "BOARDING"],
  "canonical": true,
  "variants": ["boarding card", "flight ticket"],
  "embedding": [0.123, -0.456, ...]
}
```

---

## 5. Operational Integration

### Message Queue: RabbitMQ or MQTT

- Standard in aviation systems
- Decouples translation system from operational systems
- Handles offline buffering

### Protocol: REST for queries, WebSocket for real-time events

- FIDS/AODB data via REST polling (30s interval)
- Gate change events via WebSocket push
- DCS passenger data via REST (on-demand, per passenger)

### Data Format: IATA standard formats where available, JSON otherwise

---

## 6. Edge Device & Runtime

### Primary: iPad Pro (M2/M4) or Android Tablet (Snapdragon 8 Gen 3)

- Sufficient compute for 4-bit quantized 8B model
- Built-in microphone and speaker
- Familiar form factor for ground staff
- MDM-manageable (fleet management)

### Runtime Options:

| Runtime | Pros | Cons |
|---|---|---|
| **llama.cpp** | Fastest inference on Apple Silicon, GGUF support | C++ integration complexity |
| **Ollama** | Easy deployment, REST API | Adds overhead, not production-hardened |
| **llama-cpp-python** | Python ecosystem, good bindings | Slightly slower than raw llama.cpp |
| **MLX (Apple)** | Optimized for Apple Silicon | macOS/iOS only, smaller ecosystem |

### Decision: llama.cpp with Swift/Kotlin bindings for mobile. Python backend for the edge server (terminal zone level).

---

## 7. Backend Stack (Edge Server per Terminal Zone)

```
Language: Python 3.12+
Framework: FastAPI (async, high performance)
Database: SQLite (per-zone) + PostgreSQL (central)
Cache: Redis (glossary cache, operational data)
Message Queue: RabbitMQ
Monitoring: Prometheus + Grafana
Container: Docker
Orchestration: Kubernetes (central), Docker Compose (zone)
```

---

## 8. Frontend (Agent-Facing Tablet App)

### Primary: Swift/SwiftUI (iPad)

- Native iOS performance
- Access to Apple Neural Engine for local inference
- Built-in accessibility

### Cross-Platform Alternative: React Native

- Single codebase for iOS + Android
- Faster development
- Slightly lower performance (may matter for real-time voice)

### Decision: Swift/SwiftUI for MVP (iPad-focused). React Native if Android support needed in Phase 2.

### Passenger-Facing Display:

- Simple web view showing translation in passenger's language
- Large text, high contrast for accessibility
- Optional: QR code passenger can scan to see translation on their own phone

---

## 9. Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   THY Central (Istanbul)                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐ │
│  │ Glossary │  │ Analytics │  │ Model Registry & CDN   │ │
│  │ Manager  │  │ Dashboard │  │ (model updates)        │ │
│  └──────────┘  └──────────┘  └───────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │  TLS Gateway   │
                    └───────┬───────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────┴───────┐   ┌───────┴───────┐   ┌───────┴───────┐
│ Terminal Zone A│   │ Terminal Zone B│   │ Terminal Zone C│
│  (Edge Server) │   │  (Edge Server) │   │  (Edge Server) │
│  ┌──────────┐ │   │  ┌──────────┐ │   │  ┌──────────┐ │
│  │ Glossary │ │   │  │ Glossary │ │   │  │ Glossary │ │
│  │ Cache    │ │   │  │ Cache    │ │   │  │ Cache    │ │
│  │ Redis    │ │   │  │ Redis    │ │   │  │ Redis    │ │
│  └──────────┘ │   │  └──────────┘ │   │  └──────────┘ │
│  ┌──────────┐ │   │  ┌──────────┐ │   │  ┌──────────┐ │
│  │ FIDS/AODB│ │   │  │ FIDS/AODB│ │   │  │ FIDS/AODB│ │
│  │ Adapter  │ │   │  │ Adapter  │ │   │  │ Adapter  │ │
│  └──────────┘ │   │  └──────────┘ │   │  └──────────┘ │
│       │        │   │       │        │   │       │        │
│  ┌────┴─────┐ │   │  ┌────┴─────┐ │   │  ┌────┴─────┐ │
│  │Gate  │Gate│ │   │  │Gate  │Gate│ │   │  │Gate  │Gate│ │
│  │iPad 1│iPad│ │   │  │iPad 1│iPad│ │   │  │iPad 1│iPad│ │
│  │      │ 2  │ │   │  │      │ 2  │ │   │  │      │ 2  │ │
│  └──────┴────┘ │   │  └──────┴────┘ │   │  └──────┴────┘ │
└────────────────┘   └────────────────┘   └────────────────┘
```

### Data Flow:

1. Agent speaks into iPad → Whisper STT on-device → text
2. Text + context (gate, flight, passenger info) → Edge Server
3. Edge Server → Terminology RAG → injects aviation terms → LLM translation
4. Translation → back to iPad → display + TTS
5. All translations logged (no PII) → Central Analytics (daily batch)

---

## 10. Cost Estimate (Phase 1 MVP)

| Item | Est. Cost |
|---|---|
| Fine-tuning compute (8B model, 4 LoRA adapters) | $500-1,000 (cloud GPU) |
| 2 iPad Pro test devices | $2,000 |
| Edge server (Mac Mini M4 or Linux box) | $1,000 |
| Development (2 engineers × 4 weeks) | See team section |
| **Total hardware + compute** | **~$4,000** |

---

## 11. Alternatives Considered and Rejected

| Alternative | Why Rejected |
|---|---|
| Cloud-only translation (no edge) | Latency + offline requirement kills this |
| Off-the-shelf translation device (Pocketalk, etc.) | No aviation terminology, no integration, no context |
| Custom hardware device | Expensive, slow to iterate, THY already has iPads |
| Pure prompt engineering (no fine-tuning) | Can't guarantee terminology compliance at scale |
| Single central server (no zone servers) | Single point of failure, network dependency |
