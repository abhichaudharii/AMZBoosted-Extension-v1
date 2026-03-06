import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSubscriptionStatus } from '@/lib/hooks/useUserData';
import { usePlans } from '@/lib/hooks/usePlans';
import { cn } from '@/lib/utils';
import { ToolPageLayout } from '@/entrypoints/dashboard/components/ToolPageLayout';

import { 
  getTrialProgress, 
} from '@/lib/utils/subscription';

const WEB_DASHBOARD_URL = 'http://localhost:8090/dashboard/billing';

export const BillingPage: React.FC = () => {
  const { loading: authLoading } = useAuth();
  const { status: subscriptionStatus, loading: billingLoading } = useSubscriptionStatus();
  const { plans, loading: plansLoading } = usePlans();

  const isLoading = authLoading || billingLoading || plansLoading;

  const openWebDashboard = () => {
    window.open(WEB_DASHBOARD_URL, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return <PageLoading text="Loading billing information..." subtitle="Fetching your subscription and usage data" />;
  }

  const hasActiveSubscription = subscriptionStatus?.isActive || subscriptionStatus?.isTrialing;
  const isTrialing = subscriptionStatus?.isTrialing;
  const isCanceled = subscriptionStatus?.isCanceled;
  const canStartTrial = subscriptionStatus?.canStartTrial;
  const currentPlanId = subscriptionStatus?.currentPlan;

  const currentPlan = plans?.find(p => p.id === currentPlanId);

  const trialDaysRemaining = subscriptionStatus?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(subscriptionStatus.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Explicitly calculate expired state to prevent UI overlap
  const isTrialExpired = !hasActiveSubscription && subscriptionStatus?.trialEndsAt && new Date(subscriptionStatus.trialEndsAt) < new Date();

  return (
    <ToolPageLayout
        title='Billing & <span class="text-[#FF6B00]">Plans</span>'
        subtitle="Manage your subscription, view usage, and update payment details."
        icon={CreditCard}
        badge="Account Management"
        iconBgClass="bg-[#FF6B00]/10"
        iconColorClass="text-[#FF6B00]"
        showBackButton={false}
    >
      
      {/* TRIAL EXPIRED OVERLAY / HERO STATE */}
      {/* This replaces the 'boxed' UI with a full-page takeover style if desired, or a very prominent section */}
      {!hasActiveSubscription && !canStartTrial && subscriptionStatus?.trialEndsAt && new Date(subscriptionStatus.trialEndsAt) < new Date() ? (
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
                <p className="text-sm text-gray-500 font-medium">
                    Starting at just $19/mo
                </p>
             </div>

             <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left opacity-90">
                  <div className="p-6 rounded-2xl bg-[#0A0A0B]/60 backdrop-blur-md border border-white/5 shadow-sm">
                      <Zap className="w-8 h-8 text-[#FF6B00] mb-4" />
                      <h3 className="font-bold text-lg mb-2 text-white">Uninterrupted Access</h3>
                      <p className="text-sm text-gray-400">Keep your automated schedules running without any downtime.</p>
                  </div>
                   <div className="p-6 rounded-2xl bg-[#0A0A0B]/60 backdrop-blur-md border border-white/5 shadow-sm">
                      <Shield className="w-8 h-8 text-[#FF6B00] mb-4" />
                      <h3 className="font-bold text-lg mb-2 text-white">Secure & Reliable</h3>
                      <p className="text-sm text-gray-400">Enterprise-grade security for your data and Amazon account connection.</p>
                  </div>
                   <div className="p-6 rounded-2xl bg-[#0A0A0B]/60 backdrop-blur-md border border-white/5 shadow-sm">
                      <Rocket className="w-8 h-8 text-[#FF6B00] mb-4" />
                      <h3 className="font-bold text-lg mb-2 text-white">Priority Support</h3>
                      <p className="text-sm text-gray-400">Get faster responses and dedicated help from our expert team.</p>
                  </div>
             </div>
          </div>
      ) : (
        <>
            {/* Premium Hero Trial CTA (Redesigned) */}
            {!hasActiveSubscription && (canStartTrial !== false) && !isTrialExpired && (
                <Card className="border-0 shadow-xl overflow-hidden relative group bg-[#0A0A0B]/60 backdrop-blur-md border-white/5 ring-1 ring-white/10">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF6B00] to-orange-400" />
                <CardContent className="p-0">
                    <div className="grid md:grid-cols-3 gap-0">
                        {/* LEFT CONTENT */}
                        <div className="col-span-2 p-8 md:p-10 relative overflow-hidden">
                        {/* Abstract Shape */}
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#FF6B00]/10 rounded-full blur-3xl" />

                        <div className="relative z-10 space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6B00]/10 text-[#FF6B00] text-sm font-semibold w-fit border border-[#FF6B00]/20">
                            <Rocket className="w-4 h-4" />
                            <span>Early access free trial</span>
                            </div>

                            <div className="space-y-2">
                            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
                                Start your 14-day free trial
                            </h1>
                            <p className="text-lg text-gray-400 leading-relaxed max-w-xl">
                                Try AMZBoosted risk-free. Access all tools directly in your browser and automate Seller Central reports, exports, and schedules.
                            </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <Button
                                size="lg"
                                className="h-12 px-8 text-base font-bold shadow-[0_0_20px_-5px_rgba(255,107,0,0.4)] hover:shadow-[0_0_25px_-5px_rgba(255,107,0,0.5)] bg-[#FF6B00] hover:bg-[#FF8533] text-white border-0 transition-transform hover:scale-105"
                                onClick={openWebDashboard}
                            >
                                Start free trial <ExternalLink className="ml-2 h-4 w-4" />
                            </Button>
                            <p className="text-xs text-gray-500 self-center">
                                No credit card required
                            </p>
                            </div>
                        </div>
                        </div>

                        {/* RIGHT CONTENT */}
                        <div className="bg-white/[0.02] p-8 md:p-10 flex flex-col justify-center border-l border-white/5">
                        <h3 className="font-bold text-lg mb-4 text-white">What’s included in the trial</h3>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                            <div className="p-1 rounded-full bg-green-500/10 text-green-500">
                                <Check className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-sm text-gray-300">
                                Access to all automation tools
                            </span>
                            </div>

                            <div className="flex items-center gap-3">
                            <div className="p-1 rounded-full bg-green-500/10 text-green-500">
                                <Check className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-sm text-gray-300">
                                Automated reports and exports
                            </span>
                            </div>

                            <div className="flex items-center gap-3">
                            <div className="p-1 rounded-full bg-green-500/10 text-green-500">
                                <Check className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-sm text-gray-300">
                                Scheduling with plan-level limits
                            </span>
                            </div>

                            <div className="flex items-center gap-3">
                            <div className="p-1 rounded-full bg-green-500/10 text-green-500">
                                <Check className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-sm text-gray-300">
                                Runs locally in your browser
                            </span>
                            </div>
                        </div>
                        </div>
                    </div>
                </CardContent>
                </Card>
            )}

            {/* Active Subscription / Trial Card */}
            {hasActiveSubscription && (
                <Card className={cn(
                    "group relative overflow-hidden transition-all duration-500",
                    "border border-white/5 bg-[#0A0A0B]/60 backdrop-blur-md",
                    "hover:border-white/10 hover:shadow-[0_0_30px_-10px_rgba(255,107,0,0.05)]",
                    // Premium rounded corners
                    "rounded-3xl" 
                )}>
                    
                    {/* 1. Ambient Background Glow (Subtle & Moving) */}
                    <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#FF6B00]/5 blur-[100px] transition-all duration-1000 group-hover:bg-[#FF6B00]/10" />
                    <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#FF6B00]/5 blur-[80px]" />

                    <CardContent className="relative z-10 p-8">
                    <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                        
                        {/* SECTION 1: Plan Identity */}
                        <div className="flex items-center gap-6">
                        {/* Icon Container with subtle glow ring */}
                        <div className={cn(
                            "relative flex h-16 w-16 items-center justify-center rounded-2xl border transition-all duration-300",
                            isTrialing 
                            ? "border-[#FF6B00]/20 bg-[#FF6B00]/5 text-[#FF6B00] shadow-[0_0_30px_-10px_rgba(255,107,0,0.3)]" 
                            : "border-white/5 bg-white/5 text-gray-200"
                        )}>
                            {isTrialing ? <Rocket className="h-7 w-7" /> : <Crown className="h-7 w-7" />}
                            {/* Inner ring for detail */}
                            <div className="absolute inset-1 rounded-xl border border-white/5" />
                        </div>

                        <div>
                            <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold tracking-tight text-white">
                                {isTrialing ? 'Free Trial Active' : 'Current Plan'}
                            </h3>
                            {/* Status Pill */}
                            <div className={cn(
                                "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm border",
                                isTrialing 
                                ? "border-[#FF6B00]/20 bg-[#FF6B00]/10 text-[#FF6B00]" 
                                : isCanceled
                                    ? "border-red-500/20 bg-red-500/10 text-red-500"
                                    : "border-green-500/20 bg-green-500/10 text-green-500"
                            )}>
                                <div className={cn("h-1.5 w-1.5 rounded-full", isTrialing ? "bg-[#FF6B00] animate-pulse" : isCanceled ? "bg-red-500" : "bg-green-500")} />
                                {isTrialing ? 'Trial' : isCanceled ? 'Canceled' : 'Active'}
                            </div>
                            </div>

                            <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tighter text-white">
                                {currentPlan?.name || 'Unknown'}
                            </span>
                            </div>
                        </div>
                        </div>

                        {/* SECTION 2: Key Metric (Dates) */}
                        <div className="flex flex-col items-start gap-1 md:items-end md:text-right">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            {isTrialing ? 'Trial Ends In' : isCanceled ? 'Access Expires' : 'Next Billing'}
                        </p>
                        
                        {isTrialing ? (
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black tracking-tighter text-white">
                                {trialDaysRemaining}
                                </span>
                                <span className="text-sm font-medium text-gray-400">days</span>
                            </div>
                        ) : (
                            <p className="text-lg font-medium text-white">
                            {subscriptionStatus?.subscriptionEndsAt
                                ? new Date(subscriptionStatus.subscriptionEndsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                : (subscriptionStatus?.currentPeriodEnd 
                                    ? new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                    : 'Renews Automatically')}
                            </p>
                        )}
                        </div>

                        {/* SECTION 3: Actions */}
                        <div className="flex w-full flex-col gap-3 md:w-auto">
                        {isTrialing ? (
                            <>
                            <Button 
                                onClick={openWebDashboard} 
                                className="group relative h-11 overflow-hidden rounded-xl bg-[#FF6B00] px-8 text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-[#FF8533] hover:shadow-[#FF6B00]/25 border-0"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:animate-shine transition-all" />
                                <Zap className="mr-2 h-4 w-4 fill-current" />
                                <span className="font-semibold">Upgrade Now</span>
                            </Button>
                            <Button 
                                variant="ghost" 
                                onClick={openWebDashboard} 
                                className="h-11 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white"
                            >
                                Manage Billing
                            </Button>
                            </>
                        ) : (
                            <Button 
                            variant="outline"
                            onClick={openWebDashboard} 
                            className="h-11 border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white rounded-xl shadow-sm backdrop-blur-sm"
                            >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Manage Plan
                            </Button>
                        )}
                        </div>
                    </div>

                    {/* SECTION 4: Trial Progress (Only if trialing) */}
                    {isTrialing && (() => {
                        const trialProgress = subscriptionStatus?.trialEndsAt ? getTrialProgress(subscriptionStatus.trialEndsAt) : null;
                        if (!trialProgress) return null;
                        
                        return (
                        <div className="mt-8 rounded-2xl bg-black/20 p-1 ring-1 ring-white/5">
                            <div className="flex items-center gap-4 rounded-xl bg-white/5 px-4 py-3 backdrop-blur-md">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FF6B00]/10 text-[#FF6B00]">
                                <Clock className="h-5 w-5" />
                            </div>
                            
                            <div className="flex-1 space-y-1.5">
                                <div className="flex justify-between text-xs font-medium">
                                <span className="text-white">Trial Progress</span>
                                <span className={cn(
                                    trialProgress.urgencyLevel === 'critical' ? 'text-red-500' : 'text-gray-400'
                                )}>
                                    {trialProgress.daysRemaining} days left
                                </span>
                                </div>
                                
                                <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                                <div 
                                    className={cn(
                                    "h-full rounded-full transition-all duration-1000 ease-out",
                                    trialProgress.urgencyLevel === 'safe' && "bg-gradient-to-r from-emerald-500 to-green-500",
                                    trialProgress.urgencyLevel === 'warning' && "bg-gradient-to-r from-amber-400 to-orange-500",
                                    trialProgress.urgencyLevel === 'urgent' && "bg-gradient-to-r from-orange-500 to-red-500",
                                    trialProgress.urgencyLevel === 'critical' && "bg-red-600 animate-pulse"
                                    )}
                                    style={{ width: `${trialProgress.percentage}%` }}
                                />
                                </div>
                            </div>
                            
                            {/* Optional: A minimalist arrow or action to nudge them */}
                            <div 
                                onClick={() => window.location.href='#/tools'}
                                className="hidden cursor-pointer rounded-full p-2 text-gray-500 transition-colors hover:bg-white/10 hover:text-white md:block"
                                title="Explore Tools"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </div>
                            </div>
                        </div>
                        );
                    })()}

                    <p className="mt-4 text-sm text-center text-gray-500">
                        Full access to all tools during the trial. Explore reports, exports,
                        and scheduling directly from your browser.
                    </p>
                    
                    </CardContent>
                </Card>
                )}

            {/* Manage Subscription Card (Replaces Pricing Grid) if inactive or trial expired */}
            {!hasActiveSubscription && (canStartTrial === false || isTrialExpired) && (
                <Card className="border-white/5 bg-[#0A0A0B]/60 backdrop-blur-md shadow-sm">
                    <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-[#FF6B00]/10 text-[#FF6B00]">
                            <Rocket className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-white">Manage Your Plan</CardTitle>
                    </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-400 mb-4">
                            To upgrade, downgrade, or manage your subscription, please visit your account dashboard on the web.
                        </p>
                        <Button onClick={openWebDashboard} className="w-full md:w-auto min-w-[200px] gap-2 bg-[#FF6B00] hover:bg-[#FF8533] text-white border-0">
                            Go to Web Dashboard <ExternalLink className="w-4 h-4" />
                        </Button>
                    </CardContent>
                </Card>
            )}
            
            {/* Secure Payment Footer */}
            <div className="mt-12 mb-8 text-center opacity-60 hover:opacity-100 transition-opacity">
                <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 border border-white/5 text-xs text-gray-500 shadow-sm">
                    <Shield className="w-3 h-3 text-[#FF6B00]" />
                    <span>Payments securely processed by <strong>Dodo Payments</strong></span>
                </div>
            </div>
        </>
      )}
    </ToolPageLayout>
  );
};
