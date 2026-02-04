import React, { useEffect, useState, useMemo } from 'react';
import { VoteState, CategoryId, Candidate } from '../types';
import { CANDIDATES, CATEGORIES } from '../constants';
import { getVoteStats, resetAllVotes } from '../services/voteService';
import { LogOut, LayoutDashboard, Users, Trophy, Activity, RefreshCw, Sparkles, Lock, Unlock, Settings, SlidersHorizontal } from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [votes, setVotes] = useState<VoteState>({});
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSystemOpen, setIsSystemOpen] = useState(false);
  const [maxVotesPerIp, setMaxVotesPerIp] = useState(3);

  const fetchData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    const data = await getVoteStats();
    setVotes(data);
    
    // Also fetch system status
    try {
        const res = await fetch('/api/system-status');
        const status = await res.json();
        setIsSystemOpen(status.isOpen);
        if (status.maxVotesPerIp) setMaxVotesPerIp(status.maxVotesPerIp);
    } catch (e) { console.error("Failed to fetch status"); }

    setLastUpdated(new Date());
    if (!silent) setIsRefreshing(false);
  };

  const toggleSystem = async () => {
      const newState = !isSystemOpen;
      if (!confirm(`Are you sure you want to ${newState ? 'OPEN' : 'CLOSE'} the voting lines?`)) return;
      
      try {
        const res = await fetch('/api/system-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isOpen: newState })
        });
        const data = await res.json();
        if (data.success) {
            setIsSystemOpen(data.isOpen);
        } else {
            alert("Failed: " + data.error);
        }
      } catch (e) {
          alert("Network Error");
      }
  };

  const changeIpLimit = async (newLimit: number) => {
    try {
      const res = await fetch('/api/system-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newMaxVotes: newLimit })
      });
      const data = await res.json();
      if (data.success) {
          setMaxVotesPerIp(data.maxVotesPerIp);
      }
    } catch (e) {
        console.error("Failed to update IP limit");
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const dashboardData = useMemo(() => {
    const totalVotes = Object.values(votes).reduce((a: number, b: number) => a + b, 0);

    const categoryStats = CATEGORIES.map(category => {
      const candidates = CANDIDATES.filter(c => c.categoryId === category.id);
      
      const candidatesWithVotes = candidates.map(c => {
        const count = votes[c.id] || 0;
        return {
          ...c,
          votes: count,
        };
      });

      const sorted = candidatesWithVotes.sort((a, b) => b.votes - a.votes);
      const totalCategoryVotes = sorted.reduce((sum, c) => sum + c.votes, 0);
      const leader = sorted[0];
      const runnerUp = sorted[1];
      const leadMargin = leader && runnerUp ? leader.votes - runnerUp.votes : 0;

      return {
        ...category,
        totalVotes: totalCategoryVotes,
        candidates: sorted.map(c => ({
          ...c,
          percentage: totalCategoryVotes > 0 ? ((c.votes / totalCategoryVotes) * 100).toFixed(1) : '0.0'
        })),
        leader,
        leadMargin
      };
    });

    return { totalVotes, categoryStats };
  }, [votes]);

  const { totalVotes, categoryStats } = dashboardData;

  return (
    <div className="min-h-screen text-brand-primary pb-20 font-sans relative overflow-x-hidden">
      
      {/* Defined Water Header */}
      <header className="sticky top-0 z-40 water-glass border-b border-white/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="water-glass p-2.5 rounded-xl">
              <LayoutDashboard size={24} className="text-brand-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter leading-none text-brand-primary">
                ADMIN <span className="text-brand-accent">DASHBOARD</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {isRefreshing ? (
                   <span className="flex h-3 w-3 relative">
                     <span className="animate-spin absolute inline-flex h-full w-full rounded-full border-2 border-brand-accent border-t-transparent"></span>
                   </span>
                ) : (
                   <span className="flex h-3 w-3 relative">
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-white/50"></span>
                   </span>
                )}
                <p className="text-xs text-brand-muted font-medium uppercase tracking-wide">
                  Last Updated: {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
                onClick={() => fetchData(false)}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-brand-primary water-glass hover:bg-brand-accent hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-stacked active:shadow-water-light"
            >
                <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
            </button>
            <button 
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-brand-primary water-glass hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-stacked active:shadow-water-light"
            >
                <LogOut size={18} />
                <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-fade-in">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl water-glass shadow-stacked hover:shadow-water-light transition-transform duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="water-glass p-2 rounded-lg">
                <Activity size={20} className="text-brand-accent" />
              </div>
              <span className="text-sm font-bold text-brand-muted uppercase tracking-wider">Total Votes</span>
            </div>
            <div className="text-6xl font-black text-brand-primary tracking-tighter">{totalVotes}</div>
          </div>
          
          <div className="p-6 rounded-3xl water-glass shadow-stacked hover:shadow-water-light transition-transform duration-300">
            <div className="flex items-center gap-3 mb-2">
               <div className="water-glass p-2 rounded-lg">
                <Users size={20} className="text-emerald-500" />
              </div>
              <span className="text-sm font-bold text-brand-muted uppercase tracking-wider">Est. Voters</span>
            </div>
            <div className="text-6xl font-black text-brand-primary tracking-tighter">~{Math.ceil(totalVotes / 1.5)}</div>
          </div>

          {/* System Status Card */}
          <div className="p-6 rounded-3xl water-glass shadow-stacked hover:shadow-water-light transition-transform duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                 <div className="water-glass p-2 rounded-lg">
                  <Settings size={20} className="text-blue-500" />
                </div>
                 <span className="text-sm font-bold text-brand-muted uppercase tracking-wider">System Status</span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                 <div className={`px-4 py-2 rounded-full text-sm font-black border border-white/50 shadow-stacked flex items-center gap-2 transition-colors ${
                     isSystemOpen 
                     ? 'bg-emerald-500 text-white' 
                     : 'bg-red-500 text-white'
                 }`}>
                    {isSystemOpen ? <Sparkles size={16} /> : <Lock size={16} />}
                    {isSystemOpen ? 'VOTING LIVE' : 'VOTING LOCKED'}
                 </div>
              </div>
            </div>
            <button 
                onClick={toggleSystem}
                className={`w-full py-3 text-sm font-black text-white rounded-xl shadow-stacked hover:shadow-water-light transition-all uppercase tracking-wide flex items-center justify-center gap-2 ${
                    isSystemOpen ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
            >
            {isSystemOpen ? <Lock size={16}/> : <Unlock size={16}/>}
            {isSystemOpen ? 'LOCK VOTING' : 'OPEN VOTING'}
            </button>
          </div>

          {/* IP Limit Control Card */}
          <div className="p-6 rounded-3xl water-glass shadow-stacked hover:shadow-water-light transition-transform duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                 <div className="water-glass p-2 rounded-lg">
                  <SlidersHorizontal size={20} className="text-purple-500" />
                </div>
                 <span className="text-sm font-bold text-brand-muted uppercase tracking-wider">Votes/IP Limit</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                 <label className="text-sm font-bold text-brand-muted">Max votes per IP:</label>
                 <span className={`px-3 py-1 rounded-full text-xs font-bold border border-white/50 shadow-stacked ${maxVotesPerIp > 5 ? 'bg-red-100/50 text-red-600' : 'bg-brand-accent/20 text-brand-primary'}`}>
                    {maxVotesPerIp} {maxVotesPerIp === 1 ? 'Vote' : 'Votes'}
                 </span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="20" 
                step="1"
                value={maxVotesPerIp}
                onChange={(e) => changeIpLimit(parseInt(e.target.value))}
                className="w-full h-2 bg-white/50 rounded-lg appearance-none cursor-pointer accent-brand-accent"
              />
              <p className="text-[10px] text-brand-muted/70 font-medium mt-2">Adjust max votes per IP (e.g., from public Wi-Fi hotspots).</p>
            </div>
            <button 
                onClick={() => { if(confirm("DANGER: Wipe all database records?")) resetAllVotes() }}
                className="w-full mt-4 py-3 text-sm font-black text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-stacked hover:shadow-water-light transition-all uppercase tracking-wide"
            >
            RESET ALL VOTES
            </button>
          </div>
        </div>

        {/* 🏆 LIVE PODIUM (Top Leaders) */}
        <div>
          <h2 className="text-3xl font-black text-brand-primary mb-6 flex items-center gap-2 px-1 tracking-tighter">
            <Trophy className="fill-brand-accent text-brand-primary" size={32} /> 
            <span className="bg-white/50 px-3 py-1 rounded-lg border border-white/50 shadow-stacked">
                Current Leaders
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categoryStats.map((cat, idx) => (
              <div key={cat.id} className="water-glass rounded-3xl shadow-stacked overflow-hidden relative group hover:shadow-water-light transition-all duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                <div className={`h-4 w-full border-b border-white/60 bg-brand-accent/20`}></div>
                <div className="p-6 flex flex-col items-center text-center">
                   <div className="relative mb-4">
                     <div className="absolute inset-0 bg-brand-accent/20 rounded-full animate-pulse blur-xl opacity-50"></div>
                     <div className="w-28 h-28 rounded-full water-glass relative z-10 flex items-center justify-center border-white/60">
                        <span className="text-4xl font-black text-brand-accent/50">#{cat.leader.number}</span>
                     </div>
                     <div className="absolute -bottom-4 -right-4 z-20 bg-brand-accent text-white text-sm font-black px-3 py-1 rounded-full shadow-stacked border border-white/50 flex items-center gap-1">
                        <Trophy size={14} className="fill-white" /> 1st
                     </div>
                   </div>
                   <h3 className="font-black text-brand-primary text-2xl leading-tight mb-1">{cat.leader.name}</h3>
                   <p className="text-xs text-brand-muted font-bold uppercase tracking-wider mb-5 bg-white/50 px-3 py-1 rounded-full border border-white/50">{cat.label}</p>
                   
                   <div className="w-full water-glass rounded-2xl p-4 border border-white/50 border-dashed shadow-water-inner">
                      <div className="flex justify-center items-baseline gap-1 mb-1">
                        <span className="text-5xl font-black text-brand-primary tracking-tighter">{cat.leader.votes}</span>
                        <span className="text-xs font-bold text-brand-muted">votes</span>
                      </div>
                      {cat.leadMargin > 0 ? (
                        <div className="text-[10px] text-emerald-600 font-black bg-emerald-100/50 rounded-full px-3 py-1 inline-flex items-center gap-1 border border-emerald-200/50 shadow-stacked">
                          <Activity size={10} /> +{cat.leadMargin} lead
                        </div>
                      ) : (
                        <div className="text-[10px] text-orange-600 font-black bg-orange-100/50 rounded-full px-3 py-1 inline-block border border-orange-200/50 shadow-stacked">
                           Neck and Neck
                        </div>
                      )}
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 📊 DETAILED BREAKDOWN */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
          {categoryStats.map(cat => (
            <div key={cat.id} className="water-glass rounded-3xl shadow-stacked overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-white/60 flex justify-between items-center bg-white/50">
                <h3 className="font-black text-brand-primary text-xl flex items-center gap-3">
                  <span className={`w-4 h-4 rounded-full border border-white/50 bg-brand-accent/30`}></span>
                  {cat.label} Race
                </h3>
                <span className="text-xs font-black text-brand-muted bg-white/50 px-3 py-1.5 rounded-xl border border-white/50 shadow-stacked">
                  {cat.totalVotes} total
                </span>
              </div>
              
              <div className="divide-y divide-white/40 flex-1">
                {cat.candidates.map((candidate, idx) => (
                  <div key={candidate.id} className="px-6 py-4 bg-white/40 hover:bg-white/60 transition-colors relative overflow-hidden group">
                    
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`
                        font-black w-8 h-8 flex items-center justify-center rounded-full text-sm border border-white/50 shadow-stacked
                        ${idx === 0 ? 'bg-brand-accent text-white' : 
                          idx === 1 ? 'bg-blue-300 text-brand-primary' : 
                          idx === 2 ? 'bg-orange-300 text-brand-primary' : 'bg-white text-brand-muted'}
                      `}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-bold text-brand-primary text-base truncate pr-2">
                            {candidate.name}
                          </h4>
                          <span className="font-black text-brand-primary text-lg">
                            {candidate.votes}
                          </span>
                        </div>
                        
                        {/* Water Progress Bar */}
                        <div className="relative w-full h-4 bg-white/50 border border-white/50 rounded-full overflow-hidden">
                           <div 
                              className={`absolute top-0 left-0 h-full border-r border-white/50 bg-brand-accent`}
                              style={{ width: `${candidate.percentage}%`, transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                           ></div>
                        </div>
                         <div className="flex justify-between items-center text-[10px] mt-1 font-bold text-brand-muted opacity-70">
                          <span className="uppercase tracking-wider">{candidate.class}</span>
                          <span className="font-mono">{candidate.percentage}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;