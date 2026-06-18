import { type ReactNode } from 'react';
import { TopBar } from './TopBar';
import { StatusBar } from './StatusBar';

interface ShellProps { children: ReactNode; count?: number; latency?: number; guardRate?: string; }
export function Shell({ children, count, latency, guardRate }: ShellProps) {
  return (
    <div className="h-screen flex flex-col bg-page overflow-hidden">
      <TopBar />
      <main className="flex-1 overflow-hidden">{children}</main>
      <StatusBar count={count} latency={latency} guardRate={guardRate} />
    </div>
  );
}
