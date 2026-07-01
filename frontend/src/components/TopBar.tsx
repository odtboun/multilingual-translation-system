import { useState, useEffect } from 'react';
import { Snowflake, HelpCircle, CheckCircle2 } from 'lucide-react';

type View = 'dual' | 'chat' | 'operator' | 'dashboard' | 'demo';

const TABS: { key: View; label: string }[] = [
  { key: 'dual', label: 'Dual Panel' },
  // { key: 'chat', label: 'Chat' },
  // { key: 'operator', label: 'One-Way' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'demo', label: 'Demo' },
];

interface TopBarProps {
  view: View;
  onViewChange: (v: View) => void;
  count?: number;
  latency?: number;
}

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function ServerStatus() {
  const [status, setStatus] = useState<'starting' | 'ready'>('starting');

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE}/debug/health`);
        if (res.ok && mounted) setStatus('ready');
      } catch (e) {
        // ignore
      }
    };
    check();
    const interval = setInterval(() => {
      if (status === 'starting') check();
    }, 4000);
    return () => { mounted = false; clearInterval(interval); };
  }, [status]);

  if (status === 'starting') {
    return (
      <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary">
        <Snowflake size={12} className="animate-spin text-text-tertiary" />
        <span>System starting</span>
        <div className="relative group cursor-help flex items-center">
          <HelpCircle size={11} className="text-text-tertiary" />
          <div className="absolute top-full right-0 mt-1.5 w-52 p-2.5 bg-surface border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-[10px] leading-relaxed text-text-secondary text-left">
            Since this is a limited capacity preview of the product, there might be a delay on your first request until the backend service is back up.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-success">
      <CheckCircle2 size={12} />
      <span>System ready</span>
    </div>
  );
}

export function TopBar({ view, onViewChange, count = 0, latency = 0 }: TopBarProps) {
  return (
    <header className="h-10 bg-surface border-b border-border flex items-center justify-between px-5 flex-shrink-0 select-none">
      {/* Left: brand + tabs */}
      <div className="flex items-center gap-5">
        <span className="text-xs font-bold text-text-primary tracking-tight">ATS</span>
        <nav className="flex items-center gap-0.5">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => onViewChange(t.key)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors duration-150 ${
                view === t.key
                  ? 'bg-subtle text-text-primary'
                  : 'text-text-tertiary hover:text-text-secondary hover:bg-subtle/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Right: subtle metrics */}
      <div className="flex items-center gap-4">
        {count > 0 && (
          <div className="flex items-center gap-3 text-[10px] text-text-tertiary">
            <span className="tabular-nums">{count} translations</span>
            <span className="text-border">·</span>
            <span className="tabular-nums">{latency}ms avg</span>
          </div>
        )}
        <div className={count > 0 ? "pl-4 border-l border-border" : ""}>
          <ServerStatus />
        </div>
      </div>
    </header>
  );
}
