import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Play, CheckCircle2, Sparkles, Shield, Globe, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { ContextHeader } from './ContextHeader';
import { TranslationDisplay } from './TranslationDisplay';
import { DEMO_SCRIPT, type DemoStep } from '../data/demoScript';
import { LANGUAGE_NAMES, type TranslationResult } from '../types';

const API_BASE = '/api';
const HIGHLIGHT_ICONS = { context: Sparkles, guard: Shield, multilang: Globe, emergency: AlertTriangle };
const HIGHLIGHT_COLORS: Record<string, string> = {
  context: 'text-aviation bg-aviation-light border-aviation/20',
  guard: 'text-success bg-success-bg border-success/20',
  multilang: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  emergency: 'text-danger bg-danger-bg border-danger/20',
};

export function DemoWalkthrough({ onComplete }: { onComplete?: () => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const step = DEMO_SCRIPT[stepIndex];
  const isLast = stepIndex === DEMO_SCRIPT.length - 1;
  const isFirst = stepIndex === 0;
  const Icon = HIGHLIGHT_ICONS[step.highlight];

  const runTranslation = useCallback(async (s: DemoStep) => {
    setLoading(true); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/translate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: s.phrase, source_lang: s.sourceLang, target_lang: s.targetLang, context: { touchpoint: s.touchpoint, flight: s.flight } }),
      });
      setResult(await res.json());
    } catch (e) { console.error('Demo translation failed:', e); }
    finally { setLoading(false); }
  }, []);

  if (!started) {
    return (
      <div className="h-full flex items-center justify-center bg-page">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md mx-auto space-y-8 px-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-aviation-light flex items-center justify-center"><span className="text-4xl">✈️</span></div>
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-text-primary">Aviation Translation System</h1>
            <p className="text-text-secondary text-sm leading-relaxed">A guided demonstration of context-aware, terminology-enforced translation for airport ground operations.</p>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs text-text-tertiary">
            {[{ c: 'bg-aviation', l: 'Context-Aware' }, { c: 'bg-success', l: 'Terminology Guard' }, { c: 'bg-indigo-500', l: '14 Languages' }].map(({ c, l }) => (
              <div key={l} className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${c}`} />{l}</div>
            ))}
          </div>
          <Button size="xl" onClick={() => { setStarted(true); runTranslation(DEMO_SCRIPT[0]); }} icon={<Play size={18} />}>Start Demo</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <div className="flex-1 flex flex-col">
        <ContextHeader touchpoint={step.touchpoint} onTouchpointChange={() => {}} flight={step.flight}
          sourceLang={step.sourceLang} targetLang={step.targetLang} onSwapLanguages={() => {}} />
        <TranslationDisplay result={result} loading={loading} sourceText={step.phrase} onPlayTTS={() => {}} />
        <div className="px-6 py-3 border-t border-border bg-surface flex items-center justify-between">
          <Button variant="ghost" onClick={() => { const i = stepIndex - 1; setStepIndex(i); runTranslation(DEMO_SCRIPT[i]); }} disabled={isFirst} icon={<ArrowLeft size={15} />}>Previous</Button>
          <div className="flex items-center gap-1.5">
            {DEMO_SCRIPT.map((_, i) => (<div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === stepIndex ? 'bg-aviation w-5' : 'bg-border w-2'}`} />))}
          </div>
          <Button onClick={() => { if (isLast) { onComplete?.(); } else { const i = stepIndex + 1; setStepIndex(i); runTranslation(DEMO_SCRIPT[i]); } }} icon={isLast ? undefined : <ArrowRight size={15} />}>{isLast ? 'Finish' : 'Next'}</Button>
        </div>
      </div>
      <div className="w-[360px] border-l border-border bg-surface flex flex-col shrink-0">
        <div className={`px-5 py-3 border-b ${HIGHLIGHT_COLORS[step.highlight]}`}>
          <div className="flex items-center gap-2 mb-1.5">
            <Icon size={15} />
            <Badge variant={step.highlight === 'context' ? 'default' : step.highlight === 'guard' ? 'success' : step.highlight === 'multilang' ? 'info' : 'danger'}>
              {step.highlight === 'context' ? 'Context' : step.highlight === 'guard' ? 'Guard' : step.highlight === 'multilang' ? 'Multi-Language' : 'Emergency'}
            </Badge>
          </div>
          <h2 className="text-base font-bold text-text-primary">{step.title}</h2>
        </div>
        <div className="flex-1 px-5 py-4 space-y-5 overflow-y-auto">
          <p className="text-sm text-text-secondary leading-relaxed">{step.description}</p>
          <div className="p-3 rounded-lg bg-subtle space-y-1.5">
            <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Input Phrase</p>
            <p className="text-sm text-text-primary font-medium">"{step.phrase}"</p>
            <p className="text-xs text-text-tertiary">{LANGUAGE_NAMES[step.sourceLang]} → {LANGUAGE_NAMES[step.targetLang]}</p>
          </div>
          <div><p className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-1.5">Expected Behavior</p><p className="text-sm text-success font-medium">{step.expectedBehavior}</p></div>
          <div className="p-3 rounded-lg border border-aviation/10 bg-aviation-light/50">
            <p className="text-[11px] font-medium text-aviation uppercase tracking-wider mb-1.5 flex items-center gap-1"><Sparkles size={11} />What to Notice</p>
            <p className="text-sm text-text-secondary leading-relaxed">{step.visualHint}</p>
          </div>
          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 rounded-lg bg-subtle flex items-center gap-2.5">
              <CheckCircle2 size={15} className="text-success shrink-0" />
              <div className="text-xs"><span className="text-text-primary font-medium tabular-nums">{result.latency_ms}ms</span><span className="text-text-tertiary"> · {result.model_used}</span></div>
            </motion.div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-border">
          <Button variant="secondary" onClick={() => runTranslation(step)} loading={loading} className="w-full" size="sm">Replay This Step</Button>
        </div>
      </div>
    </div>
  );
}
