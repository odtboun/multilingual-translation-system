import { Plane, Clock, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

export function TopBar() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 30000); return () => clearInterval(t); }, []);

  return (
    <header className="h-14 bg-navy text-white flex items-center justify-between px-6 flex-shrink-0 select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Plane size={18} className="text-white/80" />
          <span className="font-semibold text-xs tracking-widest">AVIATION TRANSLATION SYSTEM</span>
        </div>
        <div className="h-4 w-px bg-white/20" />
        <span className="text-xs text-white/60 font-medium">Operator Terminal</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-white/80 font-medium">System Online</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-white/60">
        <div className="flex items-center gap-1.5"><Wifi size={13} /><span>Connected</span></div>
        <div className="flex items-center gap-1.5">
          <Clock size={13} />
          <span className="tabular-nums">{time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </header>
  );
}
