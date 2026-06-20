import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Keyboard, Mic, Copy } from 'lucide-react';
import { ContextHeader } from './ContextHeader';
import { VoiceButton } from './VoiceButton';
import { GuardDiff } from './GuardDiff';
import { Button } from './ui/Button';
import { DEMO_FLIGHT, type Touchpoint, type TranslationResult } from '../types';

interface Message {
  id: number;
  sourceText: string;
  sourceLang: string;
  result: TranslationResult | null;
  loading: boolean;
}

const API_BASE = '/api';
let msgCounter = 0;

/** A single row in a language panel — large primary text, small secondary below. */
function PanelRow({ primary, secondary, result, loading }: {
  primary: string; secondary: string;
  result: TranslationResult | null; loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="px-4 py-3 border-b border-border/50 last:border-b-0"
    >
      {/* Primary — large, emphasized */}
      {loading ? (
        <div className="flex items-center gap-2 py-2">
          <div className="w-3 h-3 rounded-full border border-text-tertiary/30 border-t-text-tertiary animate-spin" />
          <span className="text-xs text-text-tertiary">Translating...</span>
        </div>
      ) : (
        <p className="text-lg font-semibold text-text-primary leading-relaxed">
          {primary}
        </p>
      )}

      {/* Secondary — small, muted, below */}
      {!loading && secondary && (
        <div className="mt-1.5 pt-1.5 border-t border-border/30 flex items-start justify-between gap-2">
          <p className="text-[12px] text-text-tertiary leading-relaxed italic flex-1">
            {secondary}
          </p>
          {result && (
            <div className="flex items-center gap-0.5 shrink-0 pt-0.5">
              <button onClick={() => navigator.clipboard.writeText(secondary)} className="p-0.5 rounded text-text-tertiary/60 hover:text-text-secondary transition-colors" title="Copy"><Copy size={11} /></button>
              <GuardDiff corrections={result.guard_corrections} />
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export function DualPanelView({ onMetrics }: { onMetrics: (m: { count: number; latency: number; guardRate: string }) => void }) {
  const [touchpoint, setTouchpoint] = useState<Touchpoint>('BOARDING');
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<'voice' | 'text'>('text');
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [metricsAcc, setMetricsAcc] = useState({ count: 0, totalLatency: 0, corrections: 0 });
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    leftRef.current?.scrollTo({ top: leftRef.current.scrollHeight, behavior: 'smooth' });
    rightRef.current?.scrollTo({ top: rightRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const input = text.trim();
    if (!input || globalLoading) return;
    setText('');
    const id = ++msgCounter;

    const newMsg: Message = { id, sourceText: input, sourceLang: 'tr', result: null, loading: true };
    setMessages(prev => [...prev, newMsg]);
    setGlobalLoading(true);

    try {
      const res = await fetch(`${API_BASE}/translate/conversation`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, context: { touchpoint, flight: DEMO_FLIGHT } }),
      });
      const data: TranslationResult = await res.json();
      const detected = data.source_lang || 'en';

      setMessages(prev => prev.map(m => m.id === id ? { ...m, sourceLang: detected, result: data, loading: false } : m));

      const nc = metricsAcc.count + 1;
      const nl = metricsAcc.totalLatency + data.latency_ms;
      const ng = metricsAcc.corrections + data.guard_corrections.length;
      setMetricsAcc({ count: nc, totalLatency: nl, corrections: ng });
      onMetrics({ count: nc, latency: Math.round(nl / nc), guardRate: ng > 0 ? `${Math.round((ng / nc) * 100)}%` : 'Clean' });
    } catch (e) {
      console.error(e);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, loading: false } : m));
    } finally {
      setGlobalLoading(false);
      inputRef.current?.focus();
    }
  }, [text, globalLoading, touchpoint, metricsAcc, onMetrics]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="h-full flex flex-col">
      <ContextHeader touchpoint={touchpoint} onTouchpointChange={setTouchpoint} flight={DEMO_FLIGHT}
        sourceLang="auto" targetLang="auto" onSwapLanguages={() => {}} />

      {/* Dual panels */}
      <div className="flex-1 flex divide-x divide-border overflow-hidden">
        {/* LEFT: Turkish */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-2 border-b border-border bg-subtle shrink-0">
            <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-center">🇹🇷 Turkish</p>
          </div>
          <div ref={leftRef} className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-text-tertiary text-xs">Messages appear here</div>
            ) : (
              messages.map(msg => {
                const trText = msg.sourceLang === 'tr' ? msg.sourceText : (msg.result?.translation || '');
                const enText = msg.sourceLang === 'en' ? msg.sourceText : (msg.result?.translation || '');
                return (
                  <PanelRow key={msg.id}
                    primary={trText}
                    secondary={enText}
                    result={msg.result}
                    loading={msg.loading}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: English */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-2 border-b border-border bg-subtle shrink-0">
            <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider text-center">🇬🇧 English</p>
          </div>
          <div ref={rightRef} className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-text-tertiary text-xs">Messages appear here</div>
            ) : (
              messages.map(msg => {
                const trText = msg.sourceLang === 'tr' ? msg.sourceText : (msg.result?.translation || '');
                const enText = msg.sourceLang === 'en' ? msg.sourceText : (msg.result?.translation || '');
                return (
                  <PanelRow key={msg.id}
                    primary={enText}
                    secondary={trText}
                    result={msg.result}
                    loading={msg.loading}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="px-6 py-3 border-t border-border bg-surface">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center mb-3">
            <div className="flex bg-subtle rounded-lg p-0.5">
              <button onClick={() => setMode('voice')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${mode === 'voice' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}>
                <Mic size={15} />Voice
              </button>
              <button onClick={() => setMode('text')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${mode === 'text' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}>
                <Keyboard size={15} />Text
              </button>
            </div>
          </div>
          {mode === 'voice' ? (
            <div className="flex flex-col items-center py-4">
              <VoiceButton recording={recording} loading={globalLoading} disabled={globalLoading && !recording} onToggle={() => setRecording(r => !r)} />
              <p className="mt-3 text-xs text-text-tertiary text-center">Speak in any language — auto-detected</p>
            </div>
          ) : (
            <div className="flex items-end gap-3">
              <textarea ref={inputRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Type in Turkish or English..." disabled={globalLoading} rows={2}
                className="flex-1 px-4 py-2.5 text-sm rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-aviation/20 focus:border-aviation transition-all duration-150 resize-none disabled:opacity-50" />
              <Button onClick={handleSend} disabled={!text.trim() || globalLoading} loading={globalLoading} icon={<Send size={15} />} size="lg">Send</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
