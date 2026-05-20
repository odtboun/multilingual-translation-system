import { Activity, Globe, ShieldAlert, Zap } from 'lucide-react';

export default function DashboardView() {
  return (
    <div className="dashboard-view">
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        Operational Analytics
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Metrics for the last 24 hours across all terminals.</p>
      
      <div className="stats-grid">
        <div className="panel stat-card" style={{ borderTop: '4px solid var(--accent-color)' }}>
          <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} className="text-accent" style={{ color: 'var(--accent-color)' }} /> Total Translations
          </div>
          <div className="stat-value">1,248</div>
          <div style={{ color: 'var(--success-color)', fontSize: '0.875rem', fontWeight: 600 }}>↑ 12% vs yesterday</div>
        </div>
        
        <div className="panel stat-card" style={{ borderTop: '4px solid var(--warning-color)' }}>
          <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={18} style={{ color: 'var(--warning-color)' }} /> Terminology Corrections
          </div>
          <div className="stat-value">342</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Guard interception rate: 27%</div>
        </div>

        <div className="panel stat-card" style={{ borderTop: '4px solid var(--accent-hover)' }}>
          <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={18} style={{ color: 'var(--accent-hover)' }} /> Top Language Pairs
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                <span>TR → EN</span>
                <span style={{ fontWeight: 600 }}>68%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                <span>EN → TR</span>
                <span style={{ fontWeight: 600 }}>24%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)' }}>
                <span>TR → RU</span>
                <span style={{ fontWeight: 600 }}>8%</span>
            </div>
          </div>
        </div>

        <div className="panel stat-card" style={{ borderTop: '4px solid var(--success-color)' }}>
          <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={18} style={{ color: 'var(--success-color)' }} /> Avg Latency
          </div>
          <div className="stat-value">745<span style={{ fontSize: '1.25rem', color: 'var(--text-tertiary)', marginLeft: '4px' }}>ms</span></div>
          <div style={{ color: 'var(--success-color)', fontSize: '0.875rem', fontWeight: 600 }}>P95: 1.2s</div>
        </div>
      </div>

      <div className="panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--panel-border)', background: 'var(--bg-color)' }}>
            <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Recent Guard Interventions</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Context</th>
                        <th>Original (LLM)</th>
                        <th>Corrected (Guard)</th>
                        <th>Reason</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><span className="badge badge-outline">BOARDING</span></td>
                        <td style={{ color: 'var(--danger-text)', fontWeight: 500 }}>boarding card</td>
                        <td style={{ color: 'var(--success-text)', fontWeight: 600 }}>boarding pass</td>
                        <td style={{ color: 'var(--text-secondary)' }}>Canonical terminology enforced</td>
                    </tr>
                    <tr>
                        <td><span className="badge badge-outline">SECURITY</span></td>
                        <td style={{ color: 'var(--danger-text)', fontWeight: 500 }}>luggage</td>
                        <td style={{ color: 'var(--success-text)', fontWeight: 600 }}>baggage</td>
                        <td style={{ color: 'var(--text-secondary)' }}>Forbidden alternative replaced</td>
                    </tr>
                    <tr>
                        <td><span className="badge badge-outline">GATE</span></td>
                        <td style={{ color: 'var(--danger-text)', fontWeight: 500 }}>late</td>
                        <td style={{ color: 'var(--success-text)', fontWeight: 600 }}>delay</td>
                        <td style={{ color: 'var(--text-secondary)' }}>Canonical terminology enforced</td>
                    </tr>
                    <tr>
                        <td><span className="badge badge-outline">BOARDING</span></td>
                        <td style={{ color: 'var(--danger-text)', fontWeight: 500 }}>rows 15-25</td>
                        <td style={{ color: 'var(--success-text)', fontWeight: 600 }}>rows 15 through 25</td>
                        <td style={{ color: 'var(--text-secondary)' }}>Row range formatting</td>
                    </tr>
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
