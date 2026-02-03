import React, { useState, useEffect } from 'react';
import { CATEGORIES, CANDIDATES } from '../constants';
import { CategoryId, Candidate } from '../types';
import { castVote, hasVotedInCategory } from '../services/voteService';
import { CheckCircle2, ChevronRight, Lock, Sparkles, X, Heart, Star, Crown, Zap } from 'lucide-react';

interface VotingInterfaceProps {
  onAdminClick: () => void;
}

// Trigger Confetti
const triggerConfetti = async () => {
  const confetti = (await import('canvas-confetti')).default;
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999
  };

  function fire(particleRatio: number, opts: any) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio)
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55 });

  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
};

// Sub-component for efficient image loading
const LazyImageCard = ({ candidate, onClick, isVoted, gradient, index }: any) => {
    const [isLoaded, setIsLoaded] = useState(false);
    
    return (
        <div 
            onClick={onClick}
            className={`
            relative group rounded-3xl overflow-hidden cursor-pointer bg-white border-4 border-black shadow-neo transform transition-transform duration-150
            ${isVoted ? 'opacity-50 grayscale pointer-events-none' : 'active:scale-95 hover:-translate-y-1 hover:shadow-neo-xl hover:rotate-1 md:animate-float'}
            `}
            style={{ 
                animationDuration: `${6 + Math.random()}s`
            }}
        >
            {/* Image Container */}
            <div className="aspect-[4/5] bg-yellow-100 relative overflow-hidden rounded-xl m-2 border-2 border-black">
            {/* Skeleton Loader */}
            {!isLoaded && (
                <div className="absolute inset-0 bg-yellow-200 animate-pulse z-0" />
            )}
            
            <img 
                src={candidate.imageUrl} 
                alt={candidate.name}
                className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                onLoad={() => setIsLoaded(true)}
            />
            
            {/* Number Badge */}
            <div className="absolute top-2 left-2 bg-white text-black text-xs font-black px-2 py-1 rounded-lg border-2 border-black shadow-neo-sm z-10 transform -rotate-6">
                #{candidate.number}
            </div>
            </div>
            
            <div className="p-3 text-center">
            <h3 className="text-black font-extrabold text-lg leading-relaxed py-1">{candidate.name}</h3>
            <p className="text-black text-xs font-bold uppercase tracking-wider bg-yellow-300 inline-block px-3 py-1 rounded-full border-2 border-black mt-2 group-hover:bg-yellow-400 transition-colors transform rotate-1">
                {candidate.class}
            </p>
            </div>
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
      setShowConfirmModal(false); // Close confirmation immediately
      setShowSuccess(true);
      triggerConfetti(); // 🎉
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedCandidate(null);
      }, 3500); // Slightly longer to enjoy confetti
    } else {
      alert(result.error || 'Failed to submit vote.');
      setShowConfirmModal(false);
    }
    setIsSubmitting(false);
  };

  const filteredCandidates = CANDIDATES.filter(c => c.categoryId === activeCategory);
  const currentCategory = CATEGORIES.find(c => c.id === activeCategory);
  
  // Dynamic gradient based on category (Cartoony flat colors)
  const getGradient = (catId: string) => {
    switch(catId) {
      case CategoryId.KING: return 'from-blue-400 to-blue-500';
      case CategoryId.QUEEN: return 'from-pink-400 to-pink-500';
      case CategoryId.MISTER: return 'from-teal-400 to-teal-500';
      case CategoryId.MISS: return 'from-purple-400 to-purple-500';
      default: return 'from-slate-400 to-slate-600';
    }
  };
  
  const getCategoryColor = (catId: string) => {
     switch(catId) {
      case CategoryId.KING: return 'bg-cartoon-blue';
      case CategoryId.QUEEN: return 'bg-cartoon-red';
      case CategoryId.MISTER: return 'bg-cartoon-green';
      case CategoryId.MISS: return 'bg-cartoon-purple';
      default: return 'bg-slate-400';
    }
  }

  const getIcon = (catId: string) => {
    switch(catId) {
      case CategoryId.KING: return <Crown size={16} className="text-black fill-white" />;
      case CategoryId.QUEEN: return <Star size={16} className="text-black fill-white" />;
      case CategoryId.MISTER: return <Zap size={16} className="text-black fill-white" />;
      case CategoryId.MISS: return <Heart size={16} className="text-black fill-white" />;
      default: return <Sparkles size={16} />;
    }
  }

  const activeColor = getCategoryColor(activeCategory);
  const activeGradient = getGradient(activeCategory); // Keep for some gradient usages

  return (
    <div className="min-h-screen relative overflow-x-hidden font-sans pb-32">
      
      {/* Background Decorative Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-50">
        <div className="absolute top-10 -left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob border-4 border-transparent"></div>
        <div className="absolute top-10 -right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Sticky Header with Blur */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b-4 border-black shadow-sm transition-all duration-300 pt-2 pb-1">
        <div className="max-w-md mx-auto w-full">
            <div className="px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className={`${activeColor} p-2 rounded-xl text-white border-2 border-black shadow-neo-sm transition-all duration-500 hover:scale-110`}>
                       <Sparkles size={20} className="animate-pulse-fast text-black fill-white" />
                    </div>
                    <div className="flex flex-col">
                    <h1 className="text-2xl font-black text-black leading-none tracking-tight drop-shadow-sm">
                        CEIT Fresher Welcome!!!
                    </h1>
                    <span className="text-xs uppercase font-bold text-black tracking-widest bg-yellow-300 p-1 mt-1 rounded-sm transform -rotate-1 inline-block w-max border border-black">Voteလိုက်နော်</span>
                    </div>
                </div>
                <button onClick={onAdminClick} className="text-black hover:text-indigo-600 transition-colors bg-white p-2 rounded-full border-2 border-black shadow-neo-sm hover:shadow-neo active:translate-y-1 active:shadow-none">
                    <Lock size={18} />
                </button>
            </div>
            
            {/* Category Selector with Fixed Height Container to prevent jumping */}
            <div className="relative w-full">
                <div className="flex overflow-x-auto no-scrollbar gap-4 px-4 items-center pt-4 pb-4 snap-x">
                    {CATEGORIES.map(cat => {
                    const isVoted = votedCategories[cat.id];
                    const isActive = activeCategory === cat.id;
                    const catColor = getCategoryColor(cat.id);
                    
                    return (
                        <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`
                            relative whitespace-nowrap px-6 py-3 rounded-2xl text-base font-black transition-all duration-200 flex items-center gap-2 flex-shrink-0 border-2 border-black snap-center
                            ${isActive 
                            ? `${catColor} text-black shadow-neo scale-105 z-10 transform -rotate-2` 
                            : 'bg-white text-slate-500 hover:bg-slate-50'
                            }
                            ${isVoted && !isActive ? 'opacity-60 grayscale' : ''}
                            active:scale-95 active:shadow-none active:translate-y-1
                        `}
                        >
                        {getIcon(cat.id)}
                        {cat.label}
                        </button>
                    );
                    })}
                    {/* Large spacer to ensure last item is fully visible and touchable */}
                    <div className="w-4 flex-shrink-0"></div>
                </div>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 mt-8">
        {!isSystemOpen ? (
            <div className="text-center py-12 px-6 bg-white rounded-3xl border-4 border-black shadow-neo animate-slide-up">
                <div className="inline-block bg-yellow-300 p-5 rounded-full border-2 border-black shadow-neo mb-6 animate-bounce">
                    <Lock size={48} className="text-black" />
                </div>
                <h2 className="text-3xl font-black text-black mb-3 tracking-tight">VOTING CLOSED</h2>
                <p className="text-slate-600 font-bold mb-6">
                    The voting lines are currently paused. Please wait for the admin to open them.
                </p>
                <div className="inline-block bg-slate-100 px-4 py-2 rounded-xl border-2 border-black font-mono text-xs font-bold text-slate-400">
                    STATUS: <span className="text-red-500">LOCKED</span>
                </div>
            </div>
        ) : (
            <>
                <div className="mb-8 text-center animate-fade-in">
                {votedCategories[activeCategory] ? (
                    <div className="bg-emerald-100 inline-flex items-center gap-2 px-6 py-3 rounded-full text-black font-black border-2 border-black shadow-neo animate-pulse-fast text-lg">
                        <CheckCircle2 size={24} className="text-emerald-600 fill-white" /> VOTE REGISTERED!
                    </div>
                ) : (
                    <p className="text-black font-bold bg-white inline-block px-5 py-2 rounded-full text-base border-2 border-black shadow-neo-sm transform rotate-1">
                    👇 ပုံလေးနှိပ်ပြီး Vote ပါ သူငယ်ချင်း
                    </p>
                )}
                </div>

                <div className="grid grid-cols-2 gap-4 pb-10">
                {filteredCandidates.map((candidate, idx) => (
                    <LazyImageCard 
                        key={candidate.id}
                        candidate={candidate}
                        index={idx}
                        isVoted={votedCategories[activeCategory]}
                        onClick={() => handleVote(candidate)}
                        gradient={activeGradient}
                    />
                ))}
                </div>
            </>
        )}
      </main>

      {/* Fun Expanded Profile Modal */}
      {selectedCandidate && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-0 sm:p-4" 
          onClick={() => setSelectedCandidate(null)}
        >
          <div 
            className="bg-white w-full max-w-sm sm:rounded-3xl rounded-t-3xl shadow-2xl animate-slide-up flex flex-col max-h-[90vh] overflow-hidden relative border-4 border-black"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedCandidate(null)}
              className="absolute top-4 right-4 z-20 bg-white hover:bg-slate-100 text-black p-2 rounded-full border-2 border-black shadow-neo transition-all hover:rotate-90"
            >
                <X size={24} />
            </button>

            {/* Image */}
            <div className="w-full aspect-square relative shrink-0 bg-yellow-50 group border-b-4 border-black">
               <img 
                 src={selectedCandidate.imageUrl} 
                 className="w-full h-full object-cover"
                 alt={selectedCandidate.name}
               />
               <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-white via-white/80 to-transparent" />
            </div>

            {/* Content */}
            <div className="p-6 pt-0 flex flex-col relative z-10 -mt-10 overflow-y-auto no-scrollbar">
               <div className="text-center">
                 <span className={`inline-block px-4 py-1.5 mt-1 rounded-full text-md font-black text-black ${activeColor} mb-3 border-2 border-black shadow-neo transform -rotate-2`}>
                    #{selectedCandidate.number}
                 </span>
                 <h3 className="text-4xl font-black text-black leading-snug mb-4 drop-shadow-sm">
                    {selectedCandidate.name}
                 </h3>
               </div>

               <div className="mt-auto space-y-3 pb-4">
                  <button
                    onClick={handleInitiateVote}
                    className={`
                      w-full py-4 rounded-2xl font-black text-white ${activeColor} border-4 border-black shadow-neo-xl
                      hover:translate-y-1 hover:shadow-neo active:shadow-none transition-all flex items-center justify-center gap-2 text-xl animate-pulse-fast
                    `}
                  >
                    <Star className="text-black fill-white" size={24} /> VOTE NOW
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedCandidate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xs p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] animate-slide-up relative overflow-hidden">
             
            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-24 h-24 rounded-full border-4 border-black shadow-neo mb-4 overflow-hidden bg-slate-100">
                 <img src={selectedCandidate.imageUrl} className="w-full h-full object-cover" />
              </div>
              
              <h3 className="text-3xl font-black text-black mb-3">ပေးမှာသေချာပြီလား</h3>
              <p className="text-slate-600 text-sm mb-6 font-bold bg-yellow-100 px-3 py-1 border-2 border-black rounded-lg transform rotate-1">
                Voting for <span className="text-black font-black">{selectedCandidate.name}</span>
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-black bg-slate-200 border-2 border-black shadow-neo hover:translate-y-1 hover:shadow-none transition-all"
                >
                  Nope
                </button>
                <button 
                  onClick={confirmVote}
                  disabled={isSubmitting}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-white ${activeColor} border-2 border-black shadow-neo hover:translate-y-1 hover:shadow-none transition-all flex justify-center items-center`}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-4 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "YAAAS!"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Overlay - Confetti Style */}
      {showSuccess && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowSuccess(false)}>
          <div className="text-center p-8 max-w-xs w-full animate-slide-up relative bg-white border-4 border-black rounded-3xl shadow-neo-xl">
            
            <div className="relative">
                <div className="w-24 h-24 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-black shadow-neo animate-bounce-small">
                <CheckCircle2 size={48} className="text-black fill-white" />
                </div>
                <h2 className="text-4xl font-black text-black mb-2 tracking-tight">VOTED!</h2>
                <p className="text-black font-bold bg-yellow-300 inline-block px-3 py-1 border-2 border-black transform -rotate-2">You're awesome!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingInterface;