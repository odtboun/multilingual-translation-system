type View = 'dual' | 'chat' | 'operator' | 'dashboard' | 'demo';

const TABS: { key: View; label: string }[] = [
  { key: 'dual', label: 'Dual Panel' },
  { key: 'chat', label: 'Chat' },
  { key: 'operator', label: 'One-Way' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'demo', label: 'Demo' },
];

interface TopBarProps {
  view: View;
  onViewChange: (v: View) => void;
  count?: number;
  latency?: number;
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
      {count > 0 && (
        <div className="flex items-center gap-3 text-[10px] text-text-tertiary">
          <span className="tabular-nums">{count} translations</span>
          <span className="text-border">·</span>
          <span className="tabular-nums">{latency}ms avg</span>
        </div>
      )}
    </header>
  );
}
