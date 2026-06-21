export type Touchpoint = 'CHECK_IN' | 'SECURITY' | 'PASSPORT' | 'BOARDING' | 'GATE' | 'TRANSFER' | 'BAGGAGE' | 'DELAY' | 'IRREGULAR' | 'DIRECTIONS' | 'EMERGENCY' | 'GENERAL';

export interface FlightContext {
  flight: string;
  gate?: string;
  destination?: string;
  destination_code?: string;
  status?: string;
  boarding_rows?: string;
}

export interface TranslateRequest {
  text: string;
  source_lang: string;
  target_lang: string;
  context?: { touchpoint?: Touchpoint; flight?: FlightContext; session_id?: string };
  model?: string;
}

export interface GuardCorrection {
  original: string;
  corrected: string;
  term_id?: string;
  reason: string;
}

export interface TranslationResult {
  translation: string;
  raw_translation: string;
  source_text: string;
  source_lang: string;
  target_lang: string;
  touchpoint: string;
  model_used: string;
  latency_ms: number;
  glossary_terms_injected: number;
  guard_corrections: GuardCorrection[];
  guard_active: boolean;
  notes: string[];
}

export interface Language {
  code: string;
  name: string;
}

export const LANGUAGES: Language[] = [
  { code: 'tr', name: 'Turkish' }, { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic' }, { code: 'ru', name: 'Russian' },
  { code: 'de', name: 'German' }, { code: 'fr', name: 'French' },
  { code: 'zh', name: 'Chinese' }, { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' }, { code: 'fa', name: 'Persian' },
  { code: 'ja', name: 'Japanese' }, { code: 'ko', name: 'Korean' },
  { code: 'pt', name: 'Portuguese' }, { code: 'nl', name: 'Dutch' },
  { code: 'hi', name: 'Hindi' },
];

export const LANGUAGE_NAMES: Record<string, string> = Object.fromEntries(LANGUAGES.map(l => [l.code, l.name]));

// BCP-47 language tags for Web Speech API
export const LANG_TO_BCP47: Record<string, string> = {
  en: 'en-US', tr: 'tr-TR', ar: 'ar-SA', ru: 'ru-RU',
  de: 'de-DE', fr: 'fr-FR', zh: 'zh-CN', es: 'es-ES',
  it: 'it-IT', fa: 'fa-IR', ja: 'ja-JP', ko: 'ko-KR',
  pt: 'pt-PT', nl: 'nl-NL', hi: 'hi-IN',
};

export const TOUCHPOINTS: { value: Touchpoint; label: string; icon: string }[] = [
  { value: 'BOARDING', label: 'Boarding Gate', icon: '🚪' },
  { value: 'CHECK_IN', label: 'Check-in Counter', icon: '🛂' },
  { value: 'SECURITY', label: 'Security Screening', icon: '🔍' },
  { value: 'PASSPORT', label: 'Passport Control', icon: '📋' },
  { value: 'BAGGAGE', label: 'Baggage Claim', icon: '🧳' },
  { value: 'TRANSFER', label: 'Transfer Desk', icon: '🔄' },
  { value: 'DIRECTIONS', label: 'Directions', icon: '🧭' },
  { value: 'DELAY', label: 'Flight Delay', icon: '⏰' },
  { value: 'IRREGULAR', label: 'Irregular Ops', icon: '⚠️' },
  { value: 'EMERGENCY', label: 'Emergency', icon: '🚨' },
  { value: 'GENERAL', label: 'General', icon: '💬' },
];

export const DEMO_FLIGHT: FlightContext = {
  flight: 'TK1234', gate: 'A12', destination: 'London',
  destination_code: 'LHR', status: 'BOARDING', boarding_rows: '15-25',
};
