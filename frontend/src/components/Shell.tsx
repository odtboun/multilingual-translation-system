import { type ReactNode } from 'react';
import { TopBar } from './TopBar';

type View = 'dual' | 'chat' | 'operator' | 'dashboard' | 'demo';

interface ShellProps {
  children: ReactNode;
  view: View;
  onViewChange: (v: View) => void;
  count?: number;
  latency?: number;
}

export function Shell({ children, view, onViewChange, count, latency }: ShellProps) {
  return (
    <div className="h-screen flex flex-col bg-page overflow-hidden">
      <TopBar view={view} onViewChange={onViewChange} count={count} latency={latency} />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
