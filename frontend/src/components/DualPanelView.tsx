import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Keyboard, Mic } from 'lucide-react';
import { ContextHeader } from './ContextHeader';
import { VoiceButton, type VoicePhase } from './VoiceButton';
import { Button } from './ui/Button';
import { DEMO_FLIGHT, type Touchpoint, type TranslationResult } from '../types';

interface Turn {
  id: number;
  sourceText: string;
  sourceLang: string;
  result: TranslationResult | null;
  loading: boolean;
}

const API_BASE = '/api';
const LANG_NAMES: Record<string, string> = {
  tr: 'Turkish', en: 'English', ar: 'Arabic', ru: 'Russian',
  de: 'German', fr: 'French', zh: 'Chinese', es: 'Spanish',
  it: 'Italian', fa: 'Persian', ja: 'Japanese', ko: 'Korean',
  pt: 'Portuguese', nl: 'Dutch',
};

// Speaker colors — soft backgrounds
const SPEAKER_A_BG = 'bg-blue-50 border-blue-200';
const SPEAKER_B_BG = 'bg-orange-50 border-orange-200';

/** A single row inside a language panel. */
function PanelRow({ text, speaker }: { text: string; speaker: 'A' | 'B' }) {
  const bg = speaker === 'A' ? SPEAKER_A_BG : SPEAKER_B_BG;
  const align = speaker === 'A' ? 'self-start rounded-bl-md' : 'self-end rounded-br-md';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
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
  const [voicePhase, setVoicePhase] = useState<VoicePhase>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceLang, setVoiceLang] = useState('tr-TR'); // default Turkish (airport context)
  const [langA, setLangA] = useState<string | null>(null); // detected language for speaker A
  const [langB, setLangB] = useState<string | null>(null); // detected language for speaker B
  const [metricsAcc, setMetricsAcc] = useState({ count: 0, totalLatency: 0, corrections: 0 });

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const counterRef = useRef(0);

  const metricsRef = useRef(metricsAcc);
  useEffect(() => { metricsRef.current = metricsAcc; }, [metricsAcc]);

  // Auto-scroll both panels
  useEffect(() => {
    leftRef.current?.scrollTo({ top: leftRef.current.scrollHeight, behavior: 'smooth' });
    rightRef.current?.scrollTo({ top: rightRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns]);

  // Auto-assign languages from detected source langs
  const assignLanguages = useCallback((detectedLang: string) => {
    if (!langA && !langB) {
      setLangA(detectedLang);
    } else if (langA && !langB && detectedLang !== langA) {
      setLangB(detectedLang);
    }
  }, [langA, langB]);

  // ─── Core: send text, get translation, append to turns ──────
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
      // Update voice recognition language based on detected language
      setVoiceLang(detected === 'tr' ? 'tr-TR' : 'en-US');

      // Metrics
      setMetricsAcc(prev => {
        const nc = prev.count + 1;
        const nl = prev.totalLatency + data.latency_ms;
        const ng = prev.corrections + data.guard_corrections.length;
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

  // ─── Voice ───────────────────────────────────────────────────
  const startWebSpeech = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return false;
    const r = new SR();
    r.continuous = true; r.interimResults = true; r.lang = voiceLang;

    r.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '', finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interim += result[0].transcript;
      }
      if (interim) setInterimTranscript(interim);
      if (finalText.trim()) {
        setInterimTranscript('');
        setVoicePhase('translating');
        processText(finalText.trim()).then(() => setVoicePhase('idle'));
      }
    };
    r.onerror = () => setVoicePhase('idle');
    r.onend = () => { if (voicePhase === 'recording') r.start(); };
    recognitionRef.current = r;
    r.start();
    return true;
  }, [voicePhase, processText]);

  const startAudioRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mt = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const mr = new MediaRecorder(stream, { mimeType: mt });
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mt });
        setVoicePhase('transcribing');
        try {
          const fd = new FormData(); fd.append('audio', blob, 'recording.webm');
          const res = await fetch(`${API_BASE}/voice/stt`, { method: 'POST', body: fd });
          if (res.ok) {
            const data = await res.json();
            if (data.text?.trim()) { setVoicePhase('translating'); await processText(data.text.trim()); }
          }
        } catch (e) { console.error('STT failed:', e); }
        setVoicePhase('idle');
      };
      mr.start();
    } catch { setVoicePhase('idle'); }
  }, [processText]);

  const toggleRecording = useCallback(() => {
    if (voicePhase === 'recording') {
      recognitionRef.current?.stop();
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
      if (interimTranscript.trim()) {
        const t = interimTranscript.trim(); setInterimTranscript('');
        setVoicePhase('translating'); processText(t).then(() => setVoicePhase('idle'));
      } else setVoicePhase('idle');
    } else if (voicePhase === 'idle') {
      const ok = startWebSpeech();
      if (ok) { setVoicePhase('recording'); setInterimTranscript(''); }
      else { setVoicePhase('recording'); startAudioRecording(); }
    }
  }, [voicePhase, startWebSpeech, startAudioRecording, interimTranscript, processText]);

  // ─── Determine which speaker a turn belongs to ───────────────
  const getSpeaker = (sourceLang: string): 'A' | 'B' => {
    if (langA && sourceLang === langA) return 'A';
    if (langB && sourceLang === langB) return 'B';
    if (!langB && langA && sourceLang !== langA) return 'B';
    return 'A';
  };

  const panelALabel = langA ? LANG_NAMES[langA] || langA : 'Language A';
  const panelBLabel = langB ? LANG_NAMES[langB] || langB : 'Language B';

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      <ContextHeader touchpoint={touchpoint} onTouchpointChange={setTouchpoint} flight={DEMO_FLIGHT}
        sourceLang="auto" targetLang="auto" onSwapLanguages={() => {}} />

      <div className="flex-1 flex divide-x divide-border overflow-hidden">
        {/* Panel: Language A */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-2 border-b border-border bg-subtle shrink-0 text-center">
            <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">{panelALabel}</p>
          </div>
          <div ref={leftRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            {turns.length === 0 ? (
              <div className="flex items-center justify-center h-full text-text-tertiary text-xs">—</div>
            ) : (
              turns.map(t => {
                const speaker = getSpeaker(t.sourceLang);
                const textInLangA = t.sourceLang === langA ? t.sourceText : (t.result?.translation || '');
                if (!textInLangA && t.loading) return null;
                return <PanelRow key={t.id} text={textInLangA || '...'} speaker={speaker} />;
              })
            )}
          </div>
        </div>

        {/* Panel: Language B */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-2 border-b border-border bg-subtle shrink-0 text-center">
            <p className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">{panelBLabel}</p>
          </div>
          <div ref={rightRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            {turns.length === 0 ? (
              <div className="flex items-center justify-center h-full text-text-tertiary text-xs">—</div>
            ) : (
              turns.map(t => {
                const speaker = getSpeaker(t.sourceLang);
                const textInLangB = t.sourceLang === langB ? t.sourceText : (t.result?.translation || '');
                if (!textInLangB && t.loading) return null;
                return <PanelRow key={t.id} text={textInLangB || '...'} speaker={speaker} />;
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
            <div className="flex flex-col items-center py-2">
              <VoiceButton phase={voicePhase} onToggle={toggleRecording} />
              <AnimatePresence>
                {interimTranscript && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="mt-3 px-4 py-2 rounded-lg bg-aviation-light/50 border border-aviation/10 max-w-md">
                    <p className="text-sm text-text-primary leading-relaxed">{interimTranscript}<span className="inline-block w-1 h-4 bg-aviation ml-0.5 animate-pulse align-middle" /></p>
                  </motion.div>
                )}
              </AnimatePresence>
              <p className="mt-2 text-xs text-text-tertiary text-center">
                Voice:{' '}
                <button
                  onClick={() => setVoiceLang(v => v === 'tr-TR' ? 'en-US' : 'tr-TR')}
                  className="font-medium text-text-secondary hover:text-aviation underline decoration-dotted underline-offset-2 transition-colors"
                >
                  {voiceLang === 'tr-TR' ? 'Türkçe' : 'English'}
                </button>
                {' '}· tap to switch
              </p>
            </div>
          ) : (
            <div className="flex items-end gap-3">
              <textarea ref={inputRef} value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Type in Turkish or English..." disabled={voicePhase !== 'idle'} rows={2}
                className="flex-1 px-4 py-2.5 text-sm rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-aviation/20 focus:border-aviation transition-all duration-150 resize-none disabled:opacity-50" />
              <Button onClick={handleSend} disabled={!text.trim() || voicePhase !== 'idle'} loading={voicePhase !== 'idle'} icon={<Send size={15} />} size="lg">Send</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
