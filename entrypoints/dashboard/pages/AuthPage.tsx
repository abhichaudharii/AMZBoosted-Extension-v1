import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, TrendingUp, CheckCircle2, LogIn, UserPlus, Crown, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

// Helper to safely load the extension logo
const getLogoUrl = () => {
  try {
    return chrome.runtime.getURL('icon/128.png');
  } catch (e) {
    return '/icon/128.png'; // Fallback for local dev
  }
};

export const AuthPage: React.FC = () => {
  const handleLogin = async () => {
    window.open('https://amzboosted.com/sign-in', '_blank');
    toast.info('Opening login page...', {
      description: 'Please sign in on the website. The extension will automatically detect your login.',
    });
  };

  const handleSignUp = async () => {
    window.open('https://amzboosted.com/sign-up', '_blank');
    toast.info('Opening signup page...', {
      description: 'Please create an account on the website. The extension will automatically detect your login.',
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 md:p-8 bg-gradient-to-br from-background via-background to-primary/5">
      
      {/* Background Decorative Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-amber-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* --- LEFT SIDE: Branding & Value --- */}
        <div className="space-y-10">
          
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-2 group">
              <div className="relative h-16 w-16 flex items-center justify-center rounded-2xl bg-background/50 backdrop-blur-md border border-white/10 shadow-lg ring-1 ring-white/20 transition-transform group-hover:scale-105 duration-500">
                 <img 
                    src={getLogoUrl()} 
                    alt="Logo" 
                    className="h-full w-full object-contain p-2 drop-shadow-sm" 
                 />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  AMZBoosted
                </h1>
                <div className="flex items-center gap-2 mt-1">
                   <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      v1.0 Beta
                   </span>
                </div>
              </div>
            </div>
            <p className="text-xl text-muted-foreground/90 leading-relaxed max-w-md">
              Automate Amazon Seller Central workflows directly from your browser.
            </p>
          </div>

          {/* Features Grid */}
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors duration-300">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary mt-1 shadow-sm">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1 text-foreground">Automated Reports & Exports</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Run Seller Central reports automatically and export clean data without manual downloads.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors duration-300">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-1 shadow-sm">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1 text-foreground">Privacy-first by design</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  All processing runs locally in your browser. We never store your Amazon data on our servers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors duration-300">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 mt-1 shadow-sm">
                <Crown className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1 text-foreground">Full access during trial</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Access all tools during your free trial. Upgrade only when you need higher limits.
                </p>
              </div>
            </div>
          </div>


        </div>

        {/* --- RIGHT SIDE: Auth Card --- */}
        <div className="relative">
            {/* Glow Effect behind card */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-amber-500/30 rounded-2xl blur-xl opacity-30 animate-pulse" />
            
            <Card className="relative shadow-2xl border-border/50 bg-background/80 backdrop-blur-xl">
            <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                <CardDescription className="text-base">
                Connect your account to unlock full power
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-8 pb-8">
                
                {/* Trial Box - Gold Theme */}
                <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-5">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Sparkles className="w-12 h-12 text-amber-500" />
                </div>
                <div className="relative z-10">
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
                        <Crown className="w-4 h-4" /> 
                        Start your 14-Day Free Trial
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-2.5">
                    <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        <span>Access all tools during the free trial</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        <span>Credit-based usage with full transparency</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        <span>Cancel anytime from your account dashboard</span>
                    </li>
                    </ul>
                </div>
                </div>

                {/* Auth Buttons */}
                <div className="space-y-3 pt-2">
                <Button
                    onClick={handleLogin}
                    className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                    size="lg"
                >
                    <LogIn className="mr-2 h-5 w-5" />
                    Connect via Website
                </Button>

                <Button
                    onClick={handleSignUp}
                    variant="outline"
                    className="w-full h-12 text-base bg-transparent hover:bg-muted/50 transition-colors"
                    size="lg"
                >
                    <UserPlus className="mr-2 h-5 w-5" />
                    Create New Account
                </Button>
                </div>

                {/* Footer Notes */}
                <div className="space-y-4 pt-2">
                    <div className="h-px w-full bg-border/50" />
                    <p className="text-xs text-center text-muted-foreground leading-relaxed">
                        By connecting, the extension will automatically detect your active session from 
                        <span className="font-medium text-foreground"> amzboosted.com</span>.
                    </p>
                    
                    <div className="flex justify-center">
                        <a
                        href="https://amzboosted.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                        >
                        Visit Website <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
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