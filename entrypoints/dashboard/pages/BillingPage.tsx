import React from 'react';
import confetti from 'canvas-confetti';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PageLoading } from '@/components/ui/page-loading';
import {
  Crown,
  Zap,
  AlertCircle,
  Check,
  ExternalLink,
  Rocket,
  CreditCard,
  Clock,
  Shield,
  ChevronRight,
  Infinity,
  Layers,
  BarChart3,
  BellRing
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSubscriptionStatus } from '@/lib/hooks/useUserData';
import { usePlans } from '@/lib/hooks/usePlans';
import { useUserContext } from '@/lib/contexts/UserContext';
import { useSchedules } from '@/lib/hooks/useSchedules';
import { cn } from '@/lib/utils';
import { ToolPageLayout } from '@/entrypoints/dashboard/components/ToolPageLayout';
import { API_CONFIG } from '@/lib/api/config';

const WEB_DASHBOARD_URL = `${API_CONFIG.dashboardURL}/dashboard/billing`;

export const BillingPage: React.FC = () => {
  const { loading: authLoading } = useAuth();
  const { status: subscriptionStatus, loading: billingLoading } = useSubscriptionStatus();
  const { limits } = useUserContext();
  const { schedules } = useSchedules();
  const { plans, loading: plansLoading } = usePlans();

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  const isLoading = authLoading || billingLoading || plansLoading;

  const openWebDashboard = () => {
    window.open(WEB_DASHBOARD_URL, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return <PageLoading text="Loading billing information..." subtitle="Fetching your subscription and usage data" />;
  }

  const hasActiveSubscription = subscriptionStatus?.isActive || subscriptionStatus?.isTrialing;
  const isTrialing = subscriptionStatus?.isTrialing;
  const canStartTrial = subscriptionStatus?.canStartTrial;
  const currentPlanId = subscriptionStatus?.currentPlan;
  const currentPlan = plans?.find(p => p.id === currentPlanId);

  const trialDaysRemaining = subscriptionStatus?.trialEndsAt
    ? Math.max(0, Math.floor((new Date(subscriptionStatus.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isTrialExpired = !hasActiveSubscription && subscriptionStatus?.trialEndsAt && new Date(subscriptionStatus.trialEndsAt) < new Date();

  // Usage stats
  const scheduleCount = schedules.length;
  const maxSchedules = limits?.maxSchedules || (subscriptionStatus?.isTrialing ? 100 : 5);
  const schedulePercentage = Math.min(100, (scheduleCount / maxSchedules) * 100);

  return (
    <ToolPageLayout
        title='Billing & <span class="text-primary font-black">Plans</span>'
        subtitle="Manage your subscription, view usage, and update payment details."
        icon={CreditCard}
        badge="Account Management"
        iconColorClass="text-primary"
        showBackButton={false}
    >
      
      {/* 1. HERO STATE: TRIAL EXPIRED */}
      {!hasActiveSubscription && !canStartTrial && isTrialExpired ? (
          <div className="max-w-4xl mx-auto pt-8 text-center relative z-10">
               <div className="inline-flex items-center justify-center p-4 rounded-full bg-red-500/10 text-red-500 mb-6 ring-8 ring-red-500/5">
                   <AlertCircle className="w-12 h-12" />
               </div>
               <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
                   Your Free Trial Has Ended
               </h1>
               <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                   We hope you enjoyed experiencing the power of AMZBoosted. 
                   To continue accessing premium tools, unlimited exports, and automated schedules, please select a plan below.
               </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                 <Button 
                     size="lg" 
                     className="h-14 px-8 text-lg font-semibold shadow-xl shadow-red-500/10 hover:shadow-red-500/20 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white border-0 transition-all w-full sm:w-auto min-w-[200px]"
                     onClick={openWebDashboard}
                 >
                     View Plans & Pricing <ExternalLink className="ml-2 w-5 h-5" />
                 </Button>
                 <p className="text-sm text-gray-500 font-medium">Starting at just $19/mo</p>
              </div>
          </div>
      ) : (
        <div className="space-y-8">
            {/* 2. HERO STATE: START TRIAL */}
            {!hasActiveSubscription && canStartTrial && !isTrialExpired && (
                <Card className="border-0 shadow-2xl overflow-hidden relative group bg-[#0A0A0B]/60 backdrop-blur-xl border-white/5 ring-1 ring-white/10 rounded-3xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-orange-400" />
                    <CardContent className="p-0">
                        <div className="grid md:grid-cols-3 gap-0">
                            <div className="col-span-2 p-8 md:p-12 relative overflow-hidden">
                                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50" />
                                <div className="relative z-10 space-y-6">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold w-fit border border-primary/20">
                                        <Rocket className="w-4 h-4" />
                                        <span>Beta access active</span>
                                    </div>
                                    <div className="space-y-4">
                                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                                            Unlock the full power of <br/>
                                            <span className="text-primary italic">AMZBoosted</span>
                                        </h1>
                                        <p className="text-lg text-gray-400 leading-relaxed max-w-xl">
                                            Start your 14-day free trial today. Securely automate your Seller Central operations with our professional-grade tools.
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-5 pt-4">
                                        <Button
                                            size="lg"
                                            className="h-14 px-10 text-lg font-bold shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-black border-0 transition-all hover:scale-[1.02] active:scale-95"
                                            onClick={() => { triggerConfetti(); openWebDashboard(); }}
                                        >
                                            Start Trial for Free <ExternalLink className="ml-2 h-5 w-5" />
                                        </Button>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-white">No credit card required</span>
                                            <span className="text-xs text-gray-500 italic">Cancel anytime in one click</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/[0.03] p-8 md:p-12 flex flex-col justify-center border-l border-white/5 backdrop-blur-sm">
                                <h3 className="font-bold text-xl mb-6 text-white flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-primary" /> Premium Features
                                </h3>
                                <ul className="space-y-5">
                                    {[
                                        'Unlimited Data Exports',
                                        'Automated Hourly Schedules',
                                        'SQR & Category Insights',
                                        'Connect Multiple Stores',
                                        'Priority Email Support'
                                    ].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 group">
                                            <div className="p-1 rounded-full bg-primary/20 text-primary group-hover:scale-110 transition-transform">
                                                <Check className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium text-sm text-gray-300 group-hover:text-white transition-colors">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 3. ACTIVE PLAN SECTION */}
            {hasActiveSubscription && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* PLAN OVERVIEW */}
                    <Card className="lg:col-span-2 border-white/5 bg-[#0A0A0B]/60 backdrop-blur-md rounded-3xl overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            {isTrialing ? <Rocket size={120} /> : <Crown size={120} />}
                        </div>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-primary">Your Subscription</span>
                                        {isTrialing && <div className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold animate-pulse">TRIAL</div>}
                                    </div>
                                    <CardTitle className="text-3xl font-black text-white">{currentPlan?.name || 'Pro Plan'}</CardTitle>
                                    <CardDescription className="text-gray-400 mt-1">
                                        {isTrialing ? `Expires in ${trialDaysRemaining} days` : `Renews on ${subscriptionStatus?.currentPeriodEnd ? new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString() : 'Next month'}`}
                                    </CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={openWebDashboard} className="border-white/10 hover:bg-white/5 rounded-xl">
                                    Manage Plan <ChevronRight className="ml-1 w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1.5"><Layers size={12} /> Schedules</div>
                                    <div className="text-xl font-bold text-white">{scheduleCount} <span className="text-sm text-gray-500">/ {maxSchedules}</span></div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1.5"><Infinity size={12} /> Exports</div>
                                    <div className="text-xl font-bold text-white">Unlimited</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1.5"><BarChart3 size={12} /> Insights</div>
                                    <div className="text-xl font-bold text-white">Full</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1.5"><Clock size={12} /> Frequency</div>
                                    <div className="text-xl font-bold text-white">{isTrialing || (currentPlanId?.includes('professional')) ? 'Hourly' : 'Daily'}</div>
                                </div>
                            </div>

                            {/* PROGRESS TRACKER */}
                            <div className="mt-8 space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold text-white">Schedule Usage</span>
                                    <span className="text-xs text-gray-400">{Math.round(schedulePercentage)}% consumed</span>
                                </div>
                                <Progress value={schedulePercentage} className="h-2.5 bg-white/5" indicatorClassName={cn(
                                    "bg-gradient-to-r transition-all duration-500",
                                    schedulePercentage > 90 ? "from-red-600 to-red-400" : "from-primary to-orange-400"
                                )} />
                                {schedulePercentage > 80 && (
                                    <p className="text-[11px] text-orange-400 flex items-center gap-1">
                                        <AlertCircle size={12} /> You're almost at your limit. Upgrade to a higher plan for more slots.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* TRIAL CARD (IF APPLICABLE) */}
                    {isTrialing ? (
                        <Card className="border-primary/20 bg-primary/5 rounded-3xl overflow-hidden relative border-dashed">
                             <CardContent className="p-8 h-full flex flex-col justify-center items-center text-center space-y-6">
                                <div className="p-4 rounded-full bg-primary/10 text-primary mb-2">
                                    <Clock size={32} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-white">Trial Ends Soon</h3>
                                    <p className="text-sm text-gray-400">Lock in your data and keeps your schedules running by upgrading today.</p>
                                </div>
                                <Button onClick={openWebDashboard} className="w-full h-12 bg-primary hover:bg-primary/90 text-black font-bold rounded-xl shadow-lg shadow-primary/20">
                                    Secure Unlimited Access
                                </Button>
                             </CardContent>
                        </Card>
                    ) : (
                         <Card className="border-white/5 bg-[#0A0A0B]/60 backdrop-blur-md rounded-3xl p-8 flex flex-col justify-center text-center items-center">
                            <div className="mb-4 p-3 rounded-full bg-blue-500/10 text-blue-500">
                                <Crown size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Pro Performance</h3>
                            <p className="text-sm text-gray-400 mb-6">You are on the most popular plan for scaling Amazon sellers.</p>
                            <Button variant="ghost" onClick={openWebDashboard} className="text-primary hover:text-primary/80 hover:bg-primary/5">
                                System Status <ChevronRight size={16} />
                            </Button>
                         </Card>
                    )}
                </div>
            )}

            {/* 5. FOOTER INFO */}
            <div className="pt-12 pb-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 opacity-80">
                <div className="space-y-3">
                    <h4 className="text-white font-bold flex items-center gap-2"><BellRing size={16} className="text-primary" /> Automatic Billing</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        Your subscription will renew automatically at the end of each billing cycle. You can cancel or change your plan at any time through the web dashboard.
                    </p>
                </div>
                <div className="space-y-3">
                    <h4 className="text-white font-bold flex items-center gap-2"><Shield size={16} className="text-primary" /> Secure Payments</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">
                        All payments are processed by Dodo Payments via Stripe. AMZBoosted does not store your credit card information. Full invoice history is available on the web.
                    </p>
                </div>
            </div>
        </div>
      )}
    </ToolPageLayout>
  );
};
