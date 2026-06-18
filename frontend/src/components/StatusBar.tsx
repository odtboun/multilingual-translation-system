interface StatusBarProps { count?: number; latency?: number; guardRate?: string; model?: string; }
export function StatusBar({ count = 0, latency = 0, guardRate = '0%', model = 'Gemini Flash' }: StatusBarProps) {
  return (
    <footer className="h-8 bg-navy text-white/50 flex items-center justify-between px-6 text-[11px] flex-shrink-0 select-none">
      <div className="flex items-center gap-3">
        <span>{count.toLocaleString()} translations today</span><span className="text-white/20">·</span>
        <span>{latency}ms avg</span><span className="text-white/20">·</span>
        <span>{guardRate} compliance</span>
      </div>
      <div className="flex items-center gap-3">
        <span>{model}</span><span className="text-white/20">·</span><span>v0.1.0</span>
      </div>
    </footer>
  );
}
