import React, { useEffect, useState, useMemo } from 'react';
import { VoteState, CategoryId, Candidate } from '../types';
import { CANDIDATES, CATEGORIES } from '../constants';
import { getVoteStats, resetAllVotes } from '../services/voteService';
import { LogOut, LayoutDashboard, Users, Trophy, Activity, RefreshCw, Sparkles, Lock, Unlock } from 'lucide-react';

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
    <div className="min-h-screen bg-transparent text-slate-800 pb-20 font-sans relative overflow-x-hidden">
      
      {/* Background Decorative Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-50">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
      </div>

      {/* Glass Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b-4 border-black shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-black text-white p-2.5 rounded-xl shadow-neo-sm transform -rotate-2 hover:rotate-0 transition-transform">
              <LayoutDashboard size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-black tracking-tight leading-none">
                DASHBOARD
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {isRefreshing ? (
                   <span className="flex h-3 w-3 relative">
                     <span className="animate-spin absolute inline-flex h-full w-full rounded-full border-2 border-black border-t-transparent"></span>
                   </span>
                ) : (
                   <span className="flex h-3 w-3 relative">
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border border-black"></span>
                   </span>
                )}
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide bg-white px-2 rounded-md border border-black">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
                onClick={() => fetchData(false)}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-black bg-blue-300 hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all border-2 border-black shadow-neo active:shadow-none active:translate-y-1"
            >
                <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
                <span className="hidden sm:inline">{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </button>
            <button 
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-black bg-red-300 hover:bg-red-400 rounded-xl transition-all border-2 border-black shadow-neo active:shadow-none active:translate-y-1"
            >
                <LogOut size={18} />
                <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white col-span-2 md:col-span-1 p-6 rounded-3xl border-4 border-black shadow-neo hover:translate-y-1 transition-transform">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 text-black border-2 border-black rounded-lg">
                <Activity size={20} />
              </div>
              <span className="text-sm font-black text-slate-500 uppercase tracking-wider">Total Votes</span>
            </div>
            <div className="text-6xl font-black text-black tracking-tight drop-shadow-sm">{totalVotes}</div>
          </div>
          
          <div className="bg-white col-span-2 md:col-span-1 p-6 rounded-3xl border-4 border-black shadow-neo hover:translate-y-1 transition-transform">
            <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-purple-100 text-black border-2 border-black rounded-lg">
                <Users size={20} />
              </div>
              <span className="text-sm font-black text-slate-500 uppercase tracking-wider">Est. Voters</span>
            </div>
            <div className="text-6xl font-black text-black tracking-tight drop-shadow-sm">~{Math.ceil(totalVotes / 1.5)}</div>
          </div>

          <div className="bg-white col-span-2 p-6 rounded-3xl border-4 border-black shadow-neo flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                 {isSystemOpen ? <Unlock size={16} className="text-emerald-600" /> : <Lock size={16} className="text-red-600" />}
                 <span className="text-sm font-black text-slate-500 uppercase tracking-wider">Access Control</span>
              </div>
               <div className="flex items-center gap-2">
                 <div className={`px-3 py-1 rounded-full text-xs font-black border-2 shadow-sm flex items-center gap-1 transition-colors ${
                     isSystemOpen 
                     ? 'bg-emerald-100 text-emerald-800 border-emerald-800' 
                     : 'bg-red-100 text-red-800 border-red-800'
                 }`}>
                    {isSystemOpen ? <Sparkles size={12} /> : <Lock size={12} />}
                    {isSystemOpen ? 'VOTING LIVE' : 'VOTING LOCKED'}
                 </div>
                 <button 
                    onClick={toggleSystem}
                    className="text-xs font-bold underline hover:no-underline px-2"
                 >
                    {isSystemOpen ? 'Close Access' : 'Open Access'}
                 </button>
               </div>
            </div>

            {/* Dynamic IP Limit Slider */}
            <div className="w-full sm:w-auto flex-1 py-4 sm:py-0 sm:px-4 border-t-2 border-b-2 sm:border-t-0 sm:border-b-0 sm:border-l-2 sm:border-r-2 border-slate-100 my-4 sm:my-0 sm:mx-4">
              <div className="flex justify-between items-center mb-1">
                 <label className="text-xs font-black text-slate-500 uppercase">Panic Mode: Votes/IP</label>
                 <span className={`px-2 py-0.5 rounded text-xs font-bold border border-black ${maxVotesPerIp > 5 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
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
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-black"
              />
              <p className="text-[10px] text-slate-400 font-bold mt-1">Slide right if hotspots get blocked</p>
            </div>
            
            <div className="flex gap-2">
                 <button 
                    onClick={toggleSystem}
                    className={`px-4 py-3 text-xs font-black text-white rounded-xl border-2 border-black shadow-neo hover:translate-y-1 hover:shadow-none transition-all uppercase tracking-wide flex items-center gap-2 ${
                        isSystemOpen ? 'bg-orange-400 hover:bg-orange-500' : 'bg-emerald-500 hover:bg-emerald-600'
                    }`}
                >
                {isSystemOpen ? <Lock size={14}/> : <Unlock size={14}/>}
                {isSystemOpen ? 'LOCK VOTING' : 'OPEN VOTING'}
                </button>
                
                <button 
                    onClick={() => { if(confirm("DANGER: Wipe all database records?")) resetAllVotes() }}
                    className="px-4 py-3 text-xs font-black text-white bg-red-500 hover:bg-red-600 rounded-xl border-2 border-black shadow-neo hover:translate-y-1 hover:shadow-none transition-all uppercase tracking-wide"
                >
                Reset DB
                </button>
            </div>
          </div>
        </div>

        {/* 🏆 LIVE PODIUM (Top Leaders) */}
        <div>
          <h2 className="text-3xl font-black text-black mb-6 flex items-center gap-2 px-1 tracking-tight">
            <Trophy className="fill-yellow-400 text-black" size={32} /> 
            <span className="bg-yellow-300 px-2 transform -rotate-1 border-2 border-black shadow-neo-sm">
                Current Leaders
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categoryStats.map((cat, idx) => (
              <div key={cat.id} className="bg-white rounded-3xl border-4 border-black shadow-neo overflow-hidden relative group hover:-translate-y-2 transition-all duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className={`h-4 w-full border-b-4 border-black ${cat.color === 'bg-cartoon-blue' ? 'bg-blue-400' : cat.color === 'bg-cartoon-red' ? 'bg-red-400' : cat.color === 'bg-cartoon-green' ? 'bg-green-400' : 'bg-purple-400'}`}></div>
                <div className="p-6 flex flex-col items-center text-center">
                   <div className="relative mb-4">
                     <div className="absolute inset-0 bg-yellow-200 rounded-full animate-pulse blur-xl opacity-50"></div>
                     <img 
                        src={cat.leader.imageUrl} 
                        className="w-28 h-28 rounded-full object-cover border-4 border-black shadow-neo relative z-10 bg-slate-100"
                        alt="Leader"
                     />
                     <div className="absolute -bottom-4 -right-4 z-20 bg-yellow-400 text-black text-sm font-black px-3 py-1 rounded-full shadow-neo border-2 border-black flex items-center gap-1 transform rotate-6">
                        <Trophy size={14} className="fill-white" /> 1st
                     </div>
                   </div>
                   <h3 className="font-black text-black text-2xl leading-tight mb-1">{cat.leader.name}</h3>
                   <p className="text-xs text-black font-bold uppercase tracking-wider mb-5 bg-slate-100 px-3 py-1 rounded-full border-2 border-black">{cat.label}</p>
                   
                   <div className="w-full bg-slate-50 rounded-2xl p-4 border-2 border-black border-dashed">
                      <div className="flex justify-center items-baseline gap-1 mb-1">
                        <span className="text-5xl font-black text-black tracking-tighter">{cat.leader.votes}</span>
                        <span className="text-xs font-bold text-slate-500">votes</span>
                      </div>
                      {cat.leadMargin > 0 ? (
                        <div className="text-[10px] text-black font-black bg-emerald-300 rounded-full px-3 py-1 inline-flex items-center gap-1 border border-black shadow-neo-sm transform -rotate-1">
                          <Activity size={10} /> +{cat.leadMargin} lead
                        </div>
                      ) : (
                        <div className="text-[10px] text-black font-black bg-orange-300 rounded-full px-3 py-1 inline-block border border-black shadow-neo-sm transform rotate-1">
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
            <div key={cat.id} className="bg-white rounded-3xl border-4 border-black shadow-neo overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b-4 border-black flex justify-between items-center bg-slate-50">
                <h3 className="font-black text-black text-xl flex items-center gap-3">
                  <span className={`w-4 h-4 rounded-full border-2 border-black ${cat.color === 'bg-cartoon-blue' ? 'bg-blue-400' : cat.color === 'bg-cartoon-red' ? 'bg-red-400' : cat.color === 'bg-cartoon-green' ? 'bg-green-400' : 'bg-purple-400'}`}></span>
                  {cat.label} Race
                </h3>
                <span className="text-xs font-black text-black bg-white px-3 py-1.5 rounded-xl border-2 border-black shadow-neo-sm">
                  {cat.totalVotes} total
                </span>
              </div>
              
              <div className="divide-y-2 divide-black flex-1">
                {cat.candidates.map((candidate, idx) => (
                  <div key={candidate.id} className="px-6 py-4 hover:bg-yellow-50 transition-colors relative overflow-hidden group">
                    
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={`
                        font-black w-8 h-8 flex items-center justify-center rounded-full text-sm border-2 border-black shadow-neo-sm
                        ${idx === 0 ? 'bg-yellow-400 text-black' : 
                          idx === 1 ? 'bg-slate-300 text-black' : 
                          idx === 2 ? 'bg-orange-300 text-black' : 'bg-white text-slate-400'}
                      `}>
                        {idx + 1}
                      </div>
                      <img 
                        src={candidate.imageUrl} 
                        className="w-12 h-12 rounded-full object-cover border-2 border-black shadow-sm bg-slate-200"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-bold text-black text-base truncate pr-2">
                            {candidate.name}
                          </h4>
                          <span className="font-black text-black text-lg">
                            {candidate.votes}
                          </span>
                        </div>
                        
                        {/* Custom Cartoony Progress Bar */}
                        <div className="relative w-full h-4 bg-white border-2 border-black rounded-full overflow-hidden">
                           <div 
                              className={`absolute top-0 left-0 h-full border-r-2 border-black ${cat.color === 'bg-cartoon-blue' ? 'bg-blue-400' : cat.color === 'bg-cartoon-red' ? 'bg-red-400' : cat.color === 'bg-cartoon-green' ? 'bg-green-400' : 'bg-purple-400'}`}
                              style={{ width: `${candidate.percentage}%`, transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                           ></div>
                        </div>
                         <div className="flex justify-between items-center text-[10px] mt-1 font-bold text-slate-500">
                          <span className="uppercase tracking-wider opacity-70">{candidate.class}</span>
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