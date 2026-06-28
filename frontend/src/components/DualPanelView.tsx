import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Keyboard, Mic } from 'lucide-react';
import { ContextHeader } from './ContextHeader';
import { DualMicInput } from './DualMicInput';
import { Button } from './ui/Button';
import { DEMO_FLIGHT, LANGUAGE_NAMES, type Touchpoint, type TranslationResult } from '../types';

interface Turn {
  id: number;
  sourceText: string;
  sourceLang: string;
  result: TranslationResult | null;
  loading: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function PanelRow({ text, speaker }: { text: string; speaker: 'A' | 'B' }) {
  const bg = speaker === 'A' ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200';
  const align = speaker === 'A' ? 'self-start rounded-bl-md' : 'self-end rounded-br-md';
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`${align} max-w-[85%] px-4 py-2.5 rounded-2xl border ${bg}`}
    >
      <p className="text-base font-semibold text-text-primary leading-relaxed">{text}</p>
    </motion.div>
  );
}

export function DualPanelView({ onMetrics }: { onMetrics: (m: { count: number; latency: number; guardRate: string }) => void }) {
  const [touchpoint, setTouchpoint] = useState<Touchpoint>('BOARDING');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [mode, setMode] = useState<'voice' | 'text'>('text');
  const [text, setText] = useState('');
  const [langA, setLangA] = useState<string | null>(null);
  const [langB, setLangB] = useState<string | null>(null);
  const [metricsAcc, setMetricsAcc] = useState({ count: 0, totalLatency: 0, corrections: 0 });
  const metricsRef = useRef(metricsAcc);
  useEffect(() => { metricsRef.current = metricsAcc; }, [metricsAcc]);

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const counterRef = useRef(0);

  useEffect(() => {
    leftRef.current?.scrollTo({ top: leftRef.current.scrollHeight, behavior: 'smooth' });
    rightRef.current?.scrollTo({ top: rightRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns]);

  const assignLanguages = useCallback((detectedLang: string) => {
    if (!langA && !langB) setLangA(detectedLang);
    else if (langA && !langB && detectedLang !== langA) setLangB(detectedLang);
  }, [langA, langB]);

  // ─── Process text (from text input or voice) ─────────────────
  const processText = useCallback(async (input: string) => {
    const id = ++counterRef.current;
    const newTurn: Turn = { id, sourceText: input, sourceLang: 'tr', result: null, loading: true };
    setTurns(prev => [...prev, newTurn]);

    try {
      const res = await fetch(`${API_BASE}/translate/conversation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, context: { touchpoint, flight: DEMO_FLIGHT } }),
      });
      const data: TranslationResult = await res.json();
      const detected = data.source_lang || 'en';
      setTurns(prev => prev.map(t => t.id === id ? { ...t, sourceLang: detected, result: data, loading: false } : t));
      assignLanguages(detected);

      setMetricsAcc(prev => {
        const nc = prev.count + 1;
        const nl = prev.totalLatency + data.latency_ms;
        const ng = prev.corrections + (data.guard_corrections?.length ?? 0);
        onMetrics({ count: nc, latency: Math.round(nl / nc), guardRate: ng > 0 ? `${Math.round((ng / nc) * 100)}%` : 'Clean' });
        return { count: nc, totalLatency: nl, corrections: ng };
      });
    } catch (e) {
      console.error('Translation failed:', e);
      setTurns(prev => prev.map(t => t.id === id ? { ...t, loading: false } : t));
    }
  }, [touchpoint, assignLanguages, onMetrics]);

  const handleSend = useCallback(() => {
    const input = text.trim();
    if (!input) return;
    setText('');
    processText(input);
  }, [text, processText]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleVoiceText = useCallback((voiceText: string) => {
    processText(voiceText);
  }, [processText]);

  const getSpeaker = (sourceLang: string): 'A' | 'B' => {
    if (langA && sourceLang === langA) return 'A';
    if (langB && sourceLang === langB) return 'B';
    if (!langB && langA && sourceLang !== langA) return 'B';
    return 'A';
  };

  const panelALabel = langA ? (LANGUAGE_NAMES[langA] || langA) : 'Language A';
  const panelBLabel = langB ? (LANGUAGE_NAMES[langB] || langB) : 'Language B';

  return (
    <div className="h-full flex flex-col">
      <ContextHeader touchpoint={touchpoint} onTouchpointChange={setTouchpoint} flight={DEMO_FLIGHT}
        sourceLang="auto" targetLang="auto" onSwapLanguages={() => {}} />

      {/* Dual panels */}
      <div className="flex-1 flex divide-x divide-border overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-2 border-b border-border bg-subtle shrink-0 text-center">
            <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">{panelALabel}</p>
          </div>
          <div ref={leftRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            {turns.length === 0 ? (
              <div className="flex items-center justify-center h-full text-text-tertiary text-xs">—</div>
            ) : turns.map(t => {
              const speaker = getSpeaker(t.sourceLang);
              const textInLangA = t.sourceLang === langA ? t.sourceText : (t.result?.translation || '');
              if (!textInLangA && t.loading) return null;
              return <PanelRow key={t.id} text={textInLangA || '...'} speaker={speaker} />;
            })}
          </div>
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-2 border-b border-border bg-subtle shrink-0 text-center">
            <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">{panelBLabel}</p>
          </div>
          <div ref={rightRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            {turns.length === 0 ? (
              <div className="flex items-center justify-center h-full text-text-tertiary text-xs">—</div>
            ) : turns.map(t => {
              const speaker = getSpeaker(t.sourceLang);
              const textInLangB = t.sourceLang === langB ? t.sourceText : (t.result?.translation || '');
              if (!textInLangB && t.loading) return null;
              return <PanelRow key={t.id} text={textInLangB || '...'} speaker={speaker} />;
            })}
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="px-6 py-3 border-t border-border bg-surface">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center mb-3">
            <div className="flex bg-subtle rounded-lg p-0.5">
              <button onClick={() => setMode('voice')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${mode === 'voice' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}>
                <Mic size={15} />Voice
              </button>
              <button onClick={() => setMode('text')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${mode === 'text' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}>
                <Keyboard size={15} />Text
              </button>
            </div>
          </div>

          {mode === 'voice' ? (
            <DualMicInput onVoiceText={handleVoiceText} disabled={false} />
          ) : (
            <div className="flex items-end gap-3">
              <textarea ref={inputRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Type in Turkish or English..." rows={2}
                className="flex-1 px-4 py-2.5 text-sm rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-aviation/20 focus:border-aviation transition-all duration-150 resize-none" />
              <Button onClick={handleSend} disabled={!text.trim()} icon={<Send size={15} />} size="lg">Send</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
