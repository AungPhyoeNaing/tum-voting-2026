import React, { useState, useEffect } from 'react';
import { CATEGORIES, CANDIDATES } from '../constants';
import { CategoryId, Candidate } from '../types';
import { castVote, hasVotedInCategory } from '../services/voteService';
import { CheckCircle2, ChevronRight, Lock, Sparkles, X, Heart, Star, Crown, Zap } from 'lucide-react';

interface VotingInterfaceProps {
  onAdminClick: () => void;
}

// Sub-component for efficient display (Water-Glass Stacked)
const LazyImageCard = ({ candidate, onClick, isVoted }: any) => {
    
    return (
        <div 
            onClick={onClick}
            className={`
            relative group rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 water-card shadow-stacked
            ${isVoted ? 'opacity-40 grayscale pointer-events-none' : 'hover:shadow-water-light hover:-translate-y-1 active:scale-[0.99]'}
            w-full
            `}
        >
            <div className="flex items-center p-4 gap-6">
                {/* Number Plate (Water Reflection style) */}
                <div className="w-20 h-20 rounded-2xl bg-white/90 flex items-center justify-center border border-white/60 shadow-[inset_0_2px_10px_rgba(0,0,0,0.15)] overflow-hidden flex-shrink-0">
                    <span className="text-3xl font-black text-brand-accent select-none tracking-tighter">
                        {candidate.number}
                    </span>
                </div>
                
                <div className="flex-1">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-base sm:text-xl font-black tracking-tighter text-brand-primary">{candidate.name}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl water-glass flex items-center justify-center group-hover:bg-brand-accent group-hover:text-white transition-all duration-300">
                            <ChevronRight size={20} />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Liquid highlight line */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        </div>
    );
};

const VotingInterface: React.FC<VotingInterfaceProps> = ({ onAdminClick }) => {
  const [activeCategory, setActiveCategory] = useState<CategoryId>(CategoryId.KING);
  const [votedCategories, setVotedCategories] = useState<Record<string, boolean>>({});
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSystemOpen, setIsSystemOpen] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/system-status');
        const data = await res.json();
        if (typeof data.isOpen === 'boolean') {
            setIsSystemOpen(data.isOpen);
        }
      } catch (e) { console.error("Status polling error", e); }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const status: Record<string, boolean> = {};
    CATEGORIES.forEach(cat => {
      status[cat.id] = hasVotedInCategory(cat.id);
    });
    setVotedCategories(status);
  }, []);

  const handleVote = async (candidate: Candidate) => {
    if (votedCategories[activeCategory]) return;
    setSelectedCandidate(candidate);
  };

  const handleInitiateVote = () => {
    setShowConfirmModal(true);
  };

  const confirmVote = async () => {
    if (!selectedCandidate) return;
    
    setIsSubmitting(true);
    const result = await castVote(selectedCandidate.id, activeCategory);
    
    if (result.success) {
      setVotedCategories(prev => ({ ...prev, [activeCategory]: true }));
      setShowConfirmModal(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedCandidate(null);
      }, 3000);
    } else {
      alert(result.error || 'Failed to submit vote.');
      setShowConfirmModal(false);
    }
    setIsSubmitting(false);
  };

  const filteredCandidates = CANDIDATES.filter(c => c.categoryId === activeCategory);
  const currentCategory = CATEGORIES.find(c => c.id === activeCategory);
  
  return (
    <div className="min-h-screen text-brand-primary font-sans">
      
      {/* Defined Water Header */}
      <header className="sticky top-0 z-40 water-glass border-b border-white/60">
        <div className="max-w-xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex flex-col">
                <h1 className="text-2xl font-black tracking-tighter leading-none text-brand-primary">TUM<span className="text-brand-accent">.</span>2026</h1>
                <span className="text-[10px] font-black text-brand-muted tracking-[0.3em] uppercase mt-1">Fresher Welcome</span>
            </div>
            
            <button 
                onClick={onAdminClick} 
                className="w-10 h-10 flex items-center justify-center rounded-xl water-glass hover:bg-brand-accent hover:text-white transition-all duration-300"
            >
                <Lock size={18} />
            </button>
        </div>
        
        {/* Sharp Segmented Switcher */}
        <div className="max-w-xl mx-auto px-6 pb-6">
            <div className="flex bg-slate-900/5 p-1.5 rounded-2xl border border-white/40">
                {CATEGORIES.map(cat => {
                    const isActive = activeCategory === cat.id;
                    const isVoted = votedCategories[cat.id];
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`
                                flex-1 py-3 rounded-xl text-[11px] font-black tracking-widest transition-all duration-300 flex items-center justify-center gap-2
                                ${isActive ? 'bg-white shadow-stacked text-brand-accent' : 'text-brand-muted hover:text-brand-primary'}
                                ${isVoted && !isActive ? 'opacity-40' : ''}
                            `}
                        >
                            {isVoted && <CheckCircle2 size={14} />}
                            {cat.label}
                        </button>
                    );
                })}
            </div>
        </div>
      </header>

      {/* Main Content (Stacked Column) */}
      <main className="max-w-xl mx-auto px-6 pt-12 pb-32">
        {!isSystemOpen ? (
            <div className="text-center py-20 px-8 water-glass rounded-[40px] shadow-stacked animate-slide-up border-white/80">
                <div className="w-20 h-20 bg-brand-surface rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/60">
                    <Lock size={32} className="text-brand-accent" />
                </div>
                <h2 className="text-4xl font-black tracking-tighter mb-4">VOTING CLOSED</h2>
                <p className="text-brand-muted font-bold text-sm tracking-wide">
                    Lines are currently frozen.
                </p>
            </div>
        ) : (
            <>
                <div className="mb-10 flex items-center justify-between animate-fade-in">
                    <div>
                        <h2 className="text-5xl font-black tracking-tighter text-brand-primary">{currentCategory?.label}</h2>
                        <div className="h-1 w-12 bg-brand-accent mt-2 rounded-full" />
                    </div>
                    {votedCategories[activeCategory] && (
                        <div className="water-glass px-5 py-2 rounded-full text-[10px] font-black tracking-[0.2em] uppercase flex items-center gap-2 text-emerald-600 border-emerald-100">
                           <CheckCircle2 size={14} /> VOTED
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-6 animate-slide-up">
                    {filteredCandidates.map((candidate) => (
                        <LazyImageCard 
                            key={candidate.id}
                            candidate={candidate}
                            isVoted={votedCategories[activeCategory]}
                            onClick={() => handleVote(candidate)}
                        />
                    ))}
                </div>
            </>
        )}
      </main>

      {/* Water Drawer */}
      {selectedCandidate && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-brand-primary/20 backdrop-blur-md animate-fade-in p-4" 
          onClick={() => setSelectedCandidate(null)}
        >
          <div 
            className="bg-white/90 backdrop-blur-3xl w-full max-w-xl sm:rounded-[48px] rounded-[48px] shadow-2xl animate-slide-up overflow-hidden border-t border-white flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Grab Handle */}
            <div className="w-12 h-1.5 bg-black/10 rounded-full mx-auto mt-4 mb-2 flex-shrink-0" />
            
            <div className="p-6 pt-4 sm:p-12 sm:pt-8 text-center overflow-y-auto custom-scrollbar"> {/* Added overflow-y-auto and custom-scrollbar */}
               <div className="flex justify-between items-start mb-6 sm:mb-10">
                 <div>
                    <span className="text-brand-accent text-xs font-black tracking-[0.4em] uppercase block mb-1 opacity-60">Candidate {selectedCandidate.number}</span>
                    <h3 className="text-2xl sm:text-3xl font-black tracking-tighter text-brand-primary leading-tight">
                        {selectedCandidate.name}
                    </h3>
                 </div>
                 <button 
                    onClick={() => setSelectedCandidate(null)}
                    className="w-12 h-12 rounded-xl water-glass flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                 >
                    <X size={24} />
                 </button>
               </div>

               <button
                onClick={handleInitiateVote}
                className="w-full py-5 rounded-3xl font-black text-white bg-brand-primary hover:bg-brand-accent transition-all duration-500 flex items-center justify-center gap-4 text-xl shadow-stacked"
               >
                CAST VOTE <ChevronRight size={24} />
               </button>
               
               <button 
                onClick={() => setSelectedCandidate(null)}
                className="mt-4 w-full py-3 text-brand-muted font-black text-sm"
               >
                Cancel
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Water Confirmation */}
      {showConfirmModal && selectedCandidate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-primary/10 backdrop-blur-xl p-6 animate-fade-in">
          <div className="max-w-sm w-full water-glass rounded-[40px] p-10 text-center border-white shadow-2xl">
             <h3 className="text-3xl font-black tracking-tighter mb-4">Confirm?</h3>
             <p className="text-slate-500 font-bold mb-12 text-balance">
                You are voting for <span className="text-brand-primary font-black underline decoration-brand-accent decoration-4">{selectedCandidate.name}</span>.
             </p>
              
             <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmVote}
                  disabled={isSubmitting}
                  className="w-full py-5 rounded-2xl font-black text-white bg-brand-primary hover:bg-brand-accent transition-all shadow-stacked"
                >
                  {isSubmitting ? "Submitting..." : "YES, I'M SURE"}
                </button>
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full py-4 rounded-2xl font-black text-brand-muted hover:text-brand-primary transition-colors"
                >
                  Go Back
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Success View (Water Splash style) */}
      {showSuccess && (
        <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-white/95 backdrop-blur-3xl animate-fade-in">
            <div className="text-center animate-scale-in">
                <div className="w-32 h-32 bg-brand-accent rounded-[40px] flex items-center justify-center mx-auto mb-10 shadow-2xl rotate-12">
                    <CheckCircle2 size={64} className="text-white" />
                </div>
                <h2 className="text-7xl font-black text-brand-primary tracking-tighter mb-4">VOTED!</h2>
                <p className="text-brand-accent font-black tracking-[0.4em] uppercase text-sm">Thank you for participating</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default VotingInterface;