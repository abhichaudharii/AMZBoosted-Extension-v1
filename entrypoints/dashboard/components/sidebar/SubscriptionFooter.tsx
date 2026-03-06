"use client";

import { cn } from "@/lib/utils"; // Ensure you have this utility or use clsx/tailwind-merge
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";

import { 
  Rocket, 
  Sparkles, 
  Clock, 
  CreditCard, 
  Crown, 
  ChevronRight 
} from "lucide-react";

// --- Types & Enums ---
import { SubscriptionState } from '@/lib/utils/subscription';

interface SubscriptionFooterProps {
  collapsed: boolean;
  subscriptionState: SubscriptionState;
  trialProgress?: {
    daysRemaining: number;
    percentage: number;
  };
  planDisplayName?: string;
  credits?: {
    used: number;
    total: number;
    resetsAt?: string;
  };
  periodEnd?: string | null;
  onNavigate: (path: string) => void;
  className?: string;
}

export function SubscriptionFooter({
  collapsed,
  subscriptionState,
  trialProgress,
  planDisplayName = "Pro Plan",
  credits,

  onNavigate,
  className,
}: SubscriptionFooterProps) {
    
  // Helper to format date


  // Calculate Credit Percentage
  const creditUsage = credits ? Math.min(100, Math.max(0, (credits.used / credits.total) * 100)) : 0;
  
  // Dynamic Color for Credits
  const getCreditColor = (percentage: number) => {
      if (percentage >= 90) return 'bg-red-500';
      if (percentage >= 70) return 'bg-yellow-500';
      return 'bg-green-500';
  };
  
  // Dynamic Color for Trial
  const getTrialColor = (days: number) => {
      if (days <= 3) return 'bg-red-500';
      if (days <= 7) return 'bg-orange-500';
      return 'bg-green-500'; // or primary color
  };

  return (
    <div className={cn(
      'transition-all duration-300',
      collapsed ? 'p-2' : 'p-4',
      className
    )}>
      
      {/* ==============================
          COLLAPSED STATE (Icons only)
         ============================== */}
      {collapsed ? (
        <div className="flex flex-col items-center gap-4">
          <TooltipProvider delayDuration={0}>
            
            {/* 1. Active Trial */}
            {subscriptionState === SubscriptionState.TRIAL_ACTIVE && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => onNavigate('/billing')}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B00] to-orange-700 flex items-center justify-center text-white shadow-[0_0_15px_-3px_rgba(255,107,0,0.5)] hover:scale-110 transition-transform cursor-pointer relative"
                  >
                    <Rocket className="w-5 h-5 fill-white/20" />
                    <span className="absolute top-0 right-0 flex h-3 w-3 -mt-1 -mr-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-[#1A1A1C]"></span>
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-[#1A1A1C] border-white/10 p-0 overflow-hidden ml-2 shadow-xl backdrop-blur-xl">
                  <div className="p-3 border-b border-white/5">
                    <p className="text-xs font-bold text-[#FF6B00]">Trial Active</p>
                    <p className="text-[10px] text-gray-400">
                       {trialProgress?.daysRemaining || 0} days remaining
                    </p>
                  </div>
                  <div className="p-2 bg-white/5">
                    <p className="text-[10px] text-center text-white font-bold">Click to Upgrade</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}

            {/* 2. No Plan / New User */}
            {subscriptionState === SubscriptionState.NO_PLAN && (
               <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => onNavigate('/billing')}
                    className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shadow-[0_0_15px_-3px_rgba(255,255,255,0.3)] hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Sparkles className="w-5 h-5 text-[#FF6B00]" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-[#1A1A1C] border-white/10 ml-2 text-white shadow-xl backdrop-blur-xl">
                  <p className="text-xs font-bold text-white">Start Free Trial</p>
                  <p className="text-[10px] text-gray-400">14 days unlimited access</p>
                </TooltipContent>
              </Tooltip>
            )}

             {/* 3. Expired / Past Due */}
            {(subscriptionState === SubscriptionState.TRIAL_EXPIRED || subscriptionState === SubscriptionState.PLAN_EXPIRED) && (
               <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={() => onNavigate('/billing')}
                    className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-[0_0_15px_-3px_rgba(220,38,38,0.5)] hover:scale-110 transition-transform cursor-pointer animate-pulse"
                  >
                    <Clock className="w-5 h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-red-950 border-red-500/20 ml-2 shadow-xl backdrop-blur-xl">
                  <p className="text-xs font-bold text-red-200">Action Required</p>
                  <p className="text-[10px] text-red-300">
                    {subscriptionState === SubscriptionState.PLAN_EXPIRED ? "Update Payment" : "Reactivate Access"}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      ) : (
        
        /* ==============================
           EXPANDED STATE (Full Cards)
           ============================== */
        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
           
           {/* 1. Active Trial */}
           {subscriptionState === SubscriptionState.TRIAL_ACTIVE && trialProgress && (
             <div className="relative p-4 rounded-xl bg-[#1A1A1C]/60 backdrop-blur-xl border border-[#FF6B00]/20 overflow-hidden group hover:border-[#FF6B00]/40 transition-all duration-500">
               <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <div className="absolute -right-12 -top-12 w-24 h-24 bg-[#FF6B00]/10 rounded-full blur-2xl group-hover:bg-[#FF6B00]/20 transition-all duration-500" />
               
               <div className="flex items-center gap-3 mb-3 relative z-10">
                 <div className="p-2 rounded-lg bg-[#FF6B00]/20 text-[#FF6B00] ring-1 ring-[#FF6B00]/30 group-hover:scale-110 transition-transform duration-300">
                   <Rocket className="w-4 h-4" />
                 </div>
                 <div>
                   <p className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-2">
                      Free Trial
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                   </p>
                   <p className="text-[10px] text-gray-400">Full access enabled</p>
                 </div>
               </div>

               <div className="mb-4 space-y-2 relative z-10">
                 <div className="flex justify-between text-[10px] font-medium">
                   <span className="text-gray-400">Time Remaining</span>
                   <span className="text-[#FF6B00] font-mono">
                     {trialProgress?.daysRemaining ?? 0} days
                   </span>
                 </div>
                 {/* Inline Progress Bar */}
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                   <div 
                     className={cn("h-full transition-all duration-500 ease-out shadow-[0_0_5px_rgba(255,107,0,0.5)]", getTrialColor(trialProgress?.daysRemaining ?? 0))}
                     style={{ width: `${trialProgress?.percentage ?? 0}%` }}
                   />
                 </div>
               </div>
               
               <Button 
                 size="sm" 
                 onClick={() => onNavigate('/billing')}
                 className="w-full bg-[#FF6B00] hover:bg-[#FF8533] text-white font-bold h-9 text-xs shadow-lg shadow-orange-500/20 relative z-10 overflow-hidden group/btn border-0"
               >
                 <span className="relative z-10 flex items-center justify-center gap-2">
                    Upgrade Plan <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform"/>
                 </span>
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
               </Button>
             </div>
           )}


           {/* 2. Can Start Trial (No Plan) */}
           {subscriptionState === SubscriptionState.NO_PLAN && (
             <div className="relative p-4 rounded-xl bg-gradient-to-b from-[#1A1A1C] to-black/40 border border-white/5 hover:border-[#FF6B00]/30 transition-all duration-300 group backdrop-blur-xl">
                 <div className="absolute top-0 right-0 p-2 opacity-30 group-hover:opacity-100 transition-opacity">
                     <Sparkles className="w-10 h-10 text-[#FF6B00]/20" />
                 </div>
               
               <div className="relative z-10">
                     <div className="flex items-center gap-3 mb-3">
                       <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                           <Sparkles className="w-4 h-4 text-[#FF6B00] fill-[#FF6B00]/20 animate-pulse" />
                       </div>
                       <h4 className="text-sm font-bold text-white group-hover:text-[#FF6B00] transition-colors">Pro Features</h4>
                   </div>
                   <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                       Experience the full power of AMZBoosted. 14 days free.
                   </p>
                   <Button 
                     size="sm"
                     onClick={() => onNavigate('/billing')}
                     className="w-full bg-white text-black hover:bg-gray-200 font-bold h-9 text-xs transition-transform hover:scale-[1.02] active:scale-[0.98]"
                   >
                       Start Free Trial
                   </Button>
               </div>
             </div>
           )}

           {/* 3. Trial Expired */}
           {subscriptionState === SubscriptionState.TRIAL_EXPIRED && (
             <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 relative overflow-hidden group hover:bg-red-950/30 transition-colors backdrop-blur-xl">
               <div className="flex items-center gap-2 mb-2 text-red-500">
                 <Clock className="w-4 h-4" />
                 <span className="text-xs font-bold uppercase">Trial Expired</span>
               </div>
               <p className="text-xs text-gray-400 mb-3">
                 Reactivate now to restore your data and access.
               </p>
               <Button 
                 size="sm" 
                 onClick={() => onNavigate('/billing')}
                 className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-9 text-xs animate-pulse hover:animate-none border-0"
               >
                 Reactivate Access
               </Button>
             </div>
           )}

           {/* 4. Past Due */}
           {subscriptionState === SubscriptionState.PLAN_EXPIRED && (
             <div className="p-4 rounded-xl bg-yellow-900/20 border border-yellow-500/20 hover:border-yellow-500/40 transition-all backdrop-blur-xl">
               <div className="flex items-center gap-2 mb-2 text-yellow-500">
                 <CreditCard className="w-4 h-4" />
                 <span className="text-xs font-bold uppercase">Payment Failed</span>
               </div>
               <p className="text-xs text-gray-400 mb-3">
                 Update payment method to continue using the platform.
               </p>
               <Button 
                 size="sm" 
                 onClick={() => onNavigate('/billing')}
                 className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold h-9 text-xs border-0"
               >
                 Update Payment
               </Button>
             </div>
           )}

           {/* 5. Active Plan */}
           {subscriptionState === SubscriptionState.PLAN_ACTIVE && (
             <div 
               className="relative rounded-xl p-4 overflow-hidden border border-white/5 bg-[#1A1A1C]/40 backdrop-blur-xl hover:bg-[#1A1A1C]/60 transition-all cursor-pointer group"
               onClick={() => onNavigate('/billing')}
             >
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

               <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-3">
                   <div className="p-2 rounded-lg bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20">
                     <Crown className="h-4 w-4" />
                   </div>
                   <div>
                     <h3 className="font-bold text-sm text-white">{planDisplayName}</h3>
                     <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                         Active
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                     </p>
                   </div>
                 </div>
                 
                 {/* Credits Progress Bar */}
                 {credits && (
                     <div className="space-y-2 mb-1">
                         <div className="flex items-center justify-between text-[10px] font-medium">
                             <span className="text-gray-400">Credits Used</span>
                             <span className={cn(
                                 "font-mono",
                                 creditUsage >= 90 ? "text-red-500" : 
                                 creditUsage >= 70 ? "text-yellow-500" : "text-white"
                             )}>
                                 {credits?.used.toLocaleString() ?? 0} <span className="text-gray-500">/ {credits?.total.toLocaleString() ?? 0}</span>
                             </span>
                         </div>
                         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                             <div 
                                 className={cn("h-full transition-all duration-500 ease-out shadow-[0_0_5px_rgba(255,255,255,0.2)]", getCreditColor(creditUsage))}
                                 style={{ width: `${creditUsage}%` }}
                             />
                         </div>
                     </div>
                 )}
               </div>
             </div>
           )}
        </div>
      )}
    </div>
  );
}