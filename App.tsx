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
        <div className="min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden">
          {/* Background Elements */}
           <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-50">
            <div className="absolute top-10 left-10 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob border-4 border-transparent"></div>
            <div className="absolute bottom-10 right-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob animation-delay-2000"></div>
          </div>

          <div className="bg-white p-8 rounded-3xl w-full max-w-sm border-4 border-black shadow-neo-xl relative z-10 animate-slide-up">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-yellow-400 rounded-2xl border-4 border-black shadow-neo text-black transform -rotate-3 hover:rotate-0 transition-transform hover:scale-110 duration-300 cursor-pointer">
                <School size={32} />
              </div>
            </div>
            <h2 className="text-3xl font-black text-center text-black mb-1 tracking-tight">Faculty Access</h2>
            <p className="text-center text-slate-500 text-sm mb-6 font-bold uppercase tracking-widest bg-slate-100 inline-block px-2 mx-auto rounded border border-black transform rotate-1">Restricted Area</p>
            
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className={isShaking ? 'animate-shake' : ''}>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="PIN CODE"
                  className={`w-full bg-slate-50 border-4 rounded-xl px-4 py-3 text-black focus:outline-none focus:ring-4 focus:ring-yellow-200 transition-all text-center tracking-[0.5em] text-xl font-black placeholder-slate-400
                    ${error ? 'border-red-500 focus:border-red-500' : 'border-black focus:border-black'}
                  `}
                  autoFocus
                />
              </div>
              {error && (
                <div className="text-red-500 text-xs flex items-center justify-center gap-2 bg-red-50 py-2 rounded-lg font-black border-2 border-red-200 animate-pulse">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-black hover:bg-slate-800 text-white font-black py-3.5 rounded-xl transition-all shadow-neo hover:shadow-neo-lg active:scale-95 active:shadow-none hover:-translate-y-1 border-2 border-transparent"
              >
                Access Dashboard
              </button>
              <button
                type="button"
                onClick={() => { window.location.hash = ''; }}
                className="w-full text-slate-500 text-sm py-2 hover:text-black rounded-lg transition-colors font-bold flex items-center justify-center gap-2 hover:bg-slate-100 border-2 border-transparent hover:border-black"
              >
                <ArrowLeft size={14} /> Back to Voting
              </button>
            </form>
          </div>
        </div>
      );
    }

    return <VotingInterface onAdminClick={() => { window.location.hash = 'admin'; }} />;
  };

  return (
    <>
      {renderContent()}
    </>
  );
};

export default App;