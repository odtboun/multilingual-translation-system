# System Architecture

## High-Level Architecture

The system follows a **three-tier edge-native architecture** designed for the unique constraints of an airport: unreliable connectivity, high stakes, and diverse touchpoints.

```
                            ┌─────────────────────────┐
                            │     CENTRAL TIER         │
                            │   (THY Data Center)      │
                            │                          │
                            │  • Glossary Master DB    │
                            │  • Model Registry        │
                            │  • Analytics Engine      │
                            │  • Audit Log Storage     │
                            └───────────┬─────────────┘
                                        │ (TLS, gRPC)
                            ┌───────────┴─────────────┐
                            │      ZONE TIER           │
                            │  (Per Terminal Section)   │
                            │                          │
                            │  • Operational Data Cache │
                            │  • Glossary Cache (Redis)│
                            │  • Translation Proxy     │
                            │  • Message Router        │
                            └───────────┬─────────────┘
                                        │ (WiFi 6 / Ethernet)
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
            ┌───────┴───────┐   ┌───────┴───────┐   ┌───────┴───────┐
            │  DEVICE TIER   │   │  DEVICE TIER   │   │  DEVICE TIER   │
            │  (iPad @ Gate) │   │  (iPad @ CKIN) │   │  (iPad @ Xfer)│
            │                │   │                │   │                │
            │ • STT Engine   │   │ • STT Engine   │   │ • STT Engine   │
            │ • TTS Engine   │   │ • TTS Engine   │   │ • TTS Engine   │
            │ • LLM Runtime  │   │ • LLM Runtime  │   │ • LLM Runtime  │
            │ • Local Cache  │   │ • Local Cache  │   │ • Local Cache  │
            └───────────────┘   └───────────────┘   └───────────────┘
```

### Why Three Tiers?

1. **Device Tier:** Handles the real-time human interaction loop. STT, TTS, and LLM inference happen here because latency over the network to a zone server would add 50-200ms. The device also caches the most recent glossary and operational context.

2. **Zone Tier:** Aggregates operational data for a terminal section (e.g., "Gates A1-A12"). Maintains a hot cache of flight data, gate assignments, and the full aviation glossary. Devices in the zone sync with this server. If a device's local LLM fails, the zone server provides fallback translation.

3. **Central Tier:** The source of truth. Glossary master, model versions, analytics, and audit logs. Updates flow down to zone servers which distribute to devices. Analytics flow up. No real-time translation depends on this tier.

---

## Component Architecture (Per Device)

```
┌─────────────────────────────────────────────────────────┐
│                    AGENT-FACING UI                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ Translation  │  │ Context Bar  │  │ Quick Phrases   │ │
│  │ Display      │  │ (Gate A12,   │  │ ("Please wait",  │ │
│  │ (Large text) │  │  TK 1234)    │  │  "Follow me")   │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                   TRANSLATION ENGINE                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │   STT    │  │   LLM    │  │   Terminology Guard   │  │
│  │ (Whisper)│→ │ (Llama   │→ │   (Post-processing    │  │
│  │          │  │  3.3 8B) │  │    enforces glossary) │  │
│  └──────────┘  └──────────┘  └──────────────────────┘  │
│                                          │              │
│  ┌──────────────────────────────────────┘              │
│  │  ┌──────────┐  ┌──────────────────────────────────┐ │
│  │  │   TTS    │  │  PASSENGER-FACING DISPLAY         │ │
│  │  │ (Coqui)  │  │  (Large text in passenger lang)   │ │
│  │  └──────────┘  └──────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                 CONTEXT PROVIDER                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Flight Data   │  │ Gate Context  │  │ Passenger    │  │
│  │ (from Zone)   │  │ (touchpoint)  │  │ Context      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│                 LOCAL STORAGE                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Terminology   │  │ Model Weights│  │ Translation   │  │
│  │ Cache (SQLite)│  │ (GGUF, ~5GB) │  │ Log (local)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Translation Pipeline (Step by Step)

```
1. AGENT SPEAKS
   Agent speaks into iPad microphone.
   Language: Agent's language (e.g., Turkish)

2. SPEECH-TO-TEXT
   Whisper `medium` model on-device transcodes to text.
   Output: "15 ile 25. sıralar arasındaki yolcular biniş yapabilir"
   Latency: ~100ms

3. CONTEXT INJECTION
   Context provider attaches operational metadata:
   {
     "touchpoint": "BOARDING_GATE",
     "gate": "A12",
     "flight": "TK1234",
     "destination": "LHR",
     "boarding_group": "B",
     "passenger_rows": "15-25"
   }

4. TERMINOLOGY RETRIEVAL
   Semantic search over local terminology cache:
   - "biniş" → retrieved canonical terms: "boarding", "board"
   - "sıralar" → "rows"
   Context biases retrieval (BOARDING_GATE context boosts boarding terms)

5. TRANSLATION (LLM)
   Prompt to fine-tuned Llama 3.3 8B:
   ```
   [SYSTEM] You are an aviation ground handling translator at Istanbul Airport.
   Translate Turkish to English. Use aviation terminology.
   Context: Boarding gate A12, Flight TK1234 to London Heathrow.
   Glossary: biniş=boarding, sıra=row, yolcu=passenger

   [USER] 15 ile 25. sıralar arasındaki yolcular biniş yapabilir

   [ASSISTANT] Passengers in rows 15 through 25 may now board.
   ```
   Latency: ~200ms (4-bit quantized on Apple Neural Engine)

6. TERMINOLOGY GUARD (Post-Processing)
   Validates output against glossary:
   - "boarding" ✓ (matches canonical term)
   - "rows 15 through 25" ✓ (matches numeric pattern)
   - "Passengers" ✓
   If guard detects term mismatch, replaces with canonical term.
   Latency: ~5ms

7. DISPLAY + TTS
   - Agent screen shows both original and translation
   - Passenger-facing display shows translation in large text
   - Optional: TTS reads translation aloud
   Latency: ~50ms

TOTAL END-TO-END: ~350ms
```

---

## Context-Aware Translation: Why It Matters

The same Turkish phrase can need different English translations depending on where it's spoken:

| Turkish Phrase | At Check-In | At Boarding Gate | At Security |
|---|---|---|---|
| "Sıraya girin" | "Please join the check-in queue" | "Please form a boarding line" | "Please proceed through the lane" |
| "Belgeniz hazır olsun" | "Have your passport and ticket ready" | "Have your boarding pass ready" | "Have your ID and boarding pass ready" |
| "Buradan devam edin" | "Proceed to security screening" | "Proceed down the jetbridge" | "Proceed through the metal detector" |

The system achieves this by:
1. Injecting touchpoint context into the LLM prompt
2. Using context-biased terminology retrieval
3. Having touchpoint-specific canonical phrase templates as fallback

---

## Offline Mode

```
┌─────────────────────────────────────────┐
│           NORMAL OPERATION               │
│                                          │
│  Device ←→ Zone Server ←→ Central       │
│  (all tiers connected)                   │
│                                          │
│  Zone syncs glossary + ops data every 30s│
│  Device caches last 24h of context       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           ZONE SERVER OFFLINE            │
│                                          │
│  Device → (Zone unreachable)             │
│                                          │
│  Device uses local cache:                │
│  - Cached glossary (last sync)           │
│  - Cached flight data (last known)       │
│  - Local LLM (always available)          │
│                                          │
│  Degradation: Flight data may be stale   │
│  Mitigation: Agent can manually select   │
│  active flight from cached list          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           DEVICE OFFLINE (ISOLATED)      │
│                                          │
│  Device has:                             │
│  - Full LLM model (always on-device)     │
│  - Core glossary (pre-loaded, ~2000      │
│    terms covering all touchpoints)       │
│  - Manual context selection              │
│                                          │
│  Full translation capability maintained. │
│  Only operational context is manual.     │
└─────────────────────────────────────────┘
```

---

## Security Architecture

```
┌────────────────────────────────────────────┐
│              DATA CLASSIFICATION            │
├──────────────────┬─────────────────────────┤
│ PII (Passenger)  │ Name, passport, seat     │
│                  │ STAYS ON DEVICE          │
│                  │ Never transmitted        │
├──────────────────┼─────────────────────────┤
│ Operational      │ Flight #, gate, status   │
│                  │ Shared zone↔device       │
├──────────────────┼─────────────────────────┤
│ Translation Meta │ Language pair, latency,  │
│                  │ touchpoint, model ver    │
│                  │ Shared central for       │
│                  │ analytics                │
├──────────────────┼─────────────────────────┤
│ Audio            │ Agent speech             │
│                  │ Transcribed on-device    │
│                  │ Audio NEVER stored       │
└──────────────────┴─────────────────────────┘
```

### Key Security Properties:

1. **Passenger PII never leaves the device.** The DCS lookup happens on-device, and the passenger name is injected into context locally. It never transits the network.

2. **Audio is ephemeral.** Whisper processes audio in a streaming buffer. Raw audio is discarded immediately after transcription.

3. **All network traffic is encrypted.** TLS 1.3 for all device↔zone↔central communication. mTLS for service-to-service auth.

4. **Translation logs are anonymized.** Central analytics receives: timestamp, language pair, touchpoint, latency, model version, glossary match rate. Never: what was said, who said it, which passenger.

5. **KVKK/GDPR compliance.** Turkish Personal Data Protection Law (KVKK) and GDPR compliance built in from the architecture, not bolted on.

---

## Monitoring & Observability

### Metrics (Per Device → Zone → Central)
- Translation latency (p50, p95, p99)
- STT latency
- LLM inference time
- Terminology match rate (% of terms found in glossary)
- Guard override rate (% of translations corrected by post-processing)
- Offline mode duration
- Model load time
- Memory usage

### Alerts
- Latency > 1s for 5 consecutive translations
- Terminology match rate < 85% over 1 hour
- Device offline > 5 minutes
- LLM inference failures > 3 in 5 minutes

### Dashboards (Grafana)
- Real-time terminal health map (green/yellow/red per zone)
- Language distribution pie
- Latency histogram
- Terminology compliance trend
- Agent feedback trend
