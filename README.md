# Multilingual Translation System for Aviation Ground Handling

Real-time, AI-powered, aviation-terminology-compliant communication system for airport ground operations.

## Quick Start

```bash
# Install
make install

# Run the server
make dev

# Run tests
make test
```

**Debug UI:** http://localhost:8000/debug  
**API Docs:** http://localhost:8000/docs

## Architecture

```
server/                        # Python backend (FastAPI)
├── main.py                    # App entry point
├── config.py                  # Configuration (env-based)
├── models.py                  # Pydantic data models
├── translation/
│   ├── engine.py              # Pipeline orchestrator
│   ├── llm.py                 # fal.ai/OpenRouter LLM client
│   ├── guard.py               # Terminology guard (post-processing)
│   ├── context.py             # Session & context management
│   └── prompts.py             # Touchpoint-specific system prompts
├── glossary/
│   ├── loader.py              # YAML glossary loader + indexer
│   └── search.py              # Context-aware term retrieval
└── routes/
    ├── translate.py            # POST /api/translate
    ├── glossary.py             # Glossary browse & search API
    └── debug.py                # Batch test, context compare, health

debug-ui/                      # Standalone debug interface (HTML+JS)
├── index.html
├── styles.css
└── app.js

corpus/                        # Aviation terminology data
└── aviation_glossary.yaml     # 74 terms, 129 forbidden alternatives

tests/                         # Test suites
├── test_guard.py              # Terminology guard tests (11 cases)
├── test_glossary.py           # Glossary search & retrieval tests (13 cases)
└── fixtures/
    └── test_phrases.json      # Standard test phrases (10 scenarios)
```

## Translation Pipeline

```
Agent Input → Glossary Lookup → Prompt Construction → LLM Call → Terminology Guard → Output
                                      ↑
                              Context Injection
                         (touchpoint, flight, gate)
```

1. **Glossary Lookup** — finds aviation terms in the input text, scored by context relevance
2. **Prompt Construction** — builds a touchpoint-specific system prompt with terminology injected
3. **LLM Call** — sends to Gemini Flash via fal.ai OpenRouter gateway
4. **Terminology Guard** — enforces canonical terms, replaces forbidden alternatives, validates numerics

## API

### `POST /api/translate`

```json
{
  "text": "15 ile 25. sıralar arasındaki yolcular biniş yapabilir",
  "source_lang": "tr",
  "target_lang": "en",
  "context": {
    "touchpoint": "BOARDING",
    "flight": { "flight": "TK1234", "gate": "A12", "destination": "London" }
  }
}
```

**Response:** Translation + full pipeline metadata (latency, terms injected, guard corrections, model used)

### Debug Endpoints

| Endpoint | Description |
|---|---|
| `POST /api/debug/batch` | Run batch translation tests with pass/fail criteria |
| `POST /api/debug/compare` | Same phrase across different touchpoints |
| `GET /api/debug/health` | System health, glossary stats, config |
| `GET /api/glossary/search?q=bagaj` | Search the aviation glossary |
| `GET /api/glossary/all` | Browse all glossary terms |

## Debug Interface

The debug UI at `/debug` provides 5 tools:

1. **Translation Tester** — single translation with full metadata display
2. **Batch Tester** — run preset test suites or custom phrases, see pass/fail
3. **Context Compare** — see how context changes translation of the same phrase
4. **Glossary Browser** — search and filter the aviation terminology glossary
5. **Conversation Simulator** — multi-turn conversation with session context

## Supported Languages

Turkish, English, Arabic, Russian, German, French, Chinese, Spanish, Italian, Persian, Japanese, Korean, Portuguese, Dutch

## Key Design Principles

1. **Aviation-First** — built around airport workflows, not generic translation
2. **Terminology-Compliant** — 74 canonical terms with 129 forbidden alternatives enforced by post-processing guard
3. **Context-Aware** — same phrase translates differently at check-in vs. boarding gate
4. **Text-First** — solid text-to-text foundation; voice will layer on top
5. **Debug-Friendly** — every translation returns full pipeline metadata

## Configuration

Set these in `.env`:

```
FAL_KEY=your_fal_ai_key
DEFAULT_MODEL=google/gemini-2.5-flash
FALLBACK_MODEL=anthropic/claude-sonnet-4
```
