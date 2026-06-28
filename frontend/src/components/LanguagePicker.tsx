import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Check } from 'lucide-react';

export interface LanguageOption {
  code: string;
  name: string;    // native name, e.g. "Türkçe"
  bcp47: string;   // Web Speech API code, e.g. "tr-TR"
}

// All languages our system supports, in their native names
export const ALL_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', bcp47: 'en-US' },
  { code: 'tr', name: 'Türkçe', bcp47: 'tr-TR' },
  { code: 'de', name: 'Deutsch', bcp47: 'de-DE' },
  { code: 'fr', name: 'Français', bcp47: 'fr-FR' },
  { code: 'es', name: 'Español', bcp47: 'es-ES' },
  { code: 'it', name: 'Italiano', bcp47: 'it-IT' },
  { code: 'pt', name: 'Português', bcp47: 'pt-PT' },
  { code: 'nl', name: 'Nederlands', bcp47: 'nl-NL' },
  { code: 'ru', name: 'Русский', bcp47: 'ru-RU' },
  { code: 'ar', name: 'العربية', bcp47: 'ar-SA' },
  { code: 'fa', name: 'فارسی', bcp47: 'fa-IR' },
  { code: 'zh', name: '中文', bcp47: 'zh-CN' },
  { code: 'ja', name: '日本語', bcp47: 'ja-JP' },
  { code: 'ko', name: '한국어', bcp47: 'ko-KR' },
  { code: 'hi', name: 'हिन्दी', bcp47: 'hi-IN' },
];

interface LanguagePickerProps {
  selected: LanguageOption;
  onSelect: (lang: LanguageOption) => void;
  open: boolean;
  onClose: () => void;
}

export function LanguagePicker({ selected, onSelect, open, onClose }: LanguagePickerProps) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const filtered = search
    ? ALL_LANGUAGES.filter(l =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.code.toLowerCase().includes(search.toLowerCase())
      )
    : ALL_LANGUAGES;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 w-64 bg-surface rounded-xl border border-border shadow-modal overflow-hidden"
          >
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
              <Search size={13} className="text-text-tertiary shrink-0" />
              <input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search language..."
                className="flex-1 text-xs bg-transparent outline-none text-text-primary placeholder:text-text-tertiary"
              />
            </div>
            {/* Grid */}
            <div className="p-2 grid grid-cols-2 gap-1 max-h-56 overflow-y-auto">
              {filtered.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => { onSelect(lang); onClose(); }}
                  className={`
                    flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left
                    transition-colors duration-100
                    ${lang.code === selected.code
                      ? 'bg-aviation-light text-aviation font-semibold'
                      : 'text-text-primary hover:bg-subtle'
                    }
                  `}
                >
                  <span>{lang.name}</span>
                  {lang.code === selected.code && <Check size={13} />}
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
