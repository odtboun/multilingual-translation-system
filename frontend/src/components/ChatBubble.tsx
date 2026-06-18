import { motion } from 'framer-motion';
import { User, Plane, Volume2, Copy } from 'lucide-react';
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

const SPEAKER_CONFIG: Record<Speaker, { label: string; icon: React.ReactNode; align: string; bubbleBg: string; bubbleBorder: string; accentColor: string }> = {
  employee: {
    label: 'Employee',
    icon: <Plane size={12} />,
    align: 'items-start',
    bubbleBg: 'bg-navy text-white',
    bubbleBorder: 'border-navy/10',
    accentColor: 'text-navy-light',
  },
  passenger: {
    label: 'Passenger',
    icon: <User size={12} />,
    align: 'items-end',
    bubbleBg: 'bg-surface text-text-primary border border-border',
    bubbleBorder: 'border-border',
    accentColor: 'text-aviation',
  },
};

export function ChatBubble({ speaker, sourceText, result, loading, onPlayTTS }: ChatBubbleProps) {
  const config = SPEAKER_CONFIG[speaker];
  const isEmployee = speaker === 'employee';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, x: isEmployee ? -8 : 8 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col ${config.align} max-w-[85%] ${isEmployee ? 'self-start mr-auto' : 'self-end ml-auto'}`}
    >
      {/* Speaker label */}
      <div className={`flex items-center gap-1.5 mb-1 px-1 ${isEmployee ? '' : 'justify-end'}`}>
        <span className={config.accentColor}>{config.icon}</span>
        <span className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">{config.label}</span>
      </div>

      {/* Source text */}
      <div className={`px-4 py-2.5 rounded-2xl ${isEmployee ? 'rounded-bl-md' : 'rounded-br-md'} ${config.bubbleBg} ${config.bubbleBorder}`}>
        <p className={`text-sm font-medium leading-relaxed ${isEmployee ? 'text-white' : 'text-text-primary'}`}>
          {sourceText}
        </p>
      </div>

      {/* Translation */}
      {loading ? (
        <div className={`mt-1.5 px-3 py-2 rounded-xl bg-subtle ${isEmployee ? 'self-start' : 'self-end'} flex items-center gap-1.5`}>
          <div className="w-3 h-3 rounded-full border border-text-tertiary/30 border-t-text-tertiary animate-spin" />
          <span className="text-[11px] text-text-tertiary">Translating...</span>
        </div>
      ) : result ? (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`mt-1.5 ${isEmployee ? 'self-start' : 'self-end'} max-w-full`}
        >
          <div className={`px-3 py-2 rounded-xl bg-subtle flex items-start gap-2 group`}>
            <p className={`text-sm leading-relaxed flex-1 ${isEmployee ? 'text-text-primary' : 'text-text-primary'}`}>
              {result.translation}
            </p>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={() => onPlayTTS(result.translation)} className="p-1 rounded text-text-tertiary hover:text-aviation hover:bg-aviation-light/50 transition-colors" title="Play">
                <Volume2 size={13} />
              </button>
              <button onClick={() => navigator.clipboard.writeText(result.translation)} className="p-1 rounded text-text-tertiary hover:text-text-primary hover:bg-border/50 transition-colors" title="Copy">
                <Copy size={13} />
              </button>
            </div>
          </div>
          {/* Guard corrections inline */}
          {result.guard_corrections.length > 0 && (
            <div className="mt-1"><GuardDiff corrections={result.guard_corrections} /></div>
          )}
          {/* Latency */}
          <p className="text-[10px] text-text-tertiary mt-0.5 px-1 tabular-nums">{result.latency_ms}ms</p>
        </motion.div>
      ) : null}
    </motion.div>
  );
}
