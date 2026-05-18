
import { Activity, Globe, ShieldAlert, Zap } from 'lucide-react';

export default function DashboardView() {
  return (
    <div className="dashboard-view">
      <h2>Operational Analytics (Last 24h)</h2>
      
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={16} className="text-accent" /> Total Translations
          </div>
          <div className="stat-value">1,248</div>
          <div style={{ color: 'var(--success-color)', fontSize: '0.875rem' }}>↑ 12% vs yesterday</div>
        </div>
        
        <div className="glass-panel stat-card">
          <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={16} className="text-warning" /> Terminology Corrections
          </div>
          <div className="stat-value">342</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Guard interception rate: 27%</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={16} className="text-accent" /> Top Language Pairs
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>TR → EN</span>
                <span style={{ fontWeight: 600 }}>68%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>EN → TR</span>
                <span style={{ fontWeight: 600 }}>24%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>TR → RU</span>
                <span style={{ fontWeight: 600 }}>8%</span>
            </div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={16} className="text-success" /> Avg Latency
          </div>
          <div className="stat-value">745<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>ms</span></div>
          <div style={{ color: 'var(--success-color)', fontSize: '0.875rem' }}>P95: 1.2s</div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            Recent Guard Interventions
        </h3>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--panel-border)' }}>
                    <th style={{ padding: '0.5rem' }}>Context</th>
                    <th style={{ padding: '0.5rem' }}>Original (LLM)</th>
                    <th style={{ padding: '0.5rem' }}>Corrected (Guard)</th>
                    <th style={{ padding: '0.5rem' }}>Reason</th>
                </tr>
            </thead>
            <tbody>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem 0.5rem' }}>BOARDING</td>
                    <td style={{ color: 'var(--danger-color)' }}>boarding card</td>
                    <td style={{ color: 'var(--success-color)' }}>boarding pass</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Canonical terminology enforced</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem 0.5rem' }}>SECURITY</td>
                    <td style={{ color: 'var(--danger-color)' }}>luggage</td>
                    <td style={{ color: 'var(--success-color)' }}>baggage</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Forbidden alternative replaced</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem 0.5rem' }}>GATE</td>
                    <td style={{ color: 'var(--danger-color)' }}>late</td>
                    <td style={{ color: 'var(--success-color)' }}>delay</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Canonical terminology enforced</td>
                </tr>
                <tr>
                    <td style={{ padding: '0.75rem 0.5rem' }}>BOARDING</td>
                    <td style={{ color: 'var(--danger-color)' }}>rows 15-25</td>
                    <td style={{ color: 'var(--success-color)' }}>rows 15 through 25</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Row range formatting</td>
                </tr>
            </tbody>
        </table>
      </div>
    </div>
  );
}
