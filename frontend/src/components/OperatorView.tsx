import { useState, useRef } from 'react';
import { Mic, Send, Volume2, Info, Loader2, ArrowLeftRight, Keyboard, Mic as MicIcon } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

export default function OperatorView() {
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [text, setText] = useState('');
  const [translation, setTranslation] = useState('');
  const [notes, setNotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  
  const [touchpoint, setTouchpoint] = useState('GENERAL');
  
  // Language Direction Toggle State
  // true = TR -> EN, false = EN -> TR
  const [isTrToEn, setIsTrToEn] = useState(true);

  const sourceLang = isTrToEn ? 'tr' : 'en';
  const targetLang = isTrToEn ? 'en' : 'tr';

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setTranslation('');
    setNotes([]);

    try {
      const res = await fetch(`${API_BASE}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          source_lang: sourceLang,
          target_lang: targetLang,
          context: { touchpoint }
        })
      });
      const data = await res.json();
      setTranslation(data.translation);
      if (data.notes) setNotes(data.notes);
      
      if (targetLang === 'en' && data.translation) {
        playTTS(data.translation);
      }
    } catch (e) {
      console.error(e);
      setTranslation("Translation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const playTTS = async (textToSpeak: string) => {
    try {
      const res = await fetch(`${API_BASE}/voice/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak, target_lang: targetLang })
      });
      const data = await res.json();
      if (data.audio_url) {
        const audio = new Audio(data.audio_url);
        audio.play();
      }
    } catch (e) {
      console.error("TTS failed", e);
    }
  };

  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
    } else {
      try {
        setTranslation('');
        setNotes([]);
        setText('');
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          await processVoice(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setRecording(true);
      } catch (e) {
        console.error("Microphone access denied", e);
        alert("Microphone access denied.");
      }
    }
  };

  const processVoice = async (audioBlob: Blob) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    
    try {
      // 1. STT
      const sttRes = await fetch(`${API_BASE}/voice/stt`, {
        method: 'POST',
        body: formData
      });
      const sttData = await sttRes.json();
      const transcribedText = sttData.text || '';
      setText(transcribedText);

      // 2. Translate if we got text
      if (transcribedText) {
        const transRes = await fetch(`${API_BASE}/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: transcribedText,
              source_lang: sourceLang,
              target_lang: targetLang,
              context: { touchpoint }
            })
        });
        const transData = await transRes.json();
        setTranslation(transData.translation);
        if (transData.notes) setNotes(transData.notes);
        
        if (targetLang === 'en' && transData.translation) {
           playTTS(transData.translation);
        }
      }
    } catch (e) {
      console.error("Voice processing failed", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="operator-view">
      
      {/* Top Control Bar */}
      <div className="panel context-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Location:</span>
            <select 
                value={touchpoint} 
                onChange={e => setTouchpoint(e.target.value)}
                style={{ border: 'none', background: 'var(--bg-color)', fontWeight: 600, color: 'var(--accent-color)' }}
            >
                <option value="GENERAL">General Aviation</option>
                <option value="CHECK_IN">Check-in Counter</option>
                <option value="SECURITY">Security Screening</option>
                <option value="BOARDING">Boarding Gate</option>
                <option value="PASSPORT">Passport Control</option>
                <option value="BAGGAGE">Baggage Claim</option>
                <option value="TRANSFER">Transfer Desk</option>
                <option value="DIRECTIONS">Directions</option>
            </select>
        </div>

        <div className="lang-toggle-container">
            <span className={`lang-label ${isTrToEn ? '' : 'secondary'}`}>Turkish</span>
            <button 
                className="btn-icon" 
                onClick={() => setIsTrToEn(!isTrToEn)}
                title="Swap Direction"
            >
                <ArrowLeftRight size={18} />
            </button>
            <span className={`lang-label ${!isTrToEn ? '' : 'secondary'}`}>English</span>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="panel workspace-area">
        
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="segmented-control">
                <button 
                    className={mode === 'voice' ? 'active' : ''} 
                    onClick={() => setMode('voice')}
                >
                    <MicIcon size={16} /> Voice Mode
                </button>
                <button 
                    className={mode === 'text' ? 'active' : ''} 
                    onClick={() => setMode('text')}
                >
                    <Keyboard size={16} /> Text Mode
                </button>
            </div>
        </div>

        {mode === 'voice' ? (
            <div className="voice-mode-container">
                <button 
                    className={`btn-mic-large ${recording ? 'recording' : ''}`}
                    onClick={toggleRecording}
                    disabled={loading && !recording}
                    title="Click to start/stop recording"
                >
                    {loading && !recording ? <Loader2 size={40} className="animate-spin" /> : <Mic size={48} />}
                </button>
                
                <div className="transcription-preview">
                    {recording ? "Listening..." : text ? `"${text}"` : "Tap microphone to speak"}
                </div>
            </div>
        ) : (
            <div className="text-mode-container">
                <textarea 
                    placeholder={`Type ${isTrToEn ? 'Turkish' : 'English'} input here...`}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    disabled={loading || recording}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn-primary" onClick={handleTranslate} disabled={loading || !text.trim()}>
                        {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                        Translate
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Output Section */}
      {(translation || (loading && text && mode === 'text')) && (
        <div className="panel output-section">
          {loading && !translation ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--accent-color)' }}>
                <Loader2 className="animate-spin" /> Processing translation...
            </div>
          ) : (
            <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="output-text">{translation}</div>
                    <button className="btn-icon" onClick={() => playTTS(translation)} title="Play Audio">
                        <Volume2 size={24} className="text-accent" />
                    </button>
                </div>
                
                {notes.length > 0 && (
                    <div className="notes-panel">
                        <div className="notes-header"><Info size={16} /> Operational Notes</div>
                        <ul className="notes-list">
                            {notes.map((n, i) => <li key={i}>{n}</li>)}
                        </ul>
                    </div>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
