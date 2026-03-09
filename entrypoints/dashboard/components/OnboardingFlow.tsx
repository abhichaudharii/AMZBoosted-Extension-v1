import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Zap,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Rocket,
  Shield,
  Layers,
  BrainCircuit,
  Workflow,
  Lock,
} from 'lucide-react';
import { secureStorage } from '@/lib/storage/secure-storage';
import confetti from 'canvas-confetti';

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

export const OnboardingFlow: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const result = await secureStorage.get('onboardingCompleted');
      if (!result.onboardingCompleted) {
        setTimeout(() => setOpen(true), 1200);
      }
    } catch (e) {
      setTimeout(() => setOpen(true), 1200);
    }
  };

  const steps: OnboardingStep[] = [
    // 1. THE INTELLIGENCE LAYER (VISION)
    {
      id: 'vision',
      title: 'Intelligence Layer',
      subtitle: 'Precision Automation for Amazon Dominance',
      icon: Zap,
      content: (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-1000">
           <div className="relative text-center py-4">
              <div className="absolute inset-0 bg-gradient-to-b from-[#FF6B00]/10 to-transparent rounded-full blur-3xl opacity-50" />
              <div className="relative inline-flex mb-4">
                 <div className="p-4 rounded-[1.5rem] bg-gradient-to-br from-[#1A1A1C] to-[#0A0A0B] border border-white/10 shadow-2xl group-hover:scale-110 transition-transform">
                    <img 
                        src="/amzboosted_logo.png" 
                        alt="AMZBoosted" 
                        className="h-10 w-10 object-contain" 
                    />
                 </div>
              </div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Move Faster, Sell Smarter</h3>
              <p className="text-zinc-400 text-sm max-w-[320px] mx-auto leading-relaxed">
                AMZBoosted isn't just a tool; it's the intelligence layer that sits between you and raw Amazon data.
              </p>
           </div>
           <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Data Fidelity', icon: Shield, val: 'High' },
                { label: 'Automation', icon: Workflow, val: 'Auto' },
                { label: 'Privacy', icon: Lock, val: '100%' }
              ].map((stat, i) => (
                <div key={i} className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center space-y-1">
                   <stat.icon className="w-4 h-4 text-[#FF6B00] mx-auto mb-1" />
                   <div className="text-[10px] font-black text-white/50 uppercase tracking-tighter">{stat.label}</div>
                   <div className="text-xs font-bold text-white">{stat.val}</div>
                </div>
              ))}
           </div>
        </div>
      )
    },
    // 2. ASIN-X EXPLORER (DATA DEPTH)
    {
      id: 'asin-x',
      title: 'ASIN-X Voyager',
      subtitle: 'Unlimited Data Depth with Near-Zero Errors',
      icon: Layers,
      content: (
        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-700">
           <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
              <div className="flex gap-4">
                 <div className="p-3 rounded-2xl bg-[#0A0A0B] border border-white/10 text-blue-400">
                    <Rocket className="w-6 h-6" />
                 </div>
                 <div>
                    <h4 className="text-base font-bold text-white mb-1">High-Fidelity Reports</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">Extract exhaustive ASIN variables, child relationships, and inventory health in professional XLSX formats.</p>
                 </div>
              </div>
           </div>
           <div className="space-y-3">
              <div className="text-[10px] font-black text-blue-400/80 uppercase tracking-[0.2em] px-2 text-center">Engineered for Accuracy</div>
              <div className="grid grid-cols-1 gap-2">
                 {[
                   'Exhaustive 48+ variable extraction',
                   'Near-zero data loss on complex listings',
                   'Native Excel formatting with direct downloads'
                 ].map((item, i) => (
                   <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                      <span className="text-xs text-zinc-300 font-medium">{item}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )
    },
    // 3. RUFUS AI (SENTIMENT)
    {
      id: 'rufus',
      title: 'Rufus AI Agent',
      subtitle: 'Decode Human Intent & Sentiment Instantly',
      icon: BrainCircuit,
      content: (
        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-700">
           <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
              <div className="flex gap-4 relative z-10">
                 <div className="p-3 rounded-2xl bg-[#0A0A0B] border border-white/10 text-purple-400">
                    <Sparkles className="w-6 h-6" />
                 </div>
                 <div>
                    <h4 className="text-base font-bold text-white mb-1">Human Sentiment Layer</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">Rufus analyzes thousands of reviews to extract winning strategies and critical flaws in any product niche.</p>
                 </div>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-3">
              {[
                { t: 'Review Analysis', d: 'Summarize top complaints' },
                { t: 'Q&A Mining', d: 'Find buyer objections' }
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                   <div className="text-xs font-bold text-white">{item.t}</div>
                   <div className="text-[10px] text-zinc-500 leading-snug">{item.d}</div>
                </div>
              ))}
           </div>
        </div>
      )
    },
    // 4. THE ENGINE (AUTOMATION)
    {
      id: 'engine',
      title: 'Advanced Engine',
      subtitle: 'Multi-Task & Schedule While You Sleep',
      icon: Workflow,
      content: (
        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-700">
           <div className="relative group">
              <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0" />
              <div className="flex gap-4 p-5 rounded-3xl bg-emerald-500/[0.03]">
                 <div className="p-3 rounded-2xl bg-[#0A0A0B] border border-white/10 text-emerald-400">
                    <Calendar className="w-6 h-6" />
                 </div>
                 <div>
                    <h4 className="text-base font-bold text-white mb-1">True Background Execution</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">Close your tabs, focus on work, or go to sleep. AMZBoosted runs your complex scans in the background at scheduled intervals.</p>
                 </div>
              </div>
           </div>
           <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Parallel Scan Engine Active</span>
           </div>
        </div>
      )
    },
    // 5. SECURITY & CREDITS
    {
      id: 'security',
      title: 'Trust & Transparency',
      subtitle: 'Zero-Storage Auth & Transparent Credits',
      icon: Shield,
      content: (
        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-700">
           <div className="grid grid-cols-1 gap-3">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex gap-4 items-center">
                 <Lock className="w-5 h-5 text-amber-400" />
                 <div>
                    <div className="text-sm font-bold text-white">Browser-Only Auth</div>
                    <div className="text-[11px] text-zinc-500">Your Amazon credentials never leave your machine.</div>
                 </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex gap-4 items-center">
                 <Zap className="w-5 h-5 text-[#FF6B00]" />
                 <div>
                    <div className="text-sm font-bold text-white">Credit Based Consumption</div>
                    <div className="text-[11px] text-zinc-500">No hidden costs. Pay only for the data you extract.</div>
                 </div>
              </div>
           </div>
           <div className="text-center p-4">
              <p className="text-[10px] text-zinc-600 font-medium">Enterprise-grade security standards for Amazon Sellers of all sizes.</p>
           </div>
        </div>
      )
    },
    // 6. READY (Success)
    {
      id: 'ready',
      title: 'Launch Activation',
      subtitle: 'Start Dominating the Marketplace',
      icon: Rocket,
      content: (
        <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-700">
           <div className="relative p-10 rounded-[2.5rem] bg-gradient-to-br from-[#FF6B00] to-[rgb(230,81,0)] text-white shadow-2xl overflow-hidden text-center">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
              <div className="relative z-10 space-y-2">
                 <h3 className="text-4xl font-black tracking-tighter shadow-sm">14 DAYS</h3>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Premium Access Granted</p>
                 <div className="pt-4">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase">Start Building Your Empire</div>
                 </div>
              </div>
           </div>
           <div className="text-center">
              <p className="text-xs text-zinc-400 italic">"The elite suite for the intelligent Amazon seller."</p>
           </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const fireConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const handleClose = async (isOpen: boolean) => {
    if (!isOpen) {
        try {
            await secureStorage.set({ onboardingCompleted: true });
        } catch (e) {}
    }
    setOpen(isOpen);
  };

  const handleSkip = () => handleClose(false);

  const handleComplete = async () => {
    try {
      await secureStorage.set({ onboardingCompleted: true });
    } catch (e) {}
    setCompleted(true);
    fireConfetti();
    setTimeout(() => {
      setOpen(false);
      setCompleted(false);
    }, 3000);
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[420px] p-0 overflow-hidden border border-white/10 shadow-2xl bg-[#0A0A0B]/95 backdrop-blur-3xl rounded-[2rem]">
        {completed ? (
          <div className="flex flex-col items-center justify-center py-24 px-8 text-center bg-gradient-to-b from-[#FF6B00]/10 to-transparent">
            <div className="relative mb-10 animate-in zoom-in-95 duration-1000">
              <div className="absolute inset-x-0 -inset-y-4 bg-[#FF6B00]/40 blur-[80px] rounded-full animate-pulse" />
              <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-[1.5rem] bg-gradient-to-br from-[#FF6B00] via-[#E65100] to-[#FF6B00] shadow-2xl shadow-[#FF6B00]/50 transform rotate-12">
                <CheckCircle2 className="h-12 w-12 text-white -rotate-12" />
              </div>
            </div>

            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <DialogTitle className="text-4xl font-black text-white tracking-tighter">
                You're All Set! 🚀
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-sm max-w-[300px] mx-auto leading-relaxed">
                Welcome to the elite tier of Amazon intelligence. Your dashboard is now active.
              </DialogDescription>
            </div>
            
            <div className="mt-12 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em]">Initializing Suite</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full min-h-[620px] relative">
            {/* Header / Nav Overlay */}
            <div className="absolute top-0 left-0 right-0 z-30 px-6 pt-6 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-[#FF6B00] transition-all duration-700 ease-out" 
                            style={{ width: `${progress}%` }} 
                        />
                    </div>
                    <span className="text-[10px] font-black text-white/40">{currentStep + 1} / {steps.length}</span>
                 </div>
                 <button 
                    onClick={handleSkip}
                    className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                 >
                    Skip Tour
                 </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col pt-20 px-6 pb-6 overflow-y-auto">
               <div className="mb-6">
                  <h2 className="text-xs font-black text-[#FF6B00] uppercase tracking-[0.4em] mb-2">Step {currentStep + 1}</h2>
                  <DialogTitle className="text-3xl font-black text-white tracking-tight leading-none mb-2">{step.title}</DialogTitle>
                  <DialogDescription className="text-xs text-zinc-500 font-medium">{step.subtitle}</DialogDescription>
               </div>

               <div className="flex-1">
                  {step.content}
               </div>
            </div>

            <div className="p-6 pt-0 relative z-10">
               <Button
                 onClick={handleNext}
                 className="w-full h-14 text-base font-black shadow-2xl shadow-[#FF6B00]/20 hover:shadow-3xl hover:shadow-[#FF6B00]/40 transition-all duration-300 hover:-translate-y-1 bg-white text-[#0A0A0B] rounded-2xl group overflow-hidden"
               >
                 <div className="absolute inset-0 bg-gradient-to-r from-zinc-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
                 <span className="relative z-10 flex items-center justify-center gap-3">
                    {currentStep < steps.length - 1 ? (
                        <>
                             Continue to {steps[currentStep + 1].id === 'asin-x' ? 'Intelligence' : steps[currentStep + 1].id === 'rufus' ? 'Sentiment' : steps[currentStep + 1].id === 'engine' ? 'Automation' : steps[currentStep + 1].id === 'security' ? 'Security' : 'Launch'}
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                    ) : (
                        <>
                            Enter AMZBoosted
                            <Rocket className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                        </>
                    )}
                 </span>
               </Button>
            </div>
            
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
