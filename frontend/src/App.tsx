import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shell } from './components/Shell';
import { OperatorTerminal } from './components/OperatorTerminal';
import { DualPanelView } from './components/DualPanelView';
import { ConversationView } from './components/ConversationView';
import { DashboardView } from './components/DashboardView';
import { DemoWalkthrough } from './components/DemoWalkthrough';
import './index.css';

type View = 'dual' | 'chat' | 'operator' | 'dashboard' | 'demo';
const LABELS: Record<View, string> = {
  dual: 'Dual Panel', chat: 'Chat', operator: 'One-Way', dashboard: 'Dashboard', demo: 'Demo',
};

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function App() {
  const [view, setView] = useState<View>('dual');
  const [metrics, setMetrics] = useState({ count: 0, latency: 0, guardRate: '0%' });

  return (
    <Shell count={metrics.count} latency={metrics.latency} guardRate={metrics.guardRate}>
      <div className="absolute bottom-12 left-6 z-50 flex gap-1 bg-surface rounded-lg border border-border shadow-dropdown p-1">
        {(Object.keys(LABELS) as View[]).map((key) => (
          <button key={key} onClick={() => setView(key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 whitespace-nowrap ${view === key ? 'bg-aviation text-white shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-subtle'}`}>
            {LABELS[key]}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={view} variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className="h-full">
          {view === 'dual' && <DualPanelView onMetrics={setMetrics} />}
          {view === 'chat' && <ConversationView onMetrics={setMetrics} />}
          {view === 'operator' && <OperatorTerminal onMetrics={setMetrics} />}
          {view === 'dashboard' && <DashboardView />}
          {view === 'demo' && <DemoWalkthrough />}
        </motion.div>
      </AnimatePresence>
    </Shell>
  );
}

export default App;
