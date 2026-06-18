import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface VoiceButtonProps { recording: boolean; loading: boolean; disabled: boolean; onToggle: () => void; }
export function VoiceButton({ recording, loading, disabled, onToggle }: VoiceButtonProps) {
  return (
    <div className="relative flex flex-col items-center">
      {recording && (
        <>
          <motion.div className="absolute inset-0 rounded-full bg-danger/20" animate={{ scale: [1, 1.8, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.div className="absolute inset-0 rounded-full bg-danger/10" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />
        </>
      )}
      <button onClick={onToggle} disabled={disabled}
        className={`relative w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all duration-300 ease-out
          ${recording ? 'bg-danger text-white shadow-lg shadow-danger/30 scale-110' :
            loading ? 'bg-subtle text-text-tertiary cursor-wait' :
            'bg-aviation text-white shadow-lg shadow-aviation/20 hover:shadow-aviation/30 hover:scale-105 active:scale-95'}
          disabled:opacity-50 disabled:cursor-not-allowed`}>
        {loading ? <Loader2 size={28} className="animate-spin" /> : recording ? <MicOff size={28} /> : <Mic size={28} />}
      </button>
      <p className="text-center mt-2 text-xs font-medium text-text-tertiary">{recording ? 'Tap to stop' : loading ? 'Processing...' : 'Tap to speak'}</p>
    </div>
  );
}
