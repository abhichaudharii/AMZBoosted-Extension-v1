import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LogIn, UserPlus, ArrowRight, Sparkles, Crown, CheckCircle2, Globe } from 'lucide-react';
import { toast } from 'sonner';

const getLogoUrl = () => {
  // Use extension-specific URL if in production, fallback for dev
  try {
    return chrome.runtime.getURL('icon/128.png');
  } catch (e) {
    return '/amzboosted_logo.png';
  }
};

export const LoginScreen: React.FC = () => {
  const handleLogin = async () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: 'https://amzboosted.com/sign-in' });
    } else {
      window.open('https://amzboosted.com/sign-in', '_blank');
    }
    
    toast.info('Opening secure login...', {
      description: 'The extension will sync once you sign in on the portal.',
    });
  };

  const handleSignUp = async () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: 'https://amzboosted.com/sign-up' });
    } else {
      window.open('https://amzboosted.com/sign-up', '_blank');
    }

    toast.info('Starting your journey...', {
      description: 'Create an account to activate your 14-day trial.',
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#050505] text-slate-50 selection:bg-primary/30">
      
      {/* Background Decorative Accents */}
      <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[90px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-10%] w-[200px] h-[200px] bg-amber-500/5 rounded-full blur-[70px] -z-10 pointer-events-none" />

      <div className="w-full max-w-[340px] space-y-8 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Brand Header */}
        <div className="text-center space-y-4">
          <div className="relative inline-block group">
            {/* Soft Glow */}
            <div className="absolute inset-0 bg-primary/25 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* Glass Logo Container */}
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-b from-white/10 to-white/[0.02] backdrop-blur-2xl border border-white/20 shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:border-primary/40">
               <img 
                  src={getLogoUrl()} 
                  alt="AMZBoosted" 
                  className="w-11 h-11 object-contain filter drop-shadow-md" 
               />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black tracking-tighter bg-gradient-to-br from-white via-white to-white/50 bg-clip-text text-transparent">
              AMZBoosted
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-primary">
              The Elite Edge OS
            </p>
          </div>
          
          <p className="text-lg text-slate-100 font-extrabold leading-tight px-4">
             Stop Guessing. <br/> <span className="text-primary">Start Dominating.</span>
          </p>
        </div>

        {/* Auth Card */}
        <Card className="border-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] bg-white/[0.03] backdrop-blur-3xl overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          <CardHeader className="pb-0 pt-8 text-center space-y-1">
            <CardTitle className="text-xl font-bold tracking-tight">Level Up Your Business</CardTitle>
            <CardDescription className="text-xs text-slate-400 font-medium">
              Sync your extension to get started
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 px-6 pb-8 mt-6">
            
            {/* Premium Trial Box */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:bg-white/[0.04]">
                <div className="absolute -top-6 -right-6 p-2 opacity-10">
                    <Sparkles className="w-12 h-12 text-primary blur-sm" />
                </div>
                <div className="relative z-10 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Crown className="w-3 h-3" /> 
                        Elite Trial Active
                    </p>
                    <ul className="text-[11px] text-slate-300 space-y-2.5 font-bold">
                        <li className="flex items-center gap-3">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            <span>Zero-Link™ Discovery</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            <span>Privacy Fortress™ Protection</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            <span>Unrestricted ASIN-X Access</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                onClick={handleLogin} 
                className="w-full h-12 text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-[0_10px_20px_-10px_rgba(var(--primary),0.3)] hover:-translate-y-0.5 active:translate-y-0"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign In to Connect
              </Button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/5" />
                </div>
                <div className="relative flex justify-center text-[9px] uppercase tracking-widest">
                  <span className="bg-[#0b0b0b] px-3 text-slate-600 font-bold">New Partner?</span>
                </div>
              </div>

              <Button 
                onClick={handleSignUp} 
                variant="ghost" 
                className="w-full text-center h-12 text-sm font-bold text-slate-300 hover:text-white hover:bg-white/5 border border-white/5 transition-all group"
              >
                <UserPlus className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                Start Free Trial
                <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Button>
            </div>

            {/* Footer */}
            <div className="pt-2 text-center space-y-3">
                <div className="h-px w-8 bg-white/10 mx-auto" />
                <a
                  href="https://amzboosted.com"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-[10px] text-slate-500 font-bold hover:text-primary transition-colors"
                >
                  <Globe className="w-3 h-3" /> amzboosted.com
                </a>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};