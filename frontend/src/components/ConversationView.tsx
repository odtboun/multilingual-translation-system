import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Keyboard, Mic } from 'lucide-react';
import { ContextHeader } from './ContextHeader';
import { VoiceButton } from './VoiceButton';
import { ChatBubble, type Speaker } from './ChatBubble';
import { Button } from './ui/Button';
import { DEMO_FLIGHT, type Touchpoint, type TranslationResult } from '../types';

interface Message {
  id: number;
  speaker: Speaker;
  sourceText: string;
  sourceLang: string;
  result: TranslationResult | null;
  loading: boolean;
}

const API_BASE = '/api';
let messageCounter = 0;

export function ConversationView({ onMetrics }: { onMetrics: (m: { count: number; latency: number; guardRate: string }) => void }) {
  const [touchpoint, setTouchpoint] = useState<Touchpoint>('BOARDING');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('text');
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [metricsAcc, setMetricsAcc] = useState({ count: 0, totalLatency: 0, corrections: 0 });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Detect speaker based on source language
  const detectSpeaker = (sourceLang: string): Speaker => {
    return sourceLang === 'tr' ? 'employee' : 'passenger';
  };

  const handleSend = useCallback(async () => {
    const inputText = text.trim();
    if (!inputText || globalLoading) return;

    setText('');
    const msgId = ++messageCounter;

    // Add message in loading state
    const newMsg: Message = {
      id: msgId,
      speaker: 'employee', // placeholder, updated after detection
      sourceText: inputText,
      sourceLang: 'tr',
      result: null,
      loading: true,
    };
    setMessages(prev => [...prev, newMsg]);
    setGlobalLoading(true);

    try {
      const res = await fetch(`${API_BASE}/translate/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, context: { touchpoint, flight: DEMO_FLIGHT } }),
      });
      const data: TranslationResult = await res.json();
      const detectedLang = data.source_lang || 'en';
      const speaker = detectSpeaker(detectedLang);

      // Update the message with result
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, speaker, sourceLang: detectedLang, result: data, loading: false } : m
      ));

      const newCount = metricsAcc.count + 1;
      const newTotalLat = metricsAcc.totalLatency + data.latency_ms;
      const newCorrections = metricsAcc.corrections + data.guard_corrections.length;
      setMetricsAcc({ count: newCount, totalLatency: newTotalLat, corrections: newCorrections });
      onMetrics({ count: newCount, latency: Math.round(newTotalLat / newCount), guardRate: newCorrections > 0 ? `${Math.round((newCorrections / newCount) * 100)}%` : 'Clean' });
    } catch (e) {
      console.error('Conversation translation failed:', e);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, loading: false } : m));
    } finally {
      setGlobalLoading(false);
      inputRef.current?.focus();
    }
  }, [text, globalLoading, touchpoint, metricsAcc, onMetrics]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceToggle = useCallback(() => setRecording(r => !r), []);

  return (
    <div className="h-full flex flex-col">
      <ContextHeader
        touchpoint={touchpoint}
        onTouchpointChange={setTouchpoint}
        flight={DEMO_FLIGHT}
        sourceLang="auto"
        targetLang="auto"
        onSwapLanguages={() => {}}
      />

      {/* Chat thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            <div className="text-center space-y-4 max-w-xs">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-aviation-light flex items-center justify-center"><span className="text-2xl">💬</span></div>
              <p className="text-text-primary font-semibold text-base">Conversation Mode</p>
              <p className="text-text-tertiary text-xs leading-relaxed">
                Type or speak in any language. The system auto-detects whether it's the employee (Turkish) or passenger (English) and translates accordingly.
              </p>
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <ChatBubble
              key={msg.id}
              speaker={msg.speaker}
              sourceText={msg.sourceText}
              result={msg.result}
              loading={msg.loading}
              onPlayTTS={() => {}}
            />
          ))
        )}
      </div>

      {/* Language direction indicator */}
      {messages.length > 0 && (
        <div className="px-6 py-1.5 flex items-center justify-center gap-2 text-[10px] text-text-tertiary">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-navy" />Employee = Turkish</span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-aviation" />Passenger = English</span>
          <span className="text-border">·</span>
          <span>Auto-detection active</span>
        </div>
      )}

      {/* Input area */}
      <div className="px-6 py-3 border-t border-border bg-surface">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center mb-3">
            <div className="flex bg-subtle rounded-lg p-0.5">
              <button onClick={() => setInputMode('voice')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${inputMode === 'voice' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}>
                <Mic size={15} />Voice
              </button>
              <button onClick={() => setInputMode('text')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${inputMode === 'text' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}>
                <Keyboard size={15} />Text
              </button>
            </div>
          </div>

          {inputMode === 'voice' ? (
            <div className="flex flex-col items-center py-4">
              <VoiceButton recording={recording} loading={globalLoading} disabled={globalLoading && !recording} onToggle={handleVoiceToggle} />
              <p className="mt-3 text-xs text-text-tertiary text-center">Speak in <span className="font-medium text-text-secondary">any language</span> — auto-detected</p>
            </div>
          ) : (
            <div className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type in Turkish or English..."
                disabled={globalLoading}
                rows={2}
                className="flex-1 px-4 py-2.5 text-sm rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-aviation/20 focus:border-aviation transition-all duration-150 resize-none disabled:opacity-50"
              />
              <Button onClick={handleSend} disabled={!text.trim() || globalLoading} loading={globalLoading} icon={<Send size={15} />} size="lg">
                Send
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
