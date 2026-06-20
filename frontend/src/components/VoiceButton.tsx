import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export type VoicePhase = 'idle' | 'recording' | 'transcribing' | 'translating';

interface VoiceButtonProps {
  phase: VoicePhase;
  onToggle: () => void;
}

const PHASE_LABELS: Record<VoicePhase, string> = {
  idle: 'Tap to speak',
  recording: 'Tap to stop',
  transcribing: 'Transcribing...',
  translating: 'Translating...',
};

const PHASE_COLORS: Record<VoicePhase, string> = {
  idle: 'bg-aviation text-white shadow-lg shadow-aviation/20 hover:shadow-aviation/30 hover:scale-105',
  recording: 'bg-danger text-white shadow-lg shadow-danger/30 scale-110',
  transcribing: 'bg-subtle text-text-tertiary cursor-wait',
  translating: 'bg-aviation text-white shadow-lg shadow-aviation/20',
};

export function VoiceButton({ phase, onToggle }: VoiceButtonProps) {
  const isRecording = phase === 'recording';
  const isProcessing = phase === 'transcribing' || phase === 'translating';
  const disabled = isProcessing;

  return (
    <div className="relative flex flex-col items-center">
      {/* Pulse rings when recording */}
      {isRecording && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full bg-danger/20"
            animate={{ scale: [1, 1.8, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full bg-danger/10"
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />
        </>
      )}

      {/* Audio waveform ring when transcribing */}
      {phase === 'transcribing' && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-aviation/20"
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.2, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <button
        onClick={onToggle}
        disabled={disabled}
        className={`
          relative w-[72px] h-[72px] rounded-full flex items-center justify-center
          transition-all duration-300 ease-out active:scale-95
          ${PHASE_COLORS[phase]}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isProcessing ? (
          <Loader2 size={28} className="animate-spin" />
        ) : isRecording ? (
          <MicOff size={28} />
        ) : (
          <Mic size={28} />
        )}
      </button>

      <p className="text-center mt-2 text-xs font-medium text-text-tertiary">
        {PHASE_LABELS[phase]}
      </p>
    </div>
  );
}
