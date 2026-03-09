import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle2, LogIn, UserPlus, Crown, ArrowRight, Zap, Globe } from 'lucide-react';
import { toast } from 'sonner';

const getLogoUrl = () => {
  try {
    return chrome.runtime.getURL('icon/128.png');
  } catch (e) {
    return '/icon/128.png';
  }
};

export const AuthPage: React.FC = () => {
  const handleLogin = async () => {
    window.open('https://amzboosted.com/sign-in', '_blank');
    toast.info('Redirecting to secure login...', {
      description: 'Sign in on our portal. Your extension will sync automatically.',
    });
  };

  const handleSignUp = async () => {
    window.open('https://amzboosted.com/sign-up', '_blank');
    toast.info('Creating your workspace...', {
      description: 'Complete registration on the website to unlock your 14-day trial.',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 md:p-12 bg-[#050505] text-slate-50 selection:bg-primary/30">
      
      {/* Refined Geometric Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10 animate-in fade-in zoom-in-95 duration-1000">
        
        {/* --- LEFT SIDE: Branding & Professional Proof --- */}
        <div className="space-y-12">
          
          <div className="space-y-6">
            <div className="flex items-center gap-5 group">
              <div className="relative h-20 w-20 flex items-center justify-center rounded-2xl bg-gradient-to-b from-white/10 to-transparent backdrop-blur-2xl border border-white/20 shadow-2xl transition-all duration-500 group-hover:border-primary/50 group-hover:shadow-primary/20">
                 <img 
                    src={getLogoUrl()} 
                    alt="AMZBoosted" 
                    className="h-12 w-12 object-contain filter drop-shadow-md" 
                 />
              </div>
              <div>
                <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent">
                  AMZBoosted
                </h1>
                <div className="flex items-center gap-2 mt-2">
                   <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold bg-primary/20 text-primary border border-primary/30">
                     Elite Edge OS
                   </span>
                </div>
              </div>
            </div>
            <p className="text-[28px] text-slate-100 font-extrabold leading-[1.1] max-w-lg tracking-tight">
              Stop Guessing. <span className="text-primary">Start Dominating</span> the Buy Box.
            </p>
            <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-md">
              The professional automation suite for Amazon sellers who demand precision, speed, and privacy.
            </p>
          </div>

          <div className="grid gap-8">
            <div className="group flex items-start gap-5 p-5 rounded-2xl border border-transparent hover:border-white/5 hover:bg-white/[0.02] transition-all duration-500">
              <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-500">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Zero-Link™ Discovery</h3>
                <p className="text-sm text-slate-400 leading-relaxed mt-1">
                  No complex API linking or MWS tokens. Our extension instantly detects your Marketplaces and Accounts the moment you log in to Seller Central.
                </p>
              </div>
            </div>

            <div className="group flex items-start gap-5 p-5 rounded-2xl border border-transparent hover:border-white/5 hover:bg-white/[0.02] transition-all duration-500">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform duration-500">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">The Privacy Fortress</h3>
                <p className="text-sm text-slate-400 leading-relaxed mt-1">
                  Your business data belongs on your PC. AMZBoosted processes everything locally with AES-256 encryption. We never scrape your sensitive data to our servers.
                </p>
              </div>
            </div>

            <div className="group flex items-start gap-5 p-5 rounded-2xl border border-transparent hover:border-white/5 hover:bg-white/[0.02] transition-all duration-500">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform duration-500">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Background Automation</h3>
                <p className="text-sm text-slate-400 leading-relaxed mt-1">
                  Run SQP Deep Dives and ASIN-X reports in the background while you focus on high-level strategy. Close the tab—we'll finish the job.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT SIDE: Unified Auth Experience --- */}
        <div className="relative lg:ml-auto w-full max-w-[440px]">
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 via-transparent to-amber-500/10 rounded-[2rem] blur-3xl opacity-50" />
            
            <Card className="relative overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border-white/10 bg-slate-950/40 backdrop-blur-3xl">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            <CardHeader className="text-center pb-6 pt-10">
                <CardTitle className="text-3xl font-black tracking-tight">Scale Smarter</CardTitle>
                <CardDescription className="text-slate-400 font-medium">
                  Connect your extension to get started.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 px-10 pb-10">
                
                {/* Premium Trial Highlight */}
                <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:bg-white/[0.05]">
                  <div className="absolute -top-12 -right-12 h-24 w-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
                  <div className="relative z-10 space-y-4">
                      <p className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                          <Crown className="w-3.5 h-3.5" /> 
                          Premium Trial Active
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-slate-300">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span>14 days of unrestricted access</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-300">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span>Unlimited automated exports</span>
                        </div>
                      </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button
                      onClick={handleLogin}
                      className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-[0_0_20px_-5px_rgba(var(--primary),0.4)]"
                  >
                      <LogIn className="mr-3 h-5 w-5" />
                      Sign In to Connect
                  </Button>

                  <Button
                      onClick={handleSignUp}
                      variant="ghost"
                      className="w-full h-14 text-base font-bold text-slate-300 hover:text-white hover:bg-white/5 border border-white/5"
                  >
                      <UserPlus className="mr-3 h-5 w-5" />
                      New? Claim your Trial
                  </Button>
                </div>

                <div className="space-y-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
                      <div className="relative flex justify-center text-[10px] uppercase tracking-tighter"><span className="bg-[#0b0f1a] px-3 text-slate-500">Secured via OAuth 2.0</span></div>
                    </div>
                    
                    <p className="text-[11px] text-center text-slate-500 font-medium leading-relaxed">
                        By logging in, you agree to our Terms of Service. Extension usage is synced with 
                        <span className="text-slate-300 font-semibold"> amzboosted.com</span>.
                    </p>
                    
                    <div className="flex justify-center">
                        <a
                        href="https://amzboosted.com"
                        target="_blank"
                        className="group flex items-center gap-2 text-xs text-slate-400 font-bold hover:text-primary transition-colors"
                        >
                        <Globe className="w-3.5 h-3.5" /> Main Portal <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </a>
                    </div>
                </div>
            </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
};