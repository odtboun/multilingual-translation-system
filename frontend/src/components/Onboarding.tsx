import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, X, Mic, Globe, MessageSquare, MapPin, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    icon: <Sparkles size={20} className="text-aviation" />,
    title: 'AI Aviation Translation',
    description: 'Real-time multilingual communication for airport ground operations. Translate between 32 languages with aviation-specific terminology enforcement.',
  },
  {
    icon: <MessageSquare size={20} className="text-aviation" />,
    title: 'Dual Panel View',
    description: 'Two speakers, two languages. Each panel shows the entire conversation in one language. Blue messages are Speaker A, orange messages are Speaker B. Everyone follows their own side.',
  },
  {
    icon: <Mic size={20} className="text-aviation" />,
    title: 'Voice or Text',
    description: 'Two mic buttons, each with its own language selector. Tap to start speaking in that language — transcription is instant. Prefer typing? Switch to text mode anytime.',
  },
  {
    icon: <MapPin size={20} className="text-aviation" />,
    title: 'Context-Aware',
    description: "Select the airport touchpoint — boarding gate, check-in, security — and the translation adapts. The same word translates differently depending on where you are.",
  },
  {
    icon: <Globe size={20} className="text-aviation" />,
    title: 'See It In Action',
    description: "Follow the guided demo to see context-aware translation, terminology enforcement, and multi-language support. Or skip straight to the dual panel.",
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const s = STEPS[step];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25 }}
          className="bg-surface rounded-2xl shadow-modal border border-border max-w-md w-full mx-4 overflow-hidden"
        >
          {/* Skip */}
          <div className="flex justify-end px-4 pt-4">
            <button
              onClick={onComplete}
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors flex items-center gap-1"
            >
              Skip <X size={12} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pt-4 pb-2 text-center">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-12 h-12 mx-auto rounded-xl bg-aviation-light flex items-center justify-center mb-4"
            >
              {s.icon}
            </motion.div>
            <h2 className="text-lg font-bold text-text-primary mb-2">{s.title}</h2>
            <p className="text-sm text-text-secondary leading-relaxed">{s.description}</p>
          </div>

          {/* Progress dots + nav */}
          <div className="px-6 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
              icon={<ArrowLeft size={14} />}
            >
              Back
            </Button>

            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? 'bg-aviation w-5' : 'bg-border w-1.5'
                  }`}
                />
              ))}
            </div>

            <Button
              size="sm"
              onClick={isLast ? onComplete : () => setStep(step + 1)}
              icon={isLast ? undefined : <ArrowRight size={14} />}
            >
              {isLast ? 'Got it' : 'Next'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
