import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldAlert, Zap, TrendingUp, Globe, Clock } from 'lucide-react';
import { Card } from './ui/Card';
import { Skeleton } from './ui/Skeleton';

interface Metrics { total_translations: number; guard_interventions: number; guard_rate: string; avg_latency_ms: number; latency_p95_ms: number; cache_hit_rate: string; uptime_seconds: number; by_touchpoint: Record<string, number>; }

function StatCard({ icon, label, value, subtitle, accent = 'aviation', loading }: { icon: React.ReactNode; label: string; value: string; subtitle: string; accent?: 'aviation' | 'success' | 'warning'; loading: boolean }) {
  const colors = { aviation: 'border-t-aviation text-aviation', success: 'border-t-success text-success', warning: 'border-t-warning text-warning' };
  return (
    <Card className={`border-t-[3px] ${colors[accent]}`} padding="lg">
      <div className="flex items-center gap-2 mb-3"><span>{icon}</span><span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">{label}</span></div>
      {loading ? <div className="space-y-2"><Skeleton className="h-8 w-20" /><Skeleton className="h-3 w-28" /></div> :
        <><div className="text-[28px] font-bold text-text-primary tabular-nums mb-1">{value}</div><div className="text-xs text-text-tertiary">{subtitle}</div></>}
    </Card>
  );
}

export function DashboardView() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const r = await fetch('/api/debug/health'); if (!r.ok) throw new Error('');
        const d = await r.json();
        setMetrics({ total_translations: d.glossary_terms || 0, guard_interventions: 0, guard_rate: '0%', avg_latency_ms: 0, latency_p95_ms: 0, cache_hit_rate: '0%', uptime_seconds: 0, by_touchpoint: {} });
      } catch { setError(true); }
    };
    fetchMetrics(); const i = setInterval(fetchMetrics, 5000); return () => clearInterval(i);
  }, []);

  const loading = !metrics && !error;
  const empty = metrics && metrics.total_translations === 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-8 space-y-6">
        <div><h1 className="text-xl font-bold text-text-primary">Operational Analytics</h1><p className="text-sm text-text-tertiary mt-1">Real-time translation metrics across all touchpoints</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Activity size={17} />} label="Translations" value={metrics?.total_translations.toLocaleString() || '0'} subtitle="Total today" accent="aviation" loading={loading} />
          <StatCard icon={<ShieldAlert size={17} />} label="Guard Rate" value={metrics?.guard_rate || '0%'} subtitle="Terminology corrections" accent="warning" loading={loading} />
          <StatCard icon={<Zap size={17} />} label="Avg Latency" value={metrics ? `${Math.round(metrics.avg_latency_ms)}ms` : '—'} subtitle={`P95: ${metrics ? Math.round(metrics.latency_p95_ms) : 0}ms`} accent={metrics && metrics.avg_latency_ms > 0 && metrics.avg_latency_ms < 500 ? 'success' : 'warning'} loading={loading} />
          <StatCard icon={<TrendingUp size={17} />} label="Cache Hits" value={metrics?.cache_hit_rate || '0%'} subtitle="Instant translations" accent="aviation" loading={loading} />
        </div>
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2"><Globe size={15} className="text-text-tertiary" />Activity by Touchpoint</h2>
          {loading ? <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-6 w-full" />)}</div> :
           empty ? <p className="text-sm text-text-tertiary py-8 text-center">Start translating to see touchpoint distribution</p> :
           <div className="space-y-3">
            {Object.entries(metrics!.by_touchpoint).sort(([,a],[,b]) => b - a).slice(0, 8).map(([tp, count]) => {
              const max = Math.max(...Object.values(metrics!.by_touchpoint));
              return (
                <div key={tp} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-text-secondary w-28 truncate">{tp.replace(/_/g, ' ')}</span>
                  <div className="flex-1 h-6 bg-subtle rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(count/max)*100}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className="h-full bg-aviation rounded-full" />
                  </div>
                  <span className="text-xs font-semibold text-text-primary tabular-nums w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>}
        </Card>
        <div className="flex items-center justify-center gap-2 text-xs text-text-tertiary">
          <Clock size={11} /><span>System online for {metrics ? Math.floor(metrics.uptime_seconds / 3600) : 0}h {metrics ? Math.floor((metrics.uptime_seconds % 3600) / 60) : 0}m</span>
        </div>
      </div>
    </div>
  );
}
