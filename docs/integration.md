# Integration Strategy: Airport Operational Systems

## Overview

The translation system must integrate with existing airport infrastructure to provide context-aware translations. This document defines the integration points, protocols, and fallback strategies.

**Key principle:** All integrations are read-only. The translation system never writes to operational systems.

---

## Integration Points

### 1. Flight Information Display System (FIDS)

**What it provides:** Real-time flight status, gate assignments, scheduled/estimated times, delays.

**Protocol:** REST API (pull) + WebSocket (push for gate changes)

**Data consumed:**
```
{
  "flight": "TK1234",
  "airline": "TK",
  "destination": "LHR",
  "scheduled_departure": "2026-05-15T14:30:00+03:00",
  "estimated_departure": "2026-05-15T14:45:00+03:00",
  "status": "BOARDING",
  "gate": "A12",
  "terminal": "1",
  "check_in_counters": "E01-E10"
}
```

**Polling interval:** 30 seconds (standard) + push on status/gate change

**Fallback:** Cached data from last successful poll. Agent can manually enter flight number.

### 2. Airport Operational Database (AODB)

**What it provides:** Master schedule, aircraft type, stand allocation, seasonal schedules.

**Protocol:** SQL query (read-only replica) or REST API depending on THY infrastructure

**Data consumed:**
- Aircraft type (affects boarding announcements — wide-body vs narrow-body)
- Stand/gate allocation plan
- Seasonal schedule for route context

**Integration frequency:** Daily sync + on-demand for irregular ops

### 3. Departure Control System (DCS)

**What it provides:** Passenger manifest, seat assignments, check-in status, boarding status.

**Protocol:** REST API (on-demand, per-flight, read-only)

**Data consumed (per translation session):**
```
{
  "flight": "TK1234",
  "passenger_name": "JOHN SMITH",    // When agent enters/detects
  "seat": "22A",
  "boarding_group": "B",
  "check_in_status": "CHECKED_IN",
  "boarding_status": "NOT_BOARDED"
}
```

**Critical privacy note:** DCS data is queried on-device and never transmitted. Passenger name used only for in-session context and purged when session ends.

**Fallback:** Agent manually enters passenger context (seat number, etc.)

### 4. Gate Management System

**What it provides:** Gate-specific operational status, equipment status.

**Protocol:** REST API or MQTT

**Data consumed:**
- Gate operational status (open/closed)
- Boarding bridge connected/disconnected
- Estimated time to departure

### 5. Baggage Handling System (BHS)

**What it provides:** Baggage status for lost/delayed baggage inquiries.

**Protocol:** REST API (on-demand)

**Used only at baggage claim touchpoint.**

---

## Integration Architecture

```
┌──────────────────────────────────────────────────────┐
│                  AIRPORT SYSTEMS                      │
│                                                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐  │
│  │ FIDS │ │ AODB │ │ DCS  │ │ GMS  │ │   BHS    │  │
│  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └────┬─────┘  │
│     │         │         │         │          │        │
│     └─────────┼─────────┼─────────┼──────────┘        │
│               │         │         │                   │
│         ┌─────┴─────────┴─────────┴─────┐             │
│         │      INTEGRATION LAYER          │             │
│         │  (MQTT Broker + API Gateway)    │             │
│         └───────────────┬────────────────┘             │
└─────────────────────────┼──────────────────────────────┘
                          │ (Firewall — Read Only)
┌─────────────────────────┼──────────────────────────────┐
│              TRANSLATION SYSTEM                         │
│                         │                               │
│         ┌───────────────┴────────────────┐              │
│         │       ZONE SERVER               │              │
│         │  • Operational Data Aggregator   │              │
│         │  • Context Provider              │              │
│         │  • Data Cache (Redis)            │              │
│         └───────────────┬────────────────┘              │
│                         │                               │
│         ┌───────────────┴────────────────┐              │
│         │       DEVICE (iPad)             │              │
│         │  • Context Consumer              │              │
│         │  • DCS Query (on-device only)    │              │
│         │  • Local Context Cache           │              │
│         └────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

---

## Data Flow for a Translation

```
1. Agent opens app at Gate A12
   → Device requests flight context from Zone Server
   → Zone Server returns: {flight: TK1234, dest: LHR, status: BOARDING, ...}

2. Agent begins translation session
   → Context injected into LLM prompt: "Boarding gate A12, Flight TK1234 to London"
   → If agent scans passenger boarding pass, device queries DCS for seat/name

3. Translation request
   → Agent speaks: "15-25 arası yolcular biniş yapabilir"
   → STT on-device
   → LLM prompt includes: flight context + terminology + passenger context
   → Translation produced + guard layer applied
   → Displayed to agent and passenger

4. Session ends
   → Passenger data purged from device memory
   → Translation log (anonymized) sent to Central via Zone

5. Gate change event
   → FIDS pushes: TK1234 gate changed from A12 to B04
   → Zone receives push → updates cache → pushes to all devices in zone
   → Agent's device shows alert: "Gate changed to B04"

6. Flight departure
   → FIDS shows DEPARTED status
   → Device session ends automatically
   → Translation context cleared
```

---

## Fallback Strategy

| Scenario | Behavior |
|---|---|
| FIDS unavailable | Use cached data (stale flag shown to agent). Agent manually confirms flight. |
| DCS unavailable | Agent manually enters passenger context (seat, name if needed). |
| Zone Server offline | Device uses local cache of last-known operational data. |
| All systems offline | Device functions as standalone translator. Agent manually sets context (touchpoint, flight). Full translation capability maintained. |
| Systems recover | Device syncs with Zone on reconnect. Stale data replaced. No data loss. |

---

## Security Boundaries

```
┌──────────────────────────────────────────────┐
│               UNTRUSTED ZONE                  │
│         (Airport Operational Network)         │
│                                              │
│  FIDS ──→ API Gateway ──→ Firewall ──→       │
│  AODB ──→              (READ ONLY)    │      │
│  DCS  ──→                            │      │
└───────────────────────────────────────┼──────┘
                                        │
┌───────────────────────────────────────┼──────┐
│               TRUSTED ZONE             │      │
│         (Translation System Network)   │      │
│                                        │      │
│                    Zone Server ←───────┘      │
│                        │                      │
│                    Device Tier                │
│                  (No direct DCS access)       │
└──────────────────────────────────────────────┘
```

DCS queries happen via the Zone Server's integration layer, which enforces:
- Read-only access
- Rate limiting
- Query logging
- Data minimization (only request fields needed)
