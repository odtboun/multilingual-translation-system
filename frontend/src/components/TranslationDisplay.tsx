import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Copy } from 'lucide-react';
import { GuardDiff } from './GuardDiff';
import type { TranslationResult } from '../types';

interface TranslationDisplayProps {
  result: TranslationResult | null; loading: boolean;
  sourceText: string; onPlayTTS: (t: string) => void;
  streaming?: boolean; partialText?: string;
}

export function TranslationDisplay({ result, loading, sourceText, onPlayTTS, streaming, partialText }: TranslationDisplayProps) {
  if (!result && !loading && !sourceText) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[280px]">
        <div className="text-center space-y-4 max-w-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-aviation-light flex items-center justify-center"><span className="text-2xl">💬</span></div>
          <p className="text-text-primary font-semibold text-base">Ready to Translate</p>
          <p className="text-text-tertiary text-xs leading-relaxed">Speak into the microphone or type text to begin real-time aviation translation</p>
        </div>
      </div>
    );
  }

  if (loading && !streaming) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[280px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-full border-2 border-aviation border-t-transparent animate-spin" />
          <p className="text-text-secondary text-xs">Translating...</p>
        </div>
      </div>
    );
  }

  const displayText = streaming && partialText ? partialText : result?.translation || '';

  return (
    <div className="flex-1 flex flex-col min-h-[280px] overflow-y-auto">
      {sourceText && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="px-8 pt-5 pb-1">
          <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider mb-1">Source</p>
          <p className="text-text-secondary text-sm leading-relaxed">{sourceText}</p>
        </motion.div>
      )}
      <div className="flex-1 flex flex-col px-8 pb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">Translation</p>
          {result && !streaming && (
            <div className="flex items-center gap-1">
              <button onClick={() => onPlayTTS(result.translation)} className="p-1.5 rounded-md text-text-tertiary hover:text-aviation hover:bg-aviation-light transition-colors" title="Play"><Volume2 size={15} /></button>
              <button onClick={() => navigator.clipboard.writeText(result.translation)} className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-subtle transition-colors" title="Copy"><Copy size={15} /></button>
            </div>
          )}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={displayText || 'loading'} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex-1 flex items-center min-h-[60px]">
            {displayText ? (
              <p className={`text-2xl font-semibold text-text-primary leading-relaxed ${streaming ? "after:content-['|'] after:animate-pulse after:text-aviation after:ml-0.5" : ''}`}>{displayText}</p>
            ) : (
              <div className="flex gap-1">{[...Array(3)].map((_, i) => (<div key={i} className="w-2 h-2 rounded-full bg-aviation/30 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />))}</div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      {result && !streaming && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="px-8 pb-3 flex items-center gap-3 text-[11px] text-text-tertiary">
          <GuardDiff corrections={result.guard_corrections} />
          <span className="text-border">·</span>
          <span className="tabular-nums">{result.latency_ms}ms</span>
          <span className="text-border">·</span>
          <span>{result.model_used}</span>
          <span className="text-border">·</span>
          <span>{result.glossary_terms_injected} glossary terms</span>
          {(result.notes?.length ?? 0) > 0 && <><span className="text-border">·</span><span className="text-warning font-medium">{result.notes.length} note{result.notes.length > 1 ? 's' : ''}</span></>}
        </motion.div>
      )}
    </div>
  );
}
