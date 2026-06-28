import { useState, useCallback } from 'react';
import { ContextHeader } from './ContextHeader';
import { TranslationDisplay } from './TranslationDisplay';
import { InputArea } from './InputArea';
import { LANGUAGE_NAMES, DEMO_FLIGHT, type Touchpoint, type TranslationResult } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export function OperatorTerminal({ onMetrics }: { onMetrics: (m: { count: number; latency: number; guardRate: string }) => void }) {
  const [touchpoint, setTouchpoint] = useState<Touchpoint>('BOARDING');
  const [sourceLang, setSourceLang] = useState('tr');
  const [targetLang, setTargetLang] = useState('en');
  const [sourceText, setSourceText] = useState('');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [metricsAcc, setMetricsAcc] = useState({ count: 0, totalLatency: 0, corrections: 0 });

  const swapLanguages = useCallback(() => {
    setSourceLang(prev => { const n = targetLang; setTargetLang(prev); return n; });
    setResult(null); setSourceText('');
  }, [targetLang]);

  const handleTranslate = useCallback(async (text: string) => {
    setSourceText(text); setLoading(true); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/translate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source_lang: sourceLang, target_lang: targetLang, context: { touchpoint, flight: DEMO_FLIGHT } }),
      });
      const data: TranslationResult = await res.json();
      setResult(data);
      const newCount = metricsAcc.count + 1;
      const newTotalLat = metricsAcc.totalLatency + data.latency_ms;
      const newCorrections = metricsAcc.corrections + (data.guard_corrections?.length ?? 0);
      setMetricsAcc({ count: newCount, totalLatency: newTotalLat, corrections: newCorrections });
      onMetrics({ count: newCount, latency: Math.round(newTotalLat / newCount), guardRate: newCorrections > 0 ? `${Math.round((newCorrections / newCount) * 100)}%` : 'Clean' });
    } catch (e) { console.error('Translation failed:', e); }
    finally { setLoading(false); }
  }, [sourceLang, targetLang, touchpoint, metricsAcc, onMetrics]);

  const handleVoiceToggle = useCallback(() => setRecording(r => !r), []);

  return (
    <div className="h-full flex flex-col">
      <ContextHeader touchpoint={touchpoint} onTouchpointChange={setTouchpoint} flight={DEMO_FLIGHT}
        sourceLang={sourceLang} targetLang={targetLang} onSwapLanguages={swapLanguages} />
      <TranslationDisplay result={result} loading={loading} sourceText={sourceText} onPlayTTS={() => {}} />
      <InputArea onTranslate={handleTranslate} onVoiceToggle={handleVoiceToggle}
        recording={recording} loading={loading} sourceLangName={LANGUAGE_NAMES[sourceLang]} />
    </div>
  );
}
