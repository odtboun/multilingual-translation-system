import type { Touchpoint, FlightContext } from '../types';

export interface DemoStep {
  id: number; title: string; description: string;
  highlight: 'context' | 'guard' | 'multilang' | 'emergency';
  phrase: string; sourceLang: string; targetLang: string;
  touchpoint: Touchpoint; flight: FlightContext;
  expectedBehavior: string; visualHint: string;
}

export const DEMO_SCRIPT: DemoStep[] = [
  {
    id: 1, title: 'Context-Aware Translation',
    description: 'The Turkish word "sıra" translates differently depending on where you are in the airport. At a boarding gate, it means "row" — not "queue."',
    highlight: 'context',
    phrase: '15 ile 25. sıralar arasındaki yolcular biniş yapabilir',
    sourceLang: 'tr', targetLang: 'en', touchpoint: 'BOARDING',
    flight: { flight: 'TK1234', gate: 'A12', destination: 'London', destination_code: 'LHR', status: 'BOARDING', boarding_rows: '15-25' },
    expectedBehavior: '"sıralar" → "rows" (not "queues" — that\'s the check-in translation)',
    visualHint: 'The system knows this is a boarding gate. "Sıra" means seat row here. At check-in, the same word would translate as "queue."',
  },
  {
    id: 2, title: 'Terminology Enforcement',
    description: 'The guard layer catches non-standard aviation terms and corrects them in real-time. If the LLM says "boarding card," the guard enforces "boarding pass."',
    highlight: 'guard',
    phrase: 'Biniş kartınızı okutunuz lütfen',
    sourceLang: 'tr', targetLang: 'en', touchpoint: 'BOARDING',
    flight: { flight: 'TK1234', gate: 'A12', destination: 'London', destination_code: 'LHR', status: 'BOARDING', boarding_rows: '15-25' },
    expectedBehavior: 'Guard corrects "boarding card" → "boarding pass" automatically',
    visualHint: 'Watch the guard correction panel appear. Red strikethrough shows what the LLM output, green shows the enforced aviation term.',
  },
  {
    id: 3, title: 'Context Shift — Same Phrase, Different Airport',
    description: 'Now the same word "sıra" at a different touchpoint. At check-in, it means "queue" — a completely different meaning from the boarding gate.',
    highlight: 'context',
    phrase: 'Sıraya giriniz lütfen',
    sourceLang: 'tr', targetLang: 'en', touchpoint: 'CHECK_IN',
    flight: { flight: 'TK1234', gate: 'A12', destination: 'London', destination_code: 'LHR', status: 'CHECK_IN' },
    expectedBehavior: '"sıra" → "queue" (compare with boarding: it would be "row")',
    visualHint: 'Same word, different touchpoint, different translation. This is impossible with generic translation tools.',
  },
  {
    id: 4, title: '14 Languages — Instant Switch',
    description: 'The system supports 14 languages including Arabic, Russian, Chinese, and Persian. Switch languages with one tap.',
    highlight: 'multilang',
    phrase: 'Uçuşunuz rötar yaptı, yeni kapınız B04',
    sourceLang: 'tr', targetLang: 'ar', touchpoint: 'DELAY',
    flight: { flight: 'TK1234', gate: 'B04', destination: 'London', destination_code: 'LHR', status: 'DELAYED' },
    expectedBehavior: 'Arabic translation preserves flight codes (TK1234, B04) and uses correct delay terminology',
    visualHint: 'Arabic, Russian, Chinese, Persian, Japanese — all 14 languages use the same terminology guard for consistency.',
  },
  {
    id: 5, title: 'Emergency Mode',
    description: 'In emergencies, the system adapts. The context bar turns red, and translations prioritize clarity and directness above all else.',
    highlight: 'emergency',
    phrase: 'Acil durum! Lütfen en yakın çıkışa yöneliniz',
    sourceLang: 'tr', targetLang: 'en', touchpoint: 'EMERGENCY',
    flight: { flight: 'TK1234', gate: 'A12', destination: 'London', destination_code: 'LHR', status: 'EMERGENCY' },
    expectedBehavior: 'Clear, direct emergency instructions with maximum clarity',
    visualHint: 'The red context bar signals emergency mode. The system strips all ambiguity — only clear, actionable instructions.',
  },
];
