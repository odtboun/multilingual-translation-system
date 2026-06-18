import { Plane, ChevronDown, ArrowRightLeft } from 'lucide-react';
import { Badge } from './ui/Badge';
import { TOUCHPOINTS, LANGUAGE_NAMES, type Touchpoint, type FlightContext } from '../types';

interface ContextHeaderProps {
  touchpoint: Touchpoint;
  onTouchpointChange: (t: Touchpoint) => void;
  flight?: FlightContext;
  sourceLang: string;
  targetLang: string;
  onSwapLanguages: () => void;
}

export function ContextHeader({ touchpoint, onTouchpointChange, flight, sourceLang, targetLang, onSwapLanguages }: ContextHeaderProps) {
  const current = TOUCHPOINTS.find(t => t.value === touchpoint) || TOUCHPOINTS[10];
  const isEmergency = touchpoint === 'EMERGENCY';

  return (
    <div className={`px-6 py-3 border-b border-border ${isEmergency ? 'bg-danger-bg border-danger/20' : 'bg-surface'} transition-colors duration-300`}>
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <button className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${isEmergency ? 'bg-danger/10 text-danger hover:bg-danger/20' : 'bg-subtle text-text-primary hover:bg-border'}`}>
              <span className="text-base">{current.icon}</span>
              <span>{current.label}</span>
              <ChevronDown size={13} className="text-text-tertiary" />
            </button>
            <div className="absolute top-full left-0 mt-1 w-52 bg-surface rounded-lg border border-border shadow-dropdown opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 py-1">
              {TOUCHPOINTS.map(tp => (
                <button key={tp.value} onClick={() => onTouchpointChange(tp.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-subtle transition-colors ${tp.value === touchpoint ? 'bg-aviation-light text-aviation font-medium' : 'text-text-primary'} ${tp.value === 'EMERGENCY' ? 'text-danger hover:bg-danger-bg' : ''}`}>
                  <span className="text-base">{tp.icon}</span><span>{tp.label}</span>
                </button>
              ))}
            </div>
          </div>
          {flight && (
            <div className="flex items-center gap-3 pl-3 border-l border-border">
              <div className="flex items-center gap-1.5 text-sm">
                <Plane size={13} className="text-aviation" />
                <span className="font-semibold text-text-primary tabular-nums">{flight.flight}</span>
              </div>
              {flight.gate && <><span className="text-border text-xs">·</span><span className="text-sm text-text-secondary">Gate <span className="font-semibold text-text-primary">{flight.gate}</span></span></>}
              {flight.destination && <><span className="text-border text-xs">·</span><span className="text-sm text-text-secondary">to <span className="font-medium text-text-primary">{flight.destination}</span></span></>}
              {flight.status && <Badge variant={flight.status === 'DELAYED' ? 'warning' : flight.status === 'EMERGENCY' ? 'danger' : 'success'} size="sm">{flight.status}</Badge>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${sourceLang === 'tr' ? 'text-text-primary' : 'text-text-secondary'}`}>{LANGUAGE_NAMES[sourceLang]}</span>
          <button onClick={onSwapLanguages} className="p-1.5 rounded-md hover:bg-subtle transition-colors" title="Swap"><ArrowRightLeft size={16} className="text-text-tertiary" /></button>
          <span className="text-sm font-semibold text-text-primary">{LANGUAGE_NAMES[targetLang]}</span>
        </div>
      </div>
    </div>
  );
}
