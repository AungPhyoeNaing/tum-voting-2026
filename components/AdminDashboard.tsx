import React, { useEffect, useState, useMemo, useRef } from 'react';
import { VoteState, CategoryId, Candidate, VoteRecord } from '../types';
import { CANDIDATES, CATEGORIES } from '../constants';
import { getVoteStats, resetAllVotes, getVoteLogs } from '../services/voteService';
import { LogOut, LayoutDashboard, Users, Trophy, Activity, RefreshCw, Sparkles, Lock, Unlock, Settings, SlidersHorizontal, List, Table, Minus, Plus, Filter, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [votes, setVotes] = useState<VoteState>({});
  const [logs, setLogs] = useState<VoteRecord[]>([]);
  const [viewMode, setViewMode] = useState<'stats' | 'logs'>('stats');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSystemOpen, setIsSystemOpen] = useState(false);
  const [maxVotesPerIp, setMaxVotesPerIp] = useState(3);

  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  // Custom Dropdown State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ref to access fresh state inside the interval closure
  const stateRef = useRef({ currentPage, categoryFilter, viewMode });
  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    stateRef.current = { currentPage, categoryFilter, viewMode };
  }, [currentPage, categoryFilter, viewMode]);

  const fetchData = React.useCallback(async (silent = false) => {
    // Strategy:
    // 1. If AUTO-POLL (silent): Skip if busy.
    // 2. If MANUAL (user action): Abort previous, start new.
    
    if (silent && isFetchingRef.current) return;
    
    if (!silent) {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    isFetchingRef.current = true;
    
    if (!silent) setIsRefreshing(true);
    
    try {
        // 1. Fetch Stats (Always)
        const data = await getVoteStats(controller.signal);
        setVotes(data);

        // 2. Fetch Logs (Conditional)
        const current = stateRef.current;
        
        const isLive = current.currentPage === 1 && current.categoryFilter === 'ALL';
        
        if (current.viewMode === 'logs' && (!silent || isLive)) {
            const logData = await getVoteLogs(
                current.currentPage, 
                50, 
                current.categoryFilter === 'ALL' ? '' : current.categoryFilter,
                controller.signal
            );
            if (!controller.signal.aborted) {
                setLogs(logData.logs);
                setTotalPages(logData.pagination.pages);
            }
        }
        
        // 3. System Status
        if (!controller.signal.aborted) {
            try {
                const res = await fetch('/api/system-status', { signal: controller.signal });
                const status = await res.json();
                setIsSystemOpen(status.isOpen);
                if (status.maxVotesPerIp) setMaxVotesPerIp(status.maxVotesPerIp);
            } catch (e) { /* Ignore status fetch errors */ }
        }

    } catch (e: any) { 
        if (e.name !== 'AbortError') {
             console.error("Failed to fetch data", e); 
        }
    } finally {
        if (abortControllerRef.current === controller) {
             isFetchingRef.current = false;
             abortControllerRef.current = null;
             if (!silent) setIsRefreshing(false);
             setLastUpdated(new Date());
        }
    }
  }, []);

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

  // Initial Poll Setup
  useEffect(() => {
    fetchData(); // Initial fetch
    const interval = setInterval(() => fetchData(true), 5000);
    return () => clearInterval(interval);
  }, [fetchData]);
  
  // Trigger fetch when Filters Change
  useEffect(() => {
    if (viewMode === 'logs') {
        fetchData(false);
    }
  }, [currentPage, categoryFilter, viewMode, fetchData]);

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

  const getCandidateName = (id: string) => {
      return CANDIDATES.find(c => c.id === id)?.name || id;
  };

  return (
    <div className="min-h-screen text-brand-primary pb-20 font-sans relative overflow-x-hidden">
      
      {/* Defined Water Header */}
      <header className="sticky top-0 z-40 water-glass border-b border-white/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center">
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
          
          <div className="flex items-center gap-2 bg-slate-900/5 p-1 rounded-xl border border-white/40">
             <button
                onClick={() => setViewMode('stats')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${viewMode === 'stats' ? 'bg-white shadow-stacked text-brand-primary' : 'text-brand-muted hover:text-brand-primary'}`}
             >
                <Activity size={16} /> Stats
             </button>
             <button
                onClick={() => setViewMode('logs')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${viewMode === 'logs' ? 'bg-white shadow-stacked text-brand-primary' : 'text-brand-muted hover:text-brand-primary'}`}
             >
                <List size={16} /> Logs
             </button>
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

      {viewMode === 'stats' ? (
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-fade-in">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl water-glass shadow-stacked hover:shadow-water-light transition-transform duration-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="water-glass p-2 rounded-lg">
                <Activity size={20} className="text-brand-accent" />
              </div>
              <span className="text-sm font-bold text-brand-muted uppercase tracking-wider">Total Votes</span>
            </div>
            <div className="text-6xl font-black text-brand-primary tracking-tighter">{totalVotes}</div>
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
              
              <div className="flex items-center gap-3">
                  <button 
                    onClick={() => changeIpLimit(Math.max(1, maxVotesPerIp - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-stacked text-brand-primary hover:bg-brand-accent hover:text-white transition-colors border border-white/60"
                  >
                    <Minus size={18} />
                  </button>
                  
                  <div className="flex-1 text-center font-black text-2xl text-brand-primary tracking-tighter bg-white/40 rounded-xl py-1 border border-white/40">
                    {maxVotesPerIp}
                  </div>

                  <button 
                    onClick={() => changeIpLimit(Math.min(20, maxVotesPerIp + 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-stacked text-brand-primary hover:bg-brand-accent hover:text-white transition-colors border border-white/60"
                  >
                    <Plus size={18} />
                  </button>
              </div>
              <p className="text-[10px] text-brand-muted/70 font-medium mt-3 text-center">Adjust limit for Wi-Fi hotspots</p>
            </div>
            
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
            <div key={cat.id} className="water-glass rounded-3xl shadow-stacked flex flex-col">
              <div className="px-6 py-5 border-b border-white/80 flex justify-between items-center bg-white/60 rounded-t-3xl">
                <h3 className="font-black text-brand-primary text-xl flex items-center gap-3">
                  <span className={`w-4 h-4 rounded-full border border-white/50 bg-brand-accent/30`}></span>
                  {cat.label} Race
                </h3>
                <span className="text-xs font-black text-brand-muted bg-white/50 px-3 py-1.5 rounded-xl border border-white/50 shadow-stacked">
                  {cat.totalVotes} total
                </span>
              </div>
              
              <div className="p-4 space-y-4 flex-1">
                {cat.candidates.map((candidate, idx) => (
                  <div key={candidate.id} className="px-6 py-6 bg-white/70 border border-white/90 rounded-2xl shadow-stacked hover:shadow-water-light hover:bg-white/90 transition-all relative group">
                    
                    <div className="flex items-start gap-4 relative z-10">
                      <div className={`
                        font-black w-8 h-8 flex items-center justify-center rounded-full text-sm border border-white/50 shadow-stacked mt-1.5
                        ${idx === 0 ? 'bg-brand-accent text-white' : 
                          idx === 1 ? 'bg-blue-300 text-brand-primary' : 
                          idx === 2 ? 'bg-orange-300 text-brand-primary' : 'bg-white text-brand-muted'}
                      `}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-4">
                          <h4 className="font-bold text-brand-primary text-xl leading-normal truncate pr-2">
                            {candidate.name} <span className="text-base text-brand-muted ml-1">#{candidate.number}</span>
                          </h4>
                          <span className="font-black text-brand-primary text-2xl leading-normal">
                            {candidate.votes}
                          </span>
                        </div>
                        
                        {/* Water Progress Bar */}
                        <div className="relative w-full h-4 bg-white/50 border border-white/50 rounded-full overflow-hidden mt-5">
                           <div 
                              className={`absolute top-0 left-0 h-full border-r border-white/50 bg-brand-accent`}
                              style={{ width: `${candidate.percentage}%`, transition: 'width 1s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                           ></div>
                        </div>
                         <div className="flex justify-end items-center text-[10px] mt-1 font-bold text-brand-muted opacity-70">
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
      ) : (
        <main className="max-w-7xl mx-auto px-6 py-8 animate-fade-in">
           <div className="water-glass rounded-3xl shadow-stacked overflow-hidden flex flex-col">
               {/* Header & Controls */}
               <div className="px-6 py-5 border-b border-white/60 bg-white/50 flex flex-col md:flex-row gap-4 justify-between items-center">
                  <h3 className="font-black text-brand-primary text-xl flex items-center gap-2">
                      <List size={20} /> VOTING LOGS
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                      {/* Custom Filter Dropdown */}
                      <div className="relative" ref={filterRef}>
                          <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="pl-10 pr-10 py-2 rounded-xl bg-white/60 border border-white/60 focus:outline-none focus:ring-2 focus:ring-brand-accent/20 text-sm font-bold text-brand-primary hover:bg-white/80 transition-colors w-full sm:w-48 text-left flex items-center justify-between relative"
                          >
                             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" size={16} />
                             <span className="truncate">
                                {categoryFilter === 'ALL' ? 'All Categories' : CATEGORIES.find(c => c.id === categoryFilter)?.label}
                             </span>
                             <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} size={16} />
                          </button>

                          {isFilterOpen && (
                            <div className="absolute top-full right-0 mt-2 w-full sm:w-56 bg-white/90 backdrop-blur-xl border border-white/60 rounded-xl shadow-stacked overflow-hidden z-50 animate-fade-in">
                                <div 
                                    onClick={() => { setCategoryFilter('ALL'); setCurrentPage(1); setIsFilterOpen(false); }}
                                    className={`px-4 py-3 text-sm font-bold cursor-pointer transition-colors ${categoryFilter === 'ALL' ? 'bg-brand-accent/10 text-brand-accent' : 'text-brand-primary hover:bg-white/50'}`}
                                >
                                    All Categories
                                </div>
                                {CATEGORIES.map(c => (
                                    <div 
                                        key={c.id}
                                        onClick={() => { setCategoryFilter(c.id); setCurrentPage(1); setIsFilterOpen(false); }}
                                        className={`px-4 py-3 text-sm font-bold cursor-pointer transition-colors border-t border-white/50 ${categoryFilter === c.id ? 'bg-brand-accent/10 text-brand-accent' : 'text-brand-primary hover:bg-white/50'}`}
                                    >
                                        {c.label}
                                    </div>
                                ))}
                            </div>
                          )}
                      </div>
                  </div>
               </div>

               <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm">
                       <thead>
                           <tr className="bg-white/40 border-b border-white/60 text-brand-muted uppercase text-[10px] tracking-widest font-black">
                               <th className="px-6 py-4">Time</th>
                               <th className="px-6 py-4">Category</th>
                               <th className="px-6 py-4">Candidate</th>
                               <th className="px-6 py-4">IP Address</th>
                               <th className="px-6 py-4">Device Fingerprint</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-white/40">
                           {logs.map((log) => (
                               <tr key={log.id} className="hover:bg-white/40 transition-colors">
                                   <td className="px-6 py-3 font-mono text-xs font-bold text-slate-600">
                                       {new Date(log.timestamp.replace(' ', 'T') + 'Z').toLocaleString('en-US', { timeZone: 'Asia/Yangon' })}
                                   </td>
                                   <td className="px-6 py-3 font-black text-brand-primary">
                                       {log.categoryId}
                                   </td>
                                   <td className="px-6 py-3">
                                       <span className="font-bold text-brand-accent">{getCandidateName(log.candidateId)}</span>
                                   </td>
                                   <td className="px-6 py-3 font-mono text-xs">
                                       {log.ipAddress}
                                   </td>
                                   <td className="px-6 py-3 font-mono text-[10px] text-slate-500 max-w-xs truncate" title={log.fingerprint + '\n' + log.hardwareId}>
                                       {log.fingerprint?.substring(0, 12)}...
                                       <br/>
                                       <span className="opacity-50">{log.hardwareId?.split('|').slice(0,2).join('|')}</span>
                                   </td>
                               </tr>
                           ))}
                           {logs.length === 0 && (
                               <tr>
                                   <td colSpan={5} className="px-6 py-10 text-center text-brand-muted font-bold">
                                       No records found.
                                   </td>
                               </tr>
                           )}
                       </tbody>
                   </table>
               </div>
               
               {/* Pagination */}
               <div className="px-6 py-4 border-t border-white/60 bg-white/40 flex justify-between items-center">
                  <span className="text-xs font-bold text-brand-muted">
                      Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                      <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="p-2 rounded-lg bg-white shadow-stacked disabled:opacity-50 disabled:shadow-none hover:bg-brand-accent hover:text-white transition-all text-brand-primary"
                      >
                          <ChevronLeft size={16} />
                      </button>
                      <button 
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className="p-2 rounded-lg bg-white shadow-stacked disabled:opacity-50 disabled:shadow-none hover:bg-brand-accent hover:text-white transition-all text-brand-primary"
                      >
                          <ChevronRight size={16} />
                      </button>
                  </div>
               </div>
           </div>
        </main>
      )}

      {/* SECRET RESET TRIGGER (Bottom Right Corner - Hidden) */}
      <div 
        onClick={() => {
            const password = prompt("Enter Master Password:");
            if (password === "45644779") {
                 if(confirm("🚨 DANGER ZONE 🚨\n\nThis will PERMANENTLY DELETE all vote records.\nThere is no undo.\n\nAre you absolutely sure?")) {
                     resetAllVotes();
                 }
            }
        }}
        className="fixed bottom-0 right-0 w-6 h-6 z-[100] cursor-default opacity-0" 
      />
    </div>
  );
};

export default AdminDashboard;