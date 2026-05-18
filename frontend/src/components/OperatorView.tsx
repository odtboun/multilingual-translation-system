import { useState, useRef } from 'react';
import { Mic, Send, Volume2, Info, Loader2 } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

export default function OperatorView() {
  const [text, setText] = useState('');
  const [translation, setTranslation] = useState('');
  const [notes, setNotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  
  const [touchpoint, setTouchpoint] = useState('GENERAL');
  const [sourceLang, setSourceLang] = useState('tr');
  const [targetLang, setTargetLang] = useState('en');

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
      
      // Auto-play TTS if translating TO English
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
      <div className="glass-panel context-bar">
        <select value={touchpoint} onChange={e => setTouchpoint(e.target.value)}>
          <option value="GENERAL">General Aviation</option>
          <option value="CHECK_IN">Check-in Counter</option>
          <option value="SECURITY">Security Screening</option>
          <option value="BOARDING">Boarding Gate</option>
          <option value="PASSPORT">Passport Control</option>
          <option value="BAGGAGE">Baggage Claim</option>
          <option value="TRANSFER">Transfer Desk</option>
          <option value="DIRECTIONS">Directions</option>
        </select>
        
        <select value={sourceLang} onChange={e => setSourceLang(e.target.value)}>
          <option value="tr">Turkish</option>
          <option value="en">English</option>
        </select>
        <span>→</span>
        <select value={targetLang} onChange={e => setTargetLang(e.target.value)}>
          <option value="en">English</option>
          <option value="tr">Turkish</option>
        </select>
      </div>

      <div className="glass-panel translation-area">
        <div className="input-section">
          <textarea 
            placeholder="Type or speak passenger input here..." 
            value={text}
            onChange={e => setText(e.target.value)}
            disabled={loading || recording}
          />
          <div className="mic-button-wrapper">
            <button 
              className={`btn-icon ${recording ? 'active' : ''}`}
              onClick={toggleRecording}
              disabled={loading}
              title="Hold or click to speak"
            >
              {recording ? <Loader2 className="animate-spin" /> : <Mic />}
            </button>
          </div>
        </div>

        <div className="context-bar" style={{ justifyContent: 'flex-end', borderTop: '1px solid var(--panel-border)' }}>
            <button className="btn-primary" onClick={handleTranslate} disabled={loading || !text.trim()}>
                {loading ? <Loader2 className="animate-spin" /> : <Send size={18} />}
                Translate
            </button>
        </div>
      </div>

      {(translation || loading) && (
        <div className="glass-panel output-section">
          {loading && !translation ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)' }}>
                <Loader2 className="animate-spin" /> Processing...
            </div>
          ) : (
            <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="output-text">{translation}</div>
                    <button className="btn-icon" onClick={() => playTTS(translation)} title="Play Audio">
                        <Volume2 size={20} />
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
