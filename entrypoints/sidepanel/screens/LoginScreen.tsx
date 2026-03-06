// import React from 'react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Zap, LogIn, UserPlus, CheckCircle2 } from 'lucide-react';
// import { toast } from 'sonner';

// export const LoginScreen: React.FC = () => {
//   const handleLogin = async () => {
//     // Open website login page in new tab
//     chrome.tabs.create({
//       url: 'https://amzboosted.com/sign-in',
//     });

//     toast.info('Opening login page...', {
//       description: 'Please sign in on the website. The extension will automatically detect your login.',
//     });
//   };

//   const handleSignUp = async () => {
//     // Open website signup page in new tab
//     chrome.tabs.create({
//       url: 'https://amzboosted.com/sign-up',
//     });

//     toast.info('Opening signup page...', {
//       description: 'Please create an account on the website. The extension will automatically detect your login.',
//     });
//   };

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/5">
//       <div className="w-full max-w-md space-y-6">
//         {/* Logo */}
//         <div className="text-center">
//           <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
//             <Zap className="w-8 h-8 text-primary-foreground" />
//           </div>
//           <h1 className="text-2xl font-bold">AMZBoosted</h1>
//           <p className="text-sm text-muted-foreground mt-1">
//             Sign in to access premium tools
//           </p>
//         </div>

//         {/* Auth Card */}
//         <Card>
//           <CardHeader className="space-y-1 pb-4">
//             <CardTitle className="text-lg">Get Started</CardTitle>
//             <CardDescription className="text-xs">
//               Sign in or create an account on amzboosted.com
//             </CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             {/* Free Trial Benefits */}
//             <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
//               <p className="text-xs font-medium mb-2">14-Day Trial Includes:</p>
//               <ul className="text-xs text-muted-foreground space-y-1.5">
//                 <li className="flex items-center gap-2">
//                   <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />
//                   Full access to all 8 tools
//                 </li>
//                 <li className="flex items-center gap-2">
//                   <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />
//                   7 days of premium features
//                 </li>
//                 <li className="flex items-center gap-2">
//                   <CheckCircle2 className="h-3 w-3 text-primary flex-shrink-0" />
//                   No credit card required
//                 </li>
//               </ul>
//             </div>

//             {/* Auth Buttons */}
//             <div className="space-y-2">
//               <Button
//                 onClick={handleLogin}
//                 className="w-full"
//               >
//                 <LogIn className="mr-2 h-4 w-4" />
//                 Login on AMZBoosted.com
//               </Button>

//               <Button
//                 onClick={handleSignUp}
//                 variant="outline"
//                 className="w-full"
//               >
//                 <UserPlus className="mr-2 h-4 w-4" />
//                 Sign Up on AMZBoosted.com
//               </Button>

//               <p className="text-xs text-muted-foreground text-center px-2 pt-1">
//                 After logging in on the website, the extension will automatically detect your session
//               </p>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Footer */}
//         <p className="text-xs text-center text-muted-foreground">
//           Visit{' '}
//           <a
//             href="https://amzboosted.com"
//             target="_blank"
//             rel="noopener noreferrer"
//             className="text-primary hover:underline"
//           >
//             amzboosted.com
//           </a>{' '}
//           for more information
//         </p>
//       </div>
//     </div>
//   );
// };


import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LogIn, UserPlus, ArrowRight, Sparkles, Crown, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

// Helper to safely load the extension logo
const getLogoUrl = () => {
  try {
    return chrome.runtime.getURL('icon/128.png');
  } catch (e) {
    return '/icon/128.png'; // Fallback for local dev
  }
};

export const LoginScreen: React.FC = () => {
  const handleLogin = async () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: 'https://amzboosted.com/sign-in' });
    } else {
      window.open('https://amzboosted.com/sign-in', '_blank');
    }
    
    toast.info('Opening login page...', {
      description: 'Sign in on the website to activate the extension.',
    });
  };

  const handleSignUp = async () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: 'https://amzboosted.com/sign-up' });
    } else {
      window.open('https://amzboosted.com/sign-up', '_blank');
    }

    toast.info('Opening signup page...', {
      description: 'Create an account to start your free trial.',
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      
      {/* Background Decorative Blobs (Same as AuthPage) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px] -z-10 opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[250px] h-[250px] bg-amber-500/5 rounded-full blur-[60px] -z-10 pointer-events-none" />

      <div className="w-full max-w-[340px] space-y-6 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Brand Header (Scaled down from AuthPage) */}
        <div className="text-center space-y-4">
          <div className="relative inline-block group cursor-default">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Logo Container - Glassmorphism */}
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-background/50 backdrop-blur-xl border border-white/10 shadow-xl ring-1 ring-white/20 transform transition-transform duration-500 group-hover:scale-105">
               <img 
                  src={getLogoUrl()} 
                  alt="AMZBoosted" 
                  className="w-12 h-12 object-contain drop-shadow-md" 
               />
            </div>
          </div>
          
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              AMZBoosted
            </h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-[260px] mx-auto">
              Premium Amazon Seller Tools Suite
            </p>
          </div>
        </div>

        {/* Auth Card (Matches AuthPage Right Side) */}
        <Card className="border-border/50 shadow-2xl bg-card/60 backdrop-blur-xl">
          <CardHeader className="pb-2 pt-6 text-center">
            <CardTitle className="text-lg font-bold">Welcome Back</CardTitle>
            <CardDescription className="text-xs">
              Connect your account to unlock full power
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-5 px-5 pb-6 mt-6">
            
            {/* Gold Trial Box (Identical to AuthPage) */}
            <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-4">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Sparkles className="w-8 h-8 text-amber-500" />
                </div>
                <div className="relative z-10">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2.5 flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5" /> 
                        Start 14-Day Free Trial
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1.5">
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 text-amber-500 flex-shrink-0" />
                            <span>Access all tools during the free trial</span>
                        </li>
                        {/* add credit based usage */}
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 text-amber-500 flex-shrink-0" />
                            <span>Credit-based usage with full transparency</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 text-amber-500 flex-shrink-0" />
                            <span>Cancel anytime from your account dashboard</span>
                        </li>
                        
                    </ul>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handleLogin} 
                size="lg" 
                className="w-full h-11 text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
              >
                <LogIn className="mr-2 h-4 w-4" />
                Login to Dashboard
              </Button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                  <span className="bg-background/80 backdrop-blur px-2 text-muted-foreground/60 font-medium">New Here?</span>
                </div>
              </div>

              <Button 
                onClick={handleSignUp} 
                variant="outline" 
                size="lg" 
                className="w-full h-11 text-sm bg-transparent border-primary/20 hover:bg-primary/5 hover:text-primary transition-all group"
              >
                <UserPlus className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                Start Free Trial
                <ArrowRight className="ml-2 h-3.5 w-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </Button>
            </div>

            {/* Footer Text */}
            <div className="pt-1 text-center">
                <p className="text-[10px] text-muted-foreground/60 leading-tight">
                    Visit <span className="text-primary font-medium">amzboosted.com</span> for details.
                </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};