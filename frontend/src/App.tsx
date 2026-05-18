import { useState } from 'react';
import { Plane, Settings } from 'lucide-react';
import OperatorView from './components/OperatorView';
import DashboardView from './components/DashboardView';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState<'operator' | 'dashboard'>('operator');

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-brand">
          <Plane className="text-accent" />
          <span>Aviation Translation System</span>
        </div>
        <div className="nav-links">
          <button 
            className={currentView === 'operator' ? 'active' : ''} 
            onClick={() => setCurrentView('operator')}
          >
            Operator Terminal
          </button>
          <button 
            className={currentView === 'dashboard' ? 'active' : ''} 
            onClick={() => setCurrentView('dashboard')}
          >
            Dashboard
          </button>
          <button className="icon-only">
            <Settings size={20} />
          </button>
        </div>
      </nav>

      <main className="main-content">
        {currentView === 'operator' ? <OperatorView /> : <DashboardView />}
      </main>
    </div>
  );
}

export default App;
