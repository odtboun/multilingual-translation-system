import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import type { GuardCorrection } from '../types';

interface GuardDiffProps { corrections: GuardCorrection[]; }
export function GuardDiff({ corrections }: GuardDiffProps) {
  if (corrections.length === 0) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-success/20 bg-success-bg/50 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <ShieldCheck size={13} className="text-success" />
        <span className="text-[11px] font-semibold text-success uppercase tracking-wider">{corrections.length} terminology correction{corrections.length > 1 ? 's' : ''}</span>
      </div>
      {corrections.map((c, i) => (
        <motion.div key={c.original + i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 * i }} className="flex items-center gap-2 text-sm">
          <span className="text-danger line-through font-medium animate-guard-highlight px-1 rounded">{c.original}</span>
          <ArrowRight size={11} className="text-success shrink-0" />
          <span className="text-success font-semibold px-1 rounded bg-success/5">{c.corrected}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}
