import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, ChevronUp } from 'lucide-react';
import type { GuardCorrection } from '../types';

interface GuardDiffProps { corrections: GuardCorrection[]; }

export function GuardDiff({ corrections = [] }: GuardDiffProps) {
  const [expanded, setExpanded] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Auto-collapse after 3 seconds
  useEffect(() => {
    if (corrections.length === 0) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    timerRef.current = setTimeout(() => setExpanded(false), 3000);
    return () => clearTimeout(timerRef.current);
  }, [corrections]);

  const hasCorrections = corrections.length > 0;

  return (
    <div className="inline-flex">
      {expanded && hasCorrections ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="rounded-lg border border-success/20 bg-success-bg/50 p-2.5 space-y-1.5 max-w-xs cursor-pointer"
          onClick={() => setExpanded(false)}
          onMouseEnter={() => { clearTimeout(timerRef.current); }}
          onMouseLeave={() => { timerRef.current = setTimeout(() => setExpanded(false), 1500); }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-success" />
              <span className="text-[10px] font-semibold text-success uppercase tracking-wider">{corrections.length} correction{corrections.length > 1 ? 's' : ''}</span>
            </div>
            <ChevronUp size={12} className="text-success/60" />
          </div>
          {corrections.map((c, i) => (
            <div key={c.original + i} className="flex items-center gap-1.5 text-xs">
              <span className="text-danger line-through font-medium px-1 rounded animate-guard-highlight">{c.original}</span>
              <ArrowRight size={10} className="text-success shrink-0" />
              <span className="text-success font-semibold">{c.corrected}</span>
            </div>
          ))}
        </motion.div>
      ) : (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => hasCorrections && setExpanded(true)}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors ${hasCorrections ? 'bg-success-bg text-success hover:bg-success/10 cursor-pointer' : 'text-text-tertiary cursor-default'}`}
          title={hasCorrections ? `${corrections.length} terminology correction${corrections.length > 1 ? 's' : ''} — click to expand` : 'Terminology guard passed'}
        >
          <ShieldCheck size={10} />
          {hasCorrections ? (
            <span className="tabular-nums">{corrections.length}</span>
          ) : (
            <span>Clean</span>
          )}
        </motion.button>
      )}
    </div>
  );
}
