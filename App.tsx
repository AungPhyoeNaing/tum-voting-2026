import React, { useState, useEffect, Suspense } from 'react';
import VotingInterface from './components/VotingInterface';
import { School, AlertCircle, ArrowLeft } from 'lucide-react';

const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));

const App: React.FC = () => {
  const [view, setView] = useState<'user' | 'admin-login' | 'admin'>('user');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#admin') {
        setView('admin-login');
      } else if (hash === '#dashboard') {
         setView('admin');
      } else {
        setView('user');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      
      if (data.success) {
        window.location.hash = 'dashboard';
        setView('admin');
        setError('');
        setPin('');
      } else {
        throw new Error('Incorrect PIN');
      }
    } catch (err) {
      setError('Incorrect PIN');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const renderContent = () => {
    if (view === 'admin') {
      return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-black text-2xl">Loading Dashboard...</div>}>
          <AdminDashboard onLogout={() => { window.location.hash = ''; setView('user'); }} />
        </Suspense>
      );
    }

    if (view === 'admin-login') {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 font-sans">
          <div className="water-glass p-10 rounded-[40px] w-full max-w-sm shadow-stacked relative z-10 border-white">
            <div className="flex justify-center mb-8">
                <div className="w-16 h-16 water-glass rounded-2xl flex items-center justify-center border-white">
                    <School size={28} className="text-brand-accent" />
                </div>
            </div>
            
            <div className="text-center mb-10">
              <h2 className="text-4xl font-black tracking-tighter text-brand-primary mb-2">Login</h2>
              <p className="text-brand-muted text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Admin Gateway</p>
            </div>
            
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div className={isShaking ? 'animate-shake' : ''}>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="PIN"
                  className={`w-full bg-white/60 backdrop-blur-md border border-white rounded-2xl px-6 py-5 text-brand-primary focus:outline-none focus:ring-4 focus:ring-brand-accent/10 focus:border-brand-accent/40 transition-all text-center tracking-[1em] text-2xl font-black placeholder:tracking-normal placeholder:text-sm placeholder:font-black placeholder:text-brand-muted/30
                    ${error ? 'border-red-400 bg-red-50/50' : ''}
                  `}
                  autoFocus
                />
              </div>
              
              {error && (
                <div className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 bg-red-50/80 backdrop-blur-md py-4 rounded-xl border border-red-100">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-brand-primary hover:bg-brand-accent text-white font-black py-5 rounded-2xl transition-all duration-300 shadow-stacked uppercase tracking-widest text-sm"
              >
                Enter Dashboard
              </button>
              
              <button
                type="button"
                onClick={() => { window.location.hash = ''; }}
                className="w-full text-brand-muted text-[10px] font-black tracking-widest uppercase py-2 hover:text-brand-primary transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft size={14} /> Back
              </button>
            </form>
          </div>
        </div>
      );
    }

    return <VotingInterface onAdminClick={() => { window.location.hash = 'admin'; }} />;
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div className="flex-grow">
        {renderContent()}
      </div>
      <footer className="py-6 text-center text-[13px] font-black tracking-widest text-brand-muted/50 uppercase drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">
        Developed by <br /> <span className="text-brand-accent">Aung Phyoe Naing</span> (CEIT)
      </footer>
    </div>
  );
};

export default App;