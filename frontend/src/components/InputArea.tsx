import { useState } from 'react';
import { Send, Keyboard, Mic } from 'lucide-react';
import { VoiceButton } from './VoiceButton';
import { Button } from './ui/Button';

interface InputAreaProps {
  onTranslate: (text: string) => void; onVoiceToggle: () => void;
  recording: boolean; loading: boolean; sourceLangName: string;
}

export function InputArea({ onTranslate, onVoiceToggle, recording, loading, sourceLangName }: InputAreaProps) {
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [text, setText] = useState('');

  const handleSubmit = () => { if (text.trim()) { onTranslate(text.trim()); setText(''); } };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } };

  return (
    <div className="px-6 py-4 border-t border-border bg-surface">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-4">
          <div className="flex bg-subtle rounded-lg p-0.5">
            <button onClick={() => setMode('voice')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${mode === 'voice' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}>
              <Mic size={15} />Voice
            </button>
            <button onClick={() => setMode('text')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${mode === 'text' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}>
              <Keyboard size={15} />Text
            </button>
          </div>
        </div>
        {mode === 'voice' ? (
          <div className="flex flex-col items-center py-4">
            <VoiceButton recording={recording} loading={loading} disabled={loading && !recording} onToggle={onVoiceToggle} />
            <p className="mt-3 text-xs text-text-tertiary text-center">Speak in <span className="font-medium text-text-secondary">{sourceLangName}</span></p>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={`Type in ${sourceLangName}...`} disabled={loading} rows={3}
              className="w-full px-4 py-3 text-sm rounded-lg bg-surface border border-border text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-aviation/20 focus:border-aviation transition-all duration-150 resize-none disabled:opacity-50" />
            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={!text.trim() || loading} loading={loading} icon={<Send size={15} />} size="lg">Translate</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
