import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, ChevronDown } from 'lucide-react';
import { LanguagePicker, ALL_LANGUAGES, type LanguageOption } from './LanguagePicker';

interface DualMicInputProps {
  onVoiceText: (text: string) => void;
  disabled: boolean;
}

export function DualMicInput({ onVoiceText, disabled }: DualMicInputProps) {
  const [leftLang, setLeftLang] = useState<LanguageOption>(ALL_LANGUAGES[1]); // Türkçe
  const [rightLang, setRightLang] = useState<LanguageOption>(ALL_LANGUAGES[0]); // English
  const [pickerFor, setPickerFor] = useState<'left' | 'right' | null>(null);
  const [recording, setRecording] = useState<'left' | 'right' | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startRecording = (side: 'left' | 'right') => {
    const lang = side === 'left' ? leftLang : rightLang;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = lang.bcp47;

    let interim = '';

    r.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interim += result[0].transcript;
      }
      if (finalText.trim()) {
        r.stop();
        onVoiceText(finalText.trim());
      }
    };

    r.onerror = () => { setRecording(null); };
    r.onend = () => { setRecording(null); };

    recognitionRef.current = r;
    r.start();
    setRecording(side);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(null);
  };

  const handleMicTap = (side: 'left' | 'right') => {
    if (disabled) return;
    if (recording === side) {
      stopRecording();
    } else if (recording) {
      // Other side is recording — stop it, then start this one
      stopRecording();
      setTimeout(() => startRecording(side), 150);
    } else {
      startRecording(side);
    }
  };

  const isRecording = (side: 'left' | 'right') => recording === side;
  const otherRecording = recording !== null;

  const MicButton = ({ side, lang }: { side: 'left' | 'right'; lang: LanguageOption }) => {
    const active = isRecording(side);
    const blocked = otherRecording && !active;

    return (
      <div className="flex flex-col items-center gap-2">
        {/* Mic button */}
        <div className="relative">
          {active && (
            <>
              <motion.div className="absolute inset-0 rounded-full bg-danger/20" animate={{ scale: [1, 1.6, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
              <motion.div className="absolute inset-0 rounded-full bg-danger/10" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }} />
            </>
          )}
          <button
            onClick={() => handleMicTap(side)}
            disabled={blocked || disabled}
            className={`
              relative w-16 h-16 rounded-full flex items-center justify-center
              transition-all duration-300 ease-out active:scale-95
              ${active
                ? 'bg-danger text-white shadow-lg shadow-danger/30 scale-110'
                : 'bg-aviation text-white shadow-md shadow-aviation/20 hover:shadow-aviation/30 hover:scale-105'
              }
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
            `}
          >
            {active ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
        </div>

        {/* Language label + selector */}
        <div className="relative">
          <button
            onClick={() => setPickerFor(pickerFor === side ? null : side)}
            disabled={active}
            className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
          >
            {lang.name}
            <ChevronDown size={10} className="text-text-tertiary" />
          </button>
          <LanguagePicker
            selected={lang}
            onSelect={side === 'left' ? setLeftLang : setRightLang}
            open={pickerFor === side}
            onClose={() => setPickerFor(null)}
          />
        </div>

        {/* Label */}
        <p className="text-[11px] text-text-tertiary">
          {active ? 'Listening...' : 'Tap to speak'}
        </p>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center gap-10 py-4">
      <MicButton side="left" lang={leftLang} />
      <div className="w-px h-12 bg-border self-center" />
      <MicButton side="right" lang={rightLang} />
    </div>
  );
}
