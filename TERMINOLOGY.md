# Terminology Compliance & Memory Strategy

## The Core Differentiator

Aviation translation fails when generic models substitute general vocabulary for aviation-specific terms. A boarding gate agent doesn't say "sit in your chair" — they say "take your assigned seat." The system must enforce the difference.

This document defines how we guarantee terminology compliance — the system's memory of what words mean in an airport, and how that memory stays accurate, fresh, and enforced.

---

## 1. The Aviation Terminology Corpus

### 1.1 Structure

Every term in the system is stored as a structured record:

```yaml
- id: TRM-0247
  term_tr: "biniş kartı"
  term_en: "boarding pass"
  canonical: true
  context_tags: [CHECK_IN, BOARDING, GATE]
  forbidden_alternatives: ["boarding card", "flight ticket", "boarding ticket"]
  category: DOCUMENT
  priority: CRITICAL  # CRITICAL | HIGH | MEDIUM
  examples:
    - context: CHECK_IN
      usage_tr: "Biniş kartınızı ve pasaportunuzu hazırlayın lütfen."
      usage_en: "Please have your boarding pass and passport ready."
    - context: BOARDING
      usage_tr: "Biniş kartınızı okutunuz."
      usage_en: "Please scan your boarding pass."
  last_reviewed: 2026-05-15
  reviewed_by: "THY Ground Ops Terminology Committee"
```

### 1.2 Context Tags

Terms are tagged with the operational context where they're used. This powers context-aware retrieval and prevents cross-context confusion.

| Tag | Examples |
|---|---|
| CHECK_IN | boarding pass, baggage allowance, seat selection, check-in desk |
| SECURITY | liquids, electronics, metal detector, tray, belt |
| PASSPORT | passport control, visa, residence permit, stamp |
| BOARDING | boarding sequence, rows, zones, jetbridge, final call |
| GATE | gate number, gate change, departure time, delays |
| TRANSFER | connecting flight, transfer desk, terminal change |
| BAGGAGE | baggage claim, lost baggage, carousel, weight |
| DELAY | delay reason, estimated departure, rebooking |
| IRREGULAR | cancellation, accommodation, meal voucher, rerouting |
| DIRECTIONS | left, right, straight, elevator, escalator, shuttle |
| EMERGENCY | evacuation, assembly point, emergency exit |

### 1.3 Priority Levels

- **CRITICAL:** Safety or compliance terms. Must never be mistranslated. The guard layer blocks any output that doesn't use the canonical term.
- **HIGH:** Operational terms where incorrect translation causes delays or confusion.
- **MEDIUM:** Common phrases where synonyms are acceptable but the canonical term is preferred.

---

## 2. Terminology Enforcement Pipeline

### Layer 1: Prompt Injection (Pre-Translation)

Before the LLM sees the input, we inject relevant terminology into the system prompt:

```
[SYSTEM]
You are an aviation ground handling translator at Istanbul Airport.
Use these canonical terms when translating. Do NOT substitute synonyms:
- "biniş kartı" → "boarding pass" (never "boarding card" or "ticket")
- "sıra" → "row" (for seating) or "queue" (for lines) based on context
- "geç" → "delay" (for flights) or "late" (for passengers)
Context: Boarding gate A12, Flight TK1234 to LHR.
```

### Layer 2: Semantic Retrieval (RAG)

For each input phrase, we retrieve the top-K relevant terminology entries via embedding similarity search. This handles:
- Unknown terms that are in the glossary
- Context-appropriate term selection (same word, different context → different translation)

### Layer 3: Post-Processing Guard (Critical)

After the LLM produces output, the guard layer validates:

1. **Critical terms check:** For every CRITICAL term in the input, verify the output uses the canonical translation. If not, replace.
2. **Forbidden term check:** Scan output for known-bad translations (e.g., "boarding card" when it should be "boarding pass"). Replace.
3. **Numeric validation:** Flight numbers, gate numbers, times must match exactly. The LLM cannot hallucinate these.
4. **Structural validation:** Boarding announcements follow canonical templates (e.g., "Passengers in rows X through Y may now board" not "Rows X to Y can get on now").

### Example: Guard in Action

```
INPUT (TR):     "TK 1234 sefer sayılı Londra uçağımız için biniş başlamıştır.
                 15-25 sıralar arası yolcular biniş kartlarını okutabilir."

LLM OUTPUT:     "Boarding has started for our flight TK 1234 to London.
                Passengers in rows 15-25 can scan their boarding cards."

GUARD DETECTS:  "boarding cards" → FORBIDDEN. Canonical term is "boarding passes."

GUARDED OUTPUT: "Boarding has started for our flight TK 1234 to London.
                Passengers in rows 15 through 25 may now scan their
                boarding passes."

CHANGES:        "boarding cards" → "boarding passes"
                "rows 15-25" → "rows 15 through 25" (canonical format)
                "can scan" → "may now scan" (canonical boarding phrase)
```

---

## 3. Memory Strategy: How the System Remembers

### 3.1 Three-Tier Memory Architecture

```
┌─────────────────────────────────────────────┐
│               LONG-TERM MEMORY              │
│         (Glossary Master DB — Central)       │
│                                             │
│  • Full terminology corpus (all languages)  │
│  • Version history with audit trail         │
│  • Expert review workflow                   │
│  • Updated by THY terminology committee     │
│  • Push updates to zones (weekly/daily)     │
└───────────────────┬─────────────────────────┘
                    │
┌───────────────────┴─────────────────────────┐
│              WORKING MEMORY                  │
│         (Redis Cache — Zone Server)          │
│                                              │
│  • Full glossary for active terminal section │
│  • Embedding index for semantic search       │
│  • Operational context (current flights)     │
│  • Updated from central + live ops data      │
│  • TTL: 24 hours for ops, permanent for      │
│    glossary (refreshed on central push)      │
└───────────────────┬─────────────────────────┘
                    │
┌───────────────────┴─────────────────────────┐
│              EPISODIC MEMORY                 │
│         (SQLite — Per Device)                │
│                                              │
│  • Core glossary subset (all CRITICAL terms) │
│  • Last 100 translations (local context)     │
│  • Device-specific phrase shortcuts          │
│  • Survives offline mode                     │
│  • Synced with zone on reconnect             │
└─────────────────────────────────────────────┘
```

### 3.2 Episodic Memory: What the Device Remembers

The device maintains a short-term memory of recent interactions to enable multi-turn conversation:

```
Example session at Gate A12:

Turn 1:
  Agent: "15-25 sıralar arası biniş başlamıştır"
  System: "Passengers in rows 15 through 25 may now board."
  → Memory stores: {flight: TK1234, context: BOARDING, rows: "15-25"}

Turn 2:
  Agent: "Şimdi 26-35 arası"
  System understands "arası" refers to rows based on Turn 1 context.
  Translation: "Now boarding rows 26 through 35."
  (Without episodic memory: "Now between 26-35" — meaningless)

Turn 3:
  Agent: "Son çağrı, kapı kapanıyor"
  System knows it's still TK1234 boarding from Turns 1-2.
  Translation: "Final call for flight TK1234 to London. Gate closing."
```

### 3.3 Memory Constraints

- Episodic memory is **per session** (resets when agent changes flight/gate)
- Maximum 10-turn context window (aviation interactions are short)
- Passenger-specific data (name, seat) purged from memory when session ends
- No cross-passenger memory — each interaction is independent

---

## 4. Glossary Lifecycle

### 4.1 Creation

- Initial corpus built from: ICAO standards, IATA codes, THY operational manuals, airport signage, ground handling SOPs
- Reviewed and approved by THY Ground Operations Terminology Committee
- Versioned: `glossary-v1.0.0.yaml`

### 4.2 Maintenance

- **Weekly review cycle:** New terms flagged by agents (via feedback button) reviewed weekly
- **Monthly audit:** Random sample of 100 translations reviewed by bilingual ground ops staff for terminology accuracy
- **Quarterly full review:** Full glossary reviewed by terminology committee

### 4.3 Distribution

- Central → Zone: Push on update (with version check)
- Zone → Device: Pull on connect (delta sync — only changed terms)
- Version mismatch handling: Device checks version on connect. If stale, downloads delta before accepting new translations.

### 4.4 Feedback Loop

```
Agent sees translation → Agent flags "wrong term" →
  → Feedback stored with translation context →
    → Weekly review queue →
      → Committee accepts/rejects →
        → If accepted: glossary updated →
          → New version pushed to all zones →
            → Devices sync on next connect
```

This loop is critical — aviation terminology evolves, and the system must evolve with it.

---

## 5. Language-Specific Challenges

### 5.1 Agglutinative Languages (Turkish)

Turkish is agglutinative — words are built by adding suffixes. This breaks naive token matching.

**Example:**
- "biniş kartınızı" = "your boarding pass" (biniş + kart + ınız + ı)
- A simple glossary lookup for "biniş kartı" would miss "biniş kartınızı"
- Solution: Stemming/lemmatization pre-processing before glossary lookup

### 5.2 Honorifics (Japanese, Korean)

Japanese and Korean have complex honorific systems. The translation must use the appropriate politeness level for the situation.

**Strategy:**
- Airport communication is formal by default → use です/ます (desu/masu) form in Japanese
- No casual forms in any language
- Emergency announcements use the most direct form

### 5.3 Right-to-Left Languages (Arabic, Persian)

Display considerations:
- RTL text alignment on passenger-facing display
- Numerals: Arabic uses Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩) in some contexts, Western (123456789) in others — context-dependent

### 5.4 Gender in Translation

Many languages (French, Spanish, Russian, Arabic) have gendered forms. The system must handle:
- Gender-neutral where possible
- When not possible, use formal/masculine as default (standard in aviation)
- Future: detect passenger gender for personalized translations (Phase 3)

---

## 6. Validation & Testing

### 6.1 Terminology Accuracy Testing

- **Test set:** 1,000 aviation phrases covering all contexts, validated by bilingual ground ops staff
- **Metric:** BLEU score + human evaluation (preferred)
- **Pass threshold:** >95% human-rated accuracy on CRITICAL terms, >90% on HIGH, >85% on MEDIUM

### 6.2 Adversarial Testing

- **Hallucination probing:** Input phrases designed to trigger hallucinations (e.g., "flight TK 9999" — no such flight)
- **Context confusion:** Same phrase in different contexts — does the system differentiate?
- **Code-switching:** Mixing languages in input (common in multilingual environments)

### 6.3 Continuous Validation

- Every translation logged with terminology match metadata
- Daily automated report: % of translations where guard layer corrected output
- Rising guard correction rate = early warning that glossary needs updating or model is degrading
