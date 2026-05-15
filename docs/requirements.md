# Functional & Non-Functional Requirements

Derived from the Turkish Airlines Terminal Accelerator challenge document and domain analysis.

## Functional Requirements

### FR-1: Real-Time Translation
The system shall translate spoken communication from the agent's language to the passenger's language in real-time.

- **FR-1.1:** End-to-end latency shall not exceed 500ms from end of speech to display of translation.
- **FR-1.2:** STT processing shall complete within 150ms.
- **FR-1.3:** LLM translation shall complete within 250ms.
- **FR-1.4:** Post-processing and display shall complete within 100ms.

### FR-2: Multilingual Support
The system shall support translation between Turkish and all major passenger languages on THY's route network.

- **FR-2.1:** Phase 1 languages: English, Arabic, Russian, German, French, Chinese, Spanish, Italian, Persian, Japanese.
- **FR-2.2:** Language selection shall be automatic based on flight origin/destination when available.
- **FR-2.3:** Agent can manually override language selection.
- **FR-2.4:** Passenger-facing display shall render correctly for RTL languages (Arabic, Persian).

### FR-3: Aviation Terminology Compliance
The system shall use aviation-standard terminology for all translations.

- **FR-3.1:** CRITICAL terms (safety, gate numbers, flight codes) shall never be mistranslated.
- **FR-3.2:** A post-processing guard layer shall enforce canonical terminology.
- **FR-3.3:** The glossary shall be versioned and auditable.
- **FR-3.4:** Agents shall be able to flag incorrect translations for review.

### FR-4: Context-Aware Translation
The system shall adapt translations based on the operational context.

- **FR-4.1:** The system shall identify the touchpoint (check-in, boarding, transfer, etc.).
- **FR-4.2:** Translations shall use touchpoint-appropriate phrasing.
- **FR-4.3:** Context shall be auto-detected from operational systems when available.
- **FR-4.4:** Agent can manually set/override context.

### FR-5: Operational Integration
The system shall integrate with airport operational systems.

- **FR-5.1:** Read flight data from FIDS (Flight Information Display System).
- **FR-5.2:** Read gate assignments and changes.
- **FR-5.3:** Read passenger context from DCS (Departure Control System) for relevant translations.
- **FR-5.4:** All integrations shall be read-only.

### FR-6: Multi-Touchpoint Support
The system shall work across all airport passenger touchpoints.

- **FR-6.1:** Check-in counters.
- **FR-6.2:** Security screening.
- **FR-6.3:** Passport control.
- **FR-6.4:** Boarding gates.
- **FR-6.5:** Transfer desks.
- **FR-6.6:** Baggage claim.
- **FR-6.7:** Irregular operations (delays, cancellations).

### FR-7: Multi-Modal Output
The system shall provide translations in multiple formats.

- **FR-7.1:** Text display on agent-facing screen.
- **FR-7.2:** Text display on passenger-facing screen (large, high-contrast).
- **FR-7.3:** Text-to-speech output in passenger's language.
- **FR-7.4:** QR code for passenger to view translation on personal device.

### FR-8: Voice Input
The system shall accept spoken input from the agent.

- **FR-8.1:** Support push-to-talk or always-listening mode.
- **FR-8.2:** Handle ambient airport noise.
- **FR-8.3:** Support Turkish as primary agent input language.
- **FR-8.4:** Filter non-speech audio (announcements, background noise).

### FR-9: Quick Phrases
The system shall provide pre-defined quick phrases for common situations.

- **FR-9.1:** 20-50 touchpoint-specific quick phrases per language pair.
- **FR-9.2:** Phrases organized by category (boarding, documents, directions, etc.).
- **FR-9.3:** Agent can customize quick phrases.

### FR-10: Multi-Turn Conversation
The system shall maintain context across multiple exchanges.

- **FR-10.1:** Remember the current flight, gate, and topic.
- **FR-10.2:** Resolve pronouns and references from previous turns.
- **FR-10.3:** Session context resets when agent changes flight/gate.

---

## Non-Functional Requirements

### NFR-1: Performance
- **NFR-1.1:** Translation latency: < 500ms (p95).
- **NFR-1.2:** System ready for use within 5 seconds of app launch.
- **NFR-1.3:** Support 50+ concurrent devices per zone server.
- **NFR-1.4:** Model inference memory footprint: < 6GB RAM.

### NFR-2: Reliability
- **NFR-2.1:** System availability: 99.9% during operational hours.
- **NFR-2.2:** Full offline capability — all core features work without internet.
- **NFR-2.3:** Graceful degradation when zone server unreachable.
- **NFR-2.4:** Automatic recovery after connectivity loss.

### NFR-3: Security & Privacy
- **NFR-3.1:** Passenger PII never transmitted off-device.
- **NFR-3.2:** Audio never stored or transmitted — processed ephemerally.
- **NFR-3.3:** All network traffic encrypted with TLS 1.3.
- **NFR-3.4:** Service-to-service authentication via mTLS.
- **NFR-3.5:** Role-based access control for administrative functions.
- **NFR-3.6:** Full audit logging (anonymized).
- **NFR-3.7:** KVKK (Turkish data protection) compliant.
- **NFR-3.8:** GDPR compliant for EU-origin passengers.

### NFR-4: Usability
- **NFR-4.1:** Agent training time: < 15 minutes.
- **NFR-4.2:** Interface usable with one hand (agent may be holding documents).
- **NFR-4.3:** Large touch targets (> 48px) for gloved hands.
- **NFR-4.4:** High contrast mode for bright terminal lighting.
- **NFR-4.5:** Passenger-facing display readable from 2 meters.

### NFR-5: Maintainability
- **NFR-5.1:** Glossary updates deployable without app update.
- **NFR-5.2:** Model updates deployable without service interruption.
- **NFR-5.3:** Centralized logging and monitoring.
- **NFR-5.4:** Automated health checks per device.

### NFR-6: Scalability
- **NFR-6.1:** Support 500+ devices across IST airport (Phase 3).
- **NFR-6.2:** Support multiple airports (Phase 4).
- **NFR-6.3:** Add new language pairs without architecture changes.
- **NFR-6.4:** Zone servers horizontally scalable.

### NFR-7: Environmental
- **NFR-7.1:** Operate in airport temperature range (15-35°C).
- **NFR-7.2:** Function under bright fluorescent lighting.
- **NFR-7.3:** Withstand ambient noise up to 85 dB.
- **NFR-7.4:** Battery life: > 8 hours active use (tablet).
