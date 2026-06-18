import { motion } from 'framer-motion';
import { Plane, User, Volume2, Copy } from 'lucide-react';
import { GuardDiff } from './GuardDiff';
import type { TranslationResult } from '../types';

export type Speaker = 'employee' | 'passenger';

interface ChatBubbleProps {
  speaker: Speaker;
  sourceText: string;
  result: TranslationResult | null;
  loading: boolean;
  onPlayTTS: (text: string) => void;
}

export function ChatBubble({ speaker, sourceText, result, loading, onPlayTTS }: ChatBubbleProps) {
  const isEmployee = speaker === 'employee';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, x: isEmployee ? -8 : 8 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col max-w-[80%] ${isEmployee ? 'self-start mr-auto' : 'self-end ml-auto'}`}
    >
      {/* Speaker label — ultra minimal */}
      <div className={`flex items-center gap-1 mb-0.5 ${isEmployee ? '' : 'justify-end'}`}>
        {isEmployee ? <Plane size={10} className="text-navy/40" /> : <User size={10} className="text-aviation/40" />}
        <span className="text-[9px] font-medium text-text-tertiary uppercase tracking-widest">{isEmployee ? 'Employee' : 'Passenger'}</span>
      </div>

      {/* BUBBLE: Translation first (hero), source second (footnote) */}
      <div className={`
        relative rounded-2xl overflow-hidden border
        ${isEmployee
          ? 'rounded-bl-md bg-surface border-border border-l-[3px] border-l-navy/15'
          : 'rounded-br-md bg-surface border-aviation/20'
        }
      `}>

        {/* Translation — the hero */}
        <div className={`px-4 pt-3 ${isEmployee ? 'pl-5' : ''}`}>
          {loading ? (
            <div className="flex items-center gap-1.5 py-1">
              <div className="w-3 h-3 rounded-full border border-text-tertiary/30 border-t-text-tertiary animate-spin" />
              <span className="text-xs text-text-tertiary">Translating...</span>
            </div>
          ) : result ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <p className="text-base font-semibold text-text-primary leading-relaxed">
                {result.translation}
              </p>
              {/* Action bar: TTS, copy, guard */}
              <div className="flex items-center justify-between mt-2 mb-1">
                <div className="flex items-center gap-0.5">
                  <button onClick={() => onPlayTTS(result.translation)} className="p-1 rounded text-text-tertiary hover:text-aviation hover:bg-aviation-light/50 transition-colors" title="Play audio">
                    <Volume2 size={12} />
                  </button>
                  <button onClick={() => navigator.clipboard.writeText(result.translation)} className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-border/50 transition-colors" title="Copy">
                    <Copy size={12} />
                  </button>
                </div>
                <GuardDiff corrections={result.guard_corrections} />
              </div>
            </motion.div>
          ) : (
            <p className="text-xs text-text-tertiary italic py-1">Translation unavailable</p>
          )}
        </div>

        {/* Source text — footnote, smallest visual weight */}
        <div className={`px-4 pb-2 pt-0.5 border-t border-border/50 ${isEmployee ? 'pl-5' : ''}`}>
          <p className="text-[11px] text-text-tertiary leading-relaxed italic line-clamp-2" title={sourceText}>
            "{sourceText}"
          </p>
        </div>
      </div>

      {/* Latency — barely visible */}
      {result && (
        <p className={`text-[9px] text-text-tertiary/60 mt-0.5 tabular-nums ${isEmployee ? 'pl-1' : 'pr-1 text-right'}`}>
          {result.latency_ms}ms · {result.source_lang === 'tr' ? 'TR→EN' : 'EN→TR'}
        </p>
      )}
    </motion.div>
  );
}
