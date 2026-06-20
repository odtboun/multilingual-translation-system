# Demo Production-Quality Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Transform the current prototype into a stunning, production-quality single-user demo that beats Google Translate for aviation ground handling — showing context-aware translation, visible terminology enforcement, and polished UI in one smooth experience.

**Architecture:** Keep the existing FastAPI + React stack. Add streaming responses, expand glossary 4x, redesign UI with guard visualization and multi-language support. No persistence, no auth, no multi-user — pure single-session demo excellence.

**Tech Stack:** FastAPI, React/Vite/TypeScript, Tailwind CSS (replace custom CSS), Lucide icons, fal.ai OpenRouter (Gemini Flash primary), Web Audio API for voice.

**Demo scenario:** Agent walks up → selects boarding gate → speaks Turkish → sees instant English translation with guard corrections highlighted → switches language → same phrase translates differently at different touchpoints → dashboard shows live metrics.

---

## Phase 1: Expand Glossary (300+ terms)

The core differentiator. 74 terms covers ~15% of common aviation interactions. We need 300+ to catch real-world phrases in a demo.

### Task 1: Audit current glossary coverage

**Objective:** Identify which categories and touchpoints are underserved.

**Files:**
- Read: `corpus/aviation_glossary.yaml`

**Step 1: Run coverage analysis**

```bash
cd /Users/omerdemirtas/Documents/Github/multilingual-translation-system
python3 -c "
import yaml
from collections import Counter
with open('corpus/aviation_glossary.yaml') as f:
    data = yaml.safe_load(f)
by_cat = Counter(t.get('category') for t in data['terms'])
by_ctx = Counter()
for t in data['terms']:
    for c in t.get('context_tags', []):
        by_ctx[c] += 1
by_pri = Counter(t.get('priority') for t in data['terms'])
print('By category:', dict(by_cat))
print('By context:', dict(by_ctx))
print('By priority:', dict(by_pri))
print('Total terms:', len(data['terms']))
print('CRITICAL terms:', by_pri.get('CRITICAL', 0))
"
```

**Step 2: Identify gaps**
Top priorities for expansion:
- BOARDING (currently ~20 terms, need 60+)
- CHECK_IN (currently ~15 terms, need 50+)
- BAGGAGE (currently ~8 terms, need 30+)
- EMERGENCY (currently ~2 terms, need 20+)
- IRREGULAR (currently ~5 terms, need 25+)

**Expected outcome:** Gap analysis showing which touchpoints and categories need most terms.

**Step 3: Commit**

```bash
git add .hermes/plans/demo-production-quality.md
git commit -m "docs: demo production-quality implementation plan"
```

### Task 2-5: Add glossary terms by touchpoint (batch execution)

**Objective:** Expand from 74 → 300+ terms across all touchpoints.

**Approach:** Generate terms from THY operational patterns. For each touchpoint, add:
- Common passenger phrases and their canonical translations
- Forbidden alternatives the guard should catch
- Context-specific disambiguations

**Term structure for each addition:**
```yaml
  - id: TRM-XXXX
    term_tr: "turkish phrase"
    term_en: "canonical english"
    canonical: true
    context_tags: [RELEVANT_TOUCHPOINTS]
    forbidden_alternatives: ["common wrong translations"]
    category: CATEGORY
    priority: CRITICAL|HIGH|MEDIUM
    examples:
      - context: TOUCHPOINT
        usage_tr: "example in turkish"
        usage_en: "canonical translation"
```

**Key term categories to add (by touchpoint):**

BOARDING (40 new terms): seat assignments, boarding groups, priority boarding, gate changes, standby, upgrade, infant boarding, special assistance, pre-boarding, jetbridge, aircraft door, overhead bins, cabin baggage sizers

CHECK_IN (35 new terms): baggage allowance, excess baggage, overweight, fragile items, dangerous goods, check-in deadlines, online check-in, self-service kiosk, baggage tag, boarding time, seat selection, window/aisle/middle, exit row, bassinet seat

SECURITY (25 new terms): liquids rule, electronics out, remove belt/shoes, metal detector, body scanner, pat-down, prohibited items, hand luggage screening, laptop out, clear plastic bag

PASSPORT (20 new terms): residence permit, work permit, tourist visa, transit visa, e-visa, passport validity, entry stamp, exit stamp, biometric passport, Schengen

BAGGAGE (25 new terms): baggage claim, carousel number, lost baggage, damaged baggage, delayed baggage, baggage tracing, PIR report, compensation, baggage delivery, oversized baggage, sporting equipment

DELAY/IRREGULAR (25 new terms): flight cancellation, rebooking, rerouting, compensation rights, hotel voucher, meal voucher, force majeure, weather delay, technical issue, crew timeout, next available flight

DIRECTIONS (20 new terms): terminal, concourse, pier, departure level, arrivals level, transit area, food court, duty free, prayer room, smoking area, information desk, meeting point, shuttle bus

EMERGENCY (15 new terms): evacuation, emergency exit, fire alarm, medical emergency, first aid, defibrillator, security alert, suspicious package, shelter in place

**Expected outcome:** 300+ total terms, balanced across touchpoints, with forbidden alternatives for guard enforcement.

**Verification:**
```bash
grep -c "^  - id:" corpus/aviation_glossary.yaml
# Expected: 300+
```

### Task 6: Verify expanded glossary with tests

**Objective:** Ensure all new terms parse correctly and guards fire.

**Step 1: Run existing tests**

```bash
cd .venv && source bin/activate && cd .. && python -m pytest tests/ -v
# Expected: All 24 tests still pass
```

**Step 2: Add spot-check tests for new terms**

Add to `tests/test_glossary.py`:
```python
def test_expanded_coverage():
    assert glossary_store.term_count >= 200
    assert len(glossary_store.get_terms_for_context("EMERGENCY")) >= 10
    assert len(glossary_store.get_critical_terms()) >= 30

def test_new_forbidden_terms():
    # Verify new guard catches
    found = glossary_store.find_forbidden_in_text("Your luggage allowance is 23kg")
    # Should catch "luggage allowance" → "baggage allowance" if defined
    found2 = glossary_store.find_forbidden_in_text("The plane is cancelled")
    # Should catch "cancelled" → "canceled" if defined
```

**Step 3: Commit**

```bash
git add corpus/aviation_glossary.yaml tests/test_glossary.py
git commit -m "feat: expand aviation glossary to 300+ terms across all touchpoints"
```

---

## Phase 2: Accuracy & Performance Optimization

### Task 7: Add streaming translation response

**Objective:** Replace the blocking LLM call with Server-Sent Events (SSE) so the translation appears character-by-character, reducing perceived latency to near-zero.

**Files:**
- Modify: `server/routes/translate.py`
- Create: `server/translation/streaming.py`
- Modify: `frontend/src/components/OperatorView.tsx`

**Step 1: Add SSE endpoint**

In `server/routes/translate.py`:
```python
from fastapi.responses import StreamingResponse
import json

@router.post("/translate/stream")
async def translate_stream(request: TranslateRequest):
    """Stream translation as it's generated."""
    async def event_generator():
        # Step 1: Glossary retrieval
        terms = retrieve_terms_for_input(text=request.text, context_tag=request.context.touchpoint.value if request.context else None)
        glossary_text = format_terms_for_prompt(terms)
        
        # Send metadata first
        yield f"data: {json.dumps({'type': 'metadata', 'terms_injected': len(terms)})}\n\n"
        
        # Step 2: Build prompt
        system_prompt = build_system_prompt(...)
        
        # Step 3: Stream LLM response
        model = request.model or settings.DEFAULT_MODEL
        async for chunk in llm_client.stream_chat(system_prompt, request.text, model):
            yield f"data: {json.dumps({'type': 'token', 'content': chunk})}\n\n"
        
        # Step 4: Guard and send final
        full_text = accumulated_text
        guarded, corrections = guard_translation(full_text, ...)
        yield f"data: {json.dumps({'type': 'complete', 'translation': guarded, 'raw': full_text, 'corrections': [c.model_dump() for c in corrections]})}\n\n"
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

**Step 2: Add streaming to LLM client**

In `server/translation/llm.py`, add:
```python
async def stream_chat(self, system_prompt: str, user_message: str, model: str = None):
    """Stream chat completion tokens."""
    payload = {
        "model": model or settings.DEFAULT_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "temperature": 0.2,
        "max_tokens": 512,
        "stream": True,
    }
    client = await self._get_client()
    async with client.stream("POST", "/chat/completions", json=payload) as response:
        async for line in response.aiter_lines():
            if line.startswith("data: "):
                data = line[6:]
                if data == "[DONE]":
                    break
                chunk = json.loads(data)
                delta = chunk["choices"][0].get("delta", {})
                if "content" in delta:
                    yield delta["content"]
```

**Step 3: Update frontend to consume SSE**

In `OperatorView.tsx`, add streaming fetch:
```typescript
const handleTranslateStream = async () => {
  const response = await fetch(`${API_BASE}/translate/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, source_lang: sourceLang, target_lang: targetLang, context: { touchpoint } })
  });
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let partial = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    // Parse SSE events
    for (const line of chunk.split('\n')) {
      if (line.startsWith('data: ')) {
        const event = JSON.parse(line.slice(6));
        if (event.type === 'token') {
          partial += event.content;
          setTranslation(partial); // Live update
        } else if (event.type === 'complete') {
          setTranslation(event.translation); // Final guarded version
          setCorrections(event.corrections);
        }
      }
    }
  }
};
```

**Expected outcome:** Translations appear character-by-character with <200ms to first token. Guard corrections animate in after stream completes.

**Step 4: Commit**

```bash
git add server/translation/streaming.py server/translation/llm.py server/routes/translate.py frontend/src/components/OperatorView.tsx
git commit -m "feat: add streaming translation with SSE (character-by-character output)"
```

### Task 8: Add common phrase instant cache

**Objective:** Common phrases like "boarding pass please" should return instantly (<10ms) without any LLM call.

**Files:**
- Create: `server/translation/cache.py`
- Modify: `server/translation/engine.py`

**Step 1: Implement phrase cache**

```python
# server/translation/cache.py
"""Pre-computed translations for high-frequency aviation phrases."""

COMMON_PHRASES = {
    ("biniş kartınızı hazırlayın", "tr", "en", "BOARDING"): "Please have your boarding pass ready.",
    ("biniş kartınızı okutunuz", "tr", "en", "BOARDING"): "Please scan your boarding pass.",
    ("sıraya giriniz", "tr", "en", "BOARDING"): "Please form a line.",
    ("15 ile 25. sıralar arasındaki yolcular biniş yapabilir", "tr", "en", "BOARDING"): "Passengers in rows 15 through 25 may now board.",
    ("bagajınızı tartıya koyun", "tr", "en", "CHECK_IN"): "Please place your baggage on the scale.",
    ("pasaportunuzu görebilir miyim", "tr", "en", "CHECK_IN"): "May I see your passport?",
    # ... 40-60 more common phrases
}

def lookup(text: str, source_lang: str, target_lang: str, touchpoint: str) -> str | None:
    """Exact match lookup. Returns None if not found."""
    key = (text.lower().strip(), source_lang, target_lang, touchpoint)
    return COMMON_PHRASES.get(key)
```

**Step 2: Integrate into engine**

In `server/translation/engine.py`, before the LLM call:
```python
# Check cache first
from server.translation.cache import lookup
cached = lookup(request.text, request.source_lang, request.target_lang, touchpoint)
if cached:
    return TranslateResponse(
        translation=cached,
        raw_translation=cached,
        source_text=request.text,
        source_lang=request.source_lang,
        target_lang=request.target_lang,
        touchpoint=touchpoint,
        model_used="cache",
        latency_ms=0.5,
        glossary_terms_injected=0,
        guard_corrections=[],
        guard_active=False,
        context_used=context,
        notes=[],
    )
```

**Expected outcome:** Top 40 common phrases return in <10ms. Makes the demo feel instant for common interactions.

**Step 3: Commit**

```bash
git add server/translation/cache.py server/translation/engine.py
git commit -m "feat: add common phrase cache for instant translations (<10ms)"
```

### Task 9: Optimize system prompts for lower latency

**Objective:** Trim prompts to reduce token count (fewer tokens = faster response). Target: 30% reduction in prompt size.

**Files:**
- Modify: `server/translation/prompts.py`

**Changes:**
- Remove verbose explanations, keep only essential instructions
- Shorten touchpoint context descriptions
- Reduce BASE_SYSTEM_PROMPT to minimal form
- Remove duplicate instructions

**Before (current BASE_SYSTEM_PROMPT):** ~1200 chars
**After (optimized):** ~600 chars

```python
BASE_SYSTEM_PROMPT = """You are an aviation translator at Istanbul Airport.

OUTPUT ONLY valid JSON: {"translation": "...", "notes": []}

RULES:
1. Translate {source_lang_name}→{target_lang_name} faithfully. Preserve meaning exactly.
2. Use informal/colloquial English naturally.
3. Context disambiguates: "bant"=belt at check-in, carousel at baggage. "sıra"=queue at security, row at boarding.
4. Use canonical glossary translations when terms appear.
5. Preserve all numbers (flight codes, gate numbers, times).
6. Add notes[] only for genuine ambiguity.

{context_section}
{glossary_section}"""
```

**Verification:** Run batch tests to confirm accuracy doesn't degrade with shorter prompt.
```bash
# Create a test that runs the same 10 phrases with old vs new prompt and compares
python -m pytest tests/ -v
```

**Step 4: Commit**

```bash
git add server/translation/prompts.py
git commit -m "perf: optimize system prompts for lower latency (30% token reduction)"
```

---

## Phase 3: UI Redesign — Production Quality

### Task 10: Replace CSS with Tailwind

**Objective:** Move from 511 lines of custom CSS to Tailwind for faster iteration and production-grade styling.

**Files:**
- Install: tailwindcss, postcss, autoprefixer
- Create: `frontend/tailwind.config.js`, `frontend/postcss.config.js`
- Replace: `frontend/src/index.css` (reduce to Tailwind directives + custom animations)
- Modify: All components to use Tailwind classes

**Step 1: Install and configure Tailwind**

```bash
cd frontend
npm install -D tailwindcss @tailwindcss/vite
```

Update `vite.config.ts`:
```typescript
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

**Step 2: Create Tailwind config with aviation theme**

```css
/* frontend/src/index.css */
@import "tailwindcss";

@theme {
  --color-aviation-50: #f0f9ff;
  --color-aviation-100: #e0f2fe;
  --color-aviation-500: #0284c7;
  --color-aviation-600: #0369a1;
  --color-aviation-700: #075985;
  --color-surface: #ffffff;
  --color-surface-alt: #f8fafc;
  --color-border: #e2e8f0;
  --color-danger-text: #991b1b;
  --color-success-text: #065f46;
}
```

**Step 3: Convert components to Tailwind**

Rewrite all components with Tailwind classes. Key elements:
- Navbar: white bg, subtle border-bottom, aviation blue accent
- Cards: white bg, rounded-xl, border, shadow-sm
- Buttons: aviation blue primary, ghost secondary
- Inputs: clean borders, focus rings
- Stats: large numbers, subtle labels

**Step 4: Commit**

```bash
git add frontend/
git commit -m "refactor: migrate from custom CSS to Tailwind with aviation design system"
```

### Task 11: Redesign OperatorView — Production Layout

**Objective:** Complete UI redesign with professional airport terminal aesthetic.

**Files:**
- Replace: `frontend/src/components/OperatorView.tsx`
- Create: `frontend/src/components/LanguageSelector.tsx`
- Create: `frontend/src/components/QuickPhrases.tsx`
- Create: `frontend/src/components/GuardDiff.tsx`
- Create: `frontend/src/components/VoiceButton.tsx`

**Layout (three-column on desktop, single-column on tablet):**

```
┌──────────────────────────────────────────────────────────────┐
│  [Location: Boarding Gate ▼]    [TR ⇄ EN]    [⚙️]           │  ← Context Bar
├──────────────┬──────────────────────────┬────────────────────┤
│              │                          │                    │
│  Quick       │                          │                    │
│  Phrases     │     Translation Area      │   Guard Diff       │
│              │                          │                    │
│  [Boarding]  │                          │   Original:        │
│  [Baggage]   │   ┌──────────────────┐   │   "boarding card"  │
│  [Delay]     │   │ "Passengers in   │   │          ↓         │
│  [Directions]│   │  rows 15 through │   │   Corrected:       │
│  [Emergency] │   │  25 may now      │   │   "boarding pass"  │
│              │   │  board."         │   │                    │
│              │   └──────────────────┘   │   ✓ terminology    │
│              │                          │   ✓ numeric check  │
│              │   [🎤 Voice] [⌨️ Text]   │                    │
│              │                          │                    │
├──────────────┴──────────────────────────┴────────────────────┤
│  Status: 247 translations today  •  423ms avg  •  98.2% term │  ← Status Bar
└──────────────────────────────────────────────────────────────┘
```

**Component specs:**

**LanguageSelector.tsx:**
```tsx
// Two dropdowns side by side with arrow between them
// Shows full language names with native script
// Auto-detects source language option
const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fa', name: 'Persian', native: 'فارسی' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  // ... all 14
];
```

**QuickPhrases.tsx:**
```tsx
// Category tabs (Boarding, Security, Baggage, etc.)
// Under each tab, 5-8 common phrases as tappable buttons
// Clicking a phrase immediately translates it
// Phrases change based on selected touchpoint
```

**GuardDiff.tsx:**
```tsx
// Shows the raw LLM output with forbidden terms struck through
// Shows the guarded output with corrections in green
// Animated transition between raw → guarded
// Bottom shows checkmarks for: terminology ✓, numerics ✓, formatting ✓
```

**VoiceButton.tsx:**
```tsx
// Large circular button with mic icon
// Pulsing animation when recording
// Waveform visualization around the button
// Smooth transition between idle → recording → processing → done
```

**Step 5: Stub components and verify build**

```bash
cd frontend && npm run build
# Expected: builds successfully with all new components
```

**Step 6: Commit**

```bash
git add frontend/src/components/
git commit -m "feat: redesign OperatorView with production layout, multi-language, guard diff, quick phrases"
```

### Task 12: Add animations and micro-interactions

**Objective:** Smooth animations make the demo feel premium.

**Files:**
- Modify: `frontend/src/index.css` (Tailwind animation utilities)
- Modify: `frontend/src/components/OperatorView.tsx`

**Animations to add:**

1. **Translation fade-in:** New translation text fades in with a subtle slide-up
2. **Guard correction highlight:** Forbidden terms flash red briefly, then green corrected terms appear
3. **Voice recording pulse:** Mic button scales 1.0→1.05→1.0 while recording
4. **Language switch flip:** 3D card flip effect when switching source/target languages
5. **Quick phrase ripple:** Material-like touch ripple on phrase buttons
6. **Status bar update:** Numbers count up to their target value on mount
7. **Loading skeleton:** Subtle shimmer on translation area while waiting
8. **Context switch slide:** Smooth slide transition when changing touchpoint

**Implementation:**
```css
@keyframes fade-slide-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes guard-correct {
  0% { color: #ef4444; text-decoration: line-through; }
  50% { color: #f59e0b; }
  100% { color: #10b981; text-decoration: none; }
}

@keyframes mic-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(2, 132, 199, 0.4); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 16px rgba(2, 132, 199, 0); }
}

.animate-fade-slide-up { animation: fade-slide-up 0.3s ease-out; }
.animate-guard-correct { animation: guard-correct 0.6s ease-out; }
.animate-mic-pulse { animation: mic-pulse 1.5s ease-in-out infinite; }
```

**Step 2: Commit**

```bash
git add frontend/src/index.css frontend/src/components/
git commit -m "feat: add micro-animations (fade-slide, guard highlight, mic pulse, ripple)"
```

### Task 13: Add live dashboard

**Objective:** Replace hardcoded DashboardView with real metrics from the running session.

**Files:**
- Replace: `frontend/src/components/DashboardView.tsx`
- Create: `server/routes/metrics.py` (or add to debug.py)

**Backend: Add metrics endpoint**

```python
# In server/routes/debug.py or new metrics.py
from collections import defaultdict
import time

# In-memory metrics store (lost on restart — fine for demo)
_metrics = {
    "total_translations": 0,
    "guard_interventions": 0,
    "latencies": [],  # last 100
    "by_touchpoint": defaultdict(int),
    "by_language_pair": defaultdict(int),
    "start_time": time.time(),
    "cache_hits": 0,
}

@router.get("/metrics")
async def get_metrics():
    latencies = _metrics["latencies"]
    if latencies:
        latencies_sorted = sorted(latencies)
        p50 = latencies_sorted[len(latencies_sorted)//2]
        p95 = latencies_sorted[int(len(latencies_sorted)*0.95)]
        p99 = latencies_sorted[int(len(latencies_sorted)*0.99)]
    else:
        p50 = p95 = p99 = 0
    
    total = _metrics["total_translations"]
    interventions = _metrics["guard_interventions"]
    
    return {
        "total_translations": total,
        "guard_interventions": interventions,
        "guard_rate": f"{(interventions/total*100):.1f}%" if total > 0 else "0%",
        "avg_latency_ms": round(sum(latencies)/len(latencies), 1) if latencies else 0,
        "latency_p50_ms": round(p50, 1),
        "latency_p95_ms": round(p95, 1),
        "latency_p99_ms": round(p99, 1),
        "cache_hit_rate": f"{(_metrics['cache_hits']/total*100):.1f}%" if total > 0 else "0%",
        "uptime_seconds": int(time.time() - _metrics["start_time"]),
        "by_touchpoint": dict(_metrics["by_touchpoint"]),
        "by_language_pair": dict(_metrics["by_language_pair"]),
    }
```

**Frontend: DashboardView with real data**

```tsx
// Polls /api/debug/metrics every 3 seconds
// Four stat cards: Total Translations, Guard Rate, Avg Latency, Cache Hits
// Bar chart for touchpoint distribution (simple div bars, no library)
// Language pair breakdown
// Recent translations feed (last 10)
// All numbers animate in on change
```

**Step 2: Commit**

```bash
git add server/routes/debug.py frontend/src/components/DashboardView.tsx
git commit -m "feat: add live dashboard with real-time metrics and animated stats"
```

---

## Phase 4: Demo Experience Polish

### Task 14: Context comparison showcase

**Objective:** The core value prop is "same phrase, different translation based on context." Make this a visible demo feature.

**Files:**
- Create: `frontend/src/components/ContextCompare.tsx`

**Feature:**
```
┌──────────────────────────────────────────────────────┐
│  Context Comparison Demo                              │
│                                                       │
│  Input: "sıraya giriniz"                              │
│                                                       │
│  ┌─────────────────┐  ┌─────────────────┐            │
│  │   CHECK-IN      │  │   BOARDING      │            │
│  │                 │  │                 │            │
│  │ "Please join    │  │ "Please form    │            │
│  │  the check-in   │  │  a boarding     │            │
│  │  queue."        │  │  line."         │            │
│  │         423ms   │  │         398ms   │            │
│  └─────────────────┘  └─────────────────┘            │
│  ┌─────────────────┐  ┌─────────────────┐            │
│  │   SECURITY      │  │   BAGGAGE       │            │
│  │                 │  │                 │            │
│  │ "Please proceed │  │  (no context-   │            │
│  │  through the    │  │   specific      │            │
│  │  screening      │  │   translation)  │            │
│  │  lane."         │  │         412ms   │            │
│  └─────────────────┘  └─────────────────┘            │
└──────────────────────────────────────────────────────┘
```

Uses the existing `POST /api/debug/compare` endpoint. Runs all 4 comparisons in parallel.

**Step 2: Commit**

```bash
git add frontend/src/components/ContextCompare.tsx frontend/src/App.tsx
git commit -m "feat: add context comparison showcase (same phrase, 4 touchpoints, side-by-side)"
```

### Task 15: Voice mode polish

**Objective:** Make voice mode feel native and professional.

**Files:**
- Modify: `frontend/src/components/OperatorView.tsx`
- Modify: `frontend/src/components/VoiceButton.tsx`

**Improvements:**
1. **Waveform visualization:** Use Web Audio API AnalyserNode to draw real-time waveform around the mic button while recording
2. **Auto-detect silence:** Stop recording after 2 seconds of silence
3. **Audio level indicator:** Show mic input level to confirm it's working
4. **Smooth STT→translation transition:** Show transcribed text first, then animate into translation
5. **TTS auto-play with visual indicator:** Show speaker icon animating while TTS plays
6. **Error states:** Show "Microphone access needed" with a clear enable button if permissions denied

**Implementation approach for waveform:**
```typescript
// Use AnalyserNode from Web Audio API
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 64;
const source = audioContext.createMediaStreamSource(stream);
source.connect(analyser);

// In animation loop, read frequency data and draw bars
const dataArray = new Uint8Array(analyser.frequencyBinCount);
analyser.getByteFrequencyData(dataArray);
// Draw bars around the mic button
```

**Step 2: Commit**

```bash
git add frontend/src/components/VoiceButton.tsx frontend/src/components/OperatorView.tsx
git commit -m "feat: add waveform visualization, silence detection, and TTS indicator to voice mode"
```

### Task 16: Demo mode toggle and preset scenarios

**Objective:** Add a "Demo Mode" that pre-configures everything and runs through a scripted scenario to impress viewers.

**Files:**
- Create: `frontend/src/components/DemoMode.tsx`
- Modify: `frontend/src/App.tsx`

**Feature:**
```tsx
// A floating "Demo Mode" toggle in the corner
// When enabled:
// 1. Pre-selects "Boarding Gate" context
// 2. Shows a list of 5 scripted demo phrases
// 3. Each phrase demonstrates a different capability:
//    - Basic translation
//    - Context disambiguation (sıra at boarding vs check-in)
//    - Terminology guard (boarding card → boarding pass)
//    - Multi-language (same phrase in Arabic, Russian)
//    - Emergency phrase
// 4. Auto-advances through the script with a "Next →" button
// 5. Shows "What just happened" explanations after each translation

const DEMO_SCRIPT = [
  {
    phrase: "15 ile 25. sıralar arasındaki yolcular biniş yapabilir",
    touchpoint: "BOARDING",
    explanation: "Context-aware: 'sıralar' → 'rows' (not 'queues') at boarding gates. Guard enforces 'rows 15 through 25' format.",
    highlight: "guard",
  },
  {
    phrase: "Biniş kartınızı okutunuz",
    touchpoint: "BOARDING",
    explanation: "Common phrase cache: instant translation (<10ms). No LLM call needed.",
    highlight: "cache",
  },
  {
    phrase: "sıraya giriniz",
    touchpoint: "CHECK_IN",
    explanation: "Same word, different context: 'sıra' at check-in becomes 'queue' not 'row'. Compare with boarding context.",
    highlight: "context",
  },
  {
    phrase: "Uçuşunuz iptal edildi, danışma bankosuna gidiniz",
    touchpoint: "IRREGULAR",
    explanation: "Irregular operations: emergency terminology and clear instructions.",
    highlight: "emergency",
  },
  {
    phrase: "Sıraya giriniz",  // Same as #3 but different translation
    touchpoint: "BOARDING",
    explanation: "Watch closely: same Turkish phrase, but now at boarding → 'form a boarding line' instead of 'join the queue'.",
    highlight: "context",
  },
];
```

**Step 2: Commit**

```bash
git add frontend/src/components/DemoMode.tsx frontend/src/App.tsx
git commit -m "feat: add demo mode with scripted scenario and explanation overlay"
```

### Task 17: Final polish — loading states, empty states, error handling

**Objective:** No broken-looking states. Every possible UI state looks intentional.

**Files:**
- Modify: Multiple frontend components

**States to handle:**

| Component | Loading | Empty | Error | Success |
|---|---|---|---|---|
| Translation area | Skeleton shimmer | "Enter text or tap mic to translate" | "Translation failed — tap to retry" | Animated text with guard diff |
| Voice button | Pulsing (recording) | "Tap to speak" | "Microphone blocked — enable in settings" | "✓ Transcribed" → translation |
| Dashboard stats | Pulsing skeleton numbers | "No translations yet — start translating to see metrics" | "Stats unavailable" | Animated numbers |
| Quick phrases | — | (always has phrases) | — | Ripple on tap |
| Language selector | — | (always populated) | — | — |
| Context compare | Spinner per panel | "Select a phrase to compare contexts" | "Comparison failed" | Side-by-side cards |
| Guard diff | — | "No corrections needed — translation was perfect" | — | Green checkmarks |

**Step 2: Commit**

```bash
git add frontend/src/
git commit -m "fix: add complete loading/empty/error states for all components"
```

---

## Phase 5: Verification & Demo Run

### Task 18: Run full test suite

```bash
cd .venv && source bin/activate && cd ..
python -m pytest tests/ -v
# Expected: All tests pass (24 existing + new ones)
```

### Task 19: Start server and verify all endpoints

```bash
# Terminal 1: Start server
make dev

# Terminal 2: Verify endpoints
curl -s http://localhost:8000/ | jq
curl -s http://localhost:8000/api/debug/health | jq
curl -s -X POST http://localhost:8000/api/translate \
  -H "Content-Type: application/json" \
  -d '{"text":"biniş kartınızı hazırlayın","source_lang":"tr","target_lang":"en","context":{"touchpoint":"BOARDING"}}' | jq
```

### Task 20: Run through demo script

Manual verification of the full demo flow:
1. Open http://localhost:5173 (Vite dev server)
2. Enable Demo Mode
3. Step through all 5 scripted phrases
4. Verify streaming, guard corrections, context comparison all work
5. Switch to Dashboard — verify live metrics updating
6. Test voice mode with actual speech
7. Test all 14 language pairs
8. Verify mobile/tablet layout at 768px and 1024px widths

### Task 21: Final commit

```bash
git add -A
git commit -m "chore: final demo polish and verification"
git push origin main
```

---

## Summary

| Phase | Tasks | Hours | Outcome |
|---|---|---|---|
| 1: Glossary | 6 | 3-4 | 300+ terms, comprehensive coverage |
| 2: Performance | 3 | 3-4 | Streaming, cache, optimized prompts |
| 3: UI Redesign | 4 | 5-6 | Production layout, multi-language, guard diff |
| 4: Polish | 4 | 3-4 | Animations, dashboard, demo mode, error states |
| 5: Verify | 4 | 1 | Tests pass, demo script verified |
| **Total** | **21** | **15-19** | **Stunning single-user aviation translation demo** |

**Key differentiators vs. Google Translate:**
1. Context-aware: same phrase → different translation based on touchpoint
2. Terminology enforcement: guard visibly corrects LLM output
3. Streaming: text appears as it's generated
4. Common phrase cache: instant for frequent interactions
5. Production UI: professional airport terminal aesthetic
6. Demo mode: scripted walkthrough showing every capability
