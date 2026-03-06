import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Calendar,
  Download,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Bell,
  FileSearch,
  Heart,
  Key,
  Link2,
  MessageSquare,
  TrendingUp,
  Sparkles,
  Crown,
  Rocket,
  Target,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { secureStorage } from '@/lib/storage/secure-storage';

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
  const [hoveredTool, setHoveredTool] = useState<number | null>(null);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const result = await secureStorage.get('onboardingCompleted');
      if (!result.onboardingCompleted) {
        setTimeout(() => setOpen(true), 800);
      }
    } catch (e) {
      setTimeout(() => setOpen(true), 800);
    }
  };

  const tools = [
    { name: 'Review AI', icon: FileSearch, color: 'from-primary to-primary/80', desc: 'Analyze customer sentiment' },
    { name: 'Q&A Extractor', icon: MessageSquare, color: 'from-primary to-primary/80', desc: 'Extract product questions' },
    { name: 'Top Terms', icon: TrendingUp, color: 'from-primary to-primary/80', desc: 'Find trending keywords' },
    { name: 'Category Insights', icon: BarChart3, color: 'from-primary to-primary/80', desc: 'Market intelligence' },
    { name: 'Inventory Alerts', icon: Bell, color: 'from-primary to-primary/80', desc: 'Stock monitoring' },
    { name: 'Keyword Rank', icon: Key, color: 'from-primary to-primary/80', desc: 'Track rankings' },
    { name: 'Sentiment Analysis', icon: Heart, color: 'from-primary to-primary/80', desc: 'Customer emotions' },
    { name: 'Bulk Runner', icon: Link2, color: 'from-primary to-primary/80', desc: 'Process at scale' },
  ];

  const steps: OnboardingStep[] = [
    // STEP 1: WELCOME - Premium Hero
    {
      id: 'welcome',
      title: 'Welcome to AMZBoosted',
      subtitle: 'Your AI-Powered Amazon Growth Engine',
      icon: Rocket,
      content: (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-700">
          {/* Hero Section */}
          <div className="relative">
            {/* Animated Background Glow */}
            <div className="absolute inset-0 bg-primary/10 blur-3xl animate-pulse" />
            
            <div className="relative text-center space-y-4">
              {/* Animated Icon */}
              <div className="relative inline-flex items-center justify-center mb-2">
                <div className="absolute inset-0 bg-primary blur-2xl opacity-30 animate-pulse" />
                <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary/80 shadow-2xl shadow-primary/30 flex items-center justify-center transform hover:scale-110 transition-transform duration-500">
                  <Rocket className="h-12 w-12 text-white animate-bounce" style={{ animationDuration: '2s' }} />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-foreground">
                  Welcome to AMZBoosted! 🎉
                </h1>
                <p className="text-muted-foreground text-sm max-w-[85%] mx-auto leading-relaxed">
                  Let's get you started with powerful Amazon seller tools
                </p>
              </div>
            </div>
          </div>

          {/* Premium Benefits Grid */}
          <div className="grid gap-3">
            {[
              { 
                icon: Crown, 
                text: "14-Day Free Trial", 
                subtext: "Full access, no credit card needed",
                color: "text-primary", 
                bg: "bg-primary/10",
                border: "border-primary/20"
              },
              { 
                icon: Sparkles, 
                text: "8 Powerful Tools", 
                subtext: "Reviews, keywords, inventory & more",
                color: "text-primary", 
                bg: "bg-primary/10",
                border: "border-primary/20"
              },
              { 
                icon: Shield, 
                text: "Cancel Anytime", 
                subtext: "No long-term commitment required",
                color: "text-primary", 
                bg: "bg-primary/10",
                border: "border-primary/20"
              },
            ].map((item, i) => (
              <div 
                key={i} 
                className={cn(
                  "group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-default",
                  item.bg,
                  item.border
                )}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                <div className="relative flex items-start gap-4">
                  <div className={cn("p-2.5 rounded-xl bg-background/50 backdrop-blur-sm", item.color)}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-foreground mb-0.5">{item.text}</div>
                    <div className="text-xs text-muted-foreground">{item.subtext}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    // STEP 2: TOOLS - Interactive Showcase
    {
      id: 'tools',
      title: '8 Specialized Tools',
      subtitle: 'All tools included in your trial',
      icon: Sparkles,
      content: (
        <div className="space-y-5 animate-in slide-in-from-right-5 fade-in duration-500">
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground max-w-[90%] mx-auto">
              Hover over any tool to see what it does
            </p>
          </div>

          {/* Interactive Tools Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {tools.map((tool, i) => (
              <div
                key={i}
                onMouseEnter={() => setHoveredTool(i)}
                onMouseLeave={() => setHoveredTool(null)}
                className={cn(
                  "group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer",
                  hoveredTool === i 
                    ? "border-primary/50 shadow-lg shadow-primary/20 scale-105 z-10" 
                    : "border-border hover:border-primary/30"
                )}
                style={{ 
                  animationDelay: `${i * 50}ms`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {/* Gradient Background */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                  tool.color
                )} style={{ opacity: hoveredTool === i ? 0.1 : 0 }} />

                <div className="relative p-3 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "p-2 rounded-lg bg-gradient-to-br transition-all duration-300",
                      tool.color,
                      hoveredTool === i && "scale-110 shadow-lg"
                    )}>
                      <tool.icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-bold text-foreground">{tool.name}</span>
                  </div>
                  
                  {/* Description - shows on hover */}
                  <div className={cn(
                    "text-[10px] text-muted-foreground leading-relaxed transition-all duration-300",
                    hoveredTool === i ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
                  )}>
                    {tool.desc}
                  </div>
                </div>

                {/* Hover Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </div>
            ))}
          </div>

          {/* Feature Highlight */}
          <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-bold text-foreground">Built for Amazon</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Each tool is designed specifically for Amazon sellers
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // STEP 3: AUTOMATION - Visual Workflow
    {
      id: 'automation',
      title: 'Automation Features',
      subtitle: 'Schedule tools to run automatically',
      icon: Calendar,
      content: (
        <div className="space-y-6 animate-in slide-in-from-right-5 fade-in duration-500">
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground max-w-[90%] mx-auto">
              Set up schedules and get notified when tasks complete
            </p>
          </div>

          {/* Automation Flow Visualization */}
          <div className="space-y-3">
            {[
              {
                icon: Calendar,
                title: "Smart Scheduling",
                desc: "Daily, weekly, or monthly—your choice",
                features: ["Run overnight", "Custom intervals", "Timezone aware"],
                iconBg: "bg-primary/10",
                iconColor: "text-primary"
              },
              {
                icon: Download,
                title: "Auto-Export & Sync",
                desc: "Data delivered exactly where you need it",
                features: ["Google Sheets", "CSV downloads", "Webhook alerts"],
                iconBg: "bg-primary/10",
                iconColor: "text-primary"
              },
              {
                icon: Bell,
                title: "Instant Notifications",
                desc: "Never miss critical changes",
                features: ["Slack alerts", "Discord webhooks", "Email reports"],
                iconBg: "bg-primary/10",
                iconColor: "text-primary"
              },
            ].map((item, i) => (
              <div 
                key={i}
                className="group relative overflow-hidden rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Gradient Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary opacity-50 group-hover:opacity-100 transition-opacity" />

                <div className="p-4 space-y-2.5">
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2.5 rounded-lg", item.iconBg)}>
                      <item.icon className={cn("h-5 w-5", item.iconColor)} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-foreground mb-0.5">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>

                  {/* Feature Pills */}
                  <div className="flex flex-wrap gap-1.5 pl-11">
                    {item.features.map((feature, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-[10px] font-medium text-muted-foreground"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    // STEP 4: CREDITS - Simple & Transparent
    {
      id: 'credits',
      title: 'How Credits Work',
      subtitle: 'Simple, transparent pricing',
      icon: CreditCard,
      content: (
        <div className="space-y-6 animate-in slide-in-from-right-5 fade-in duration-500">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/30">
              <Zap className="h-4 w-4 fill-current" />
              1 Credit = 1 URL Processed
            </div>
            <p className="text-xs text-muted-foreground max-w-[85%] mx-auto">
              Failed requests are automatically refunded
            </p>
          </div>

          {/* Pricing Tiers */}
          <div className="space-y-2.5">
            {[
              { 
                name: 'Starter', 
                credits: '5,000', 
                price: '$9', 
                border: 'border-border',
                badge: null
              },
              { 
                name: 'Professional', 
                credits: '20,000', 
                price: '$24', 
                border: 'border-primary/30',
                badge: 'MOST POPULAR',
                badgeColor: 'bg-primary'
              },
              { 
                name: 'Business', 
                credits: '50,000', 
                price: '$49', 
                border: 'border-border',
                badge: null
              },
            ].map((tier, i) => (
              <div 
                key={i}
                className={cn(
                  "relative overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:scale-[1.02] cursor-default bg-card",
                  tier.border,
                  tier.badge && "shadow-lg border-primary/30"
                )}
              >
                {tier.badge && (
                  <div className="absolute top-2 right-2">
                    <Badge className={cn("text-[9px] font-bold px-2 py-0.5", tier.badgeColor || "bg-primary")}>
                      {tier.badge}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-sm font-bold text-foreground">{tier.name}</div>
                    <div className="text-xs text-muted-foreground">{tier.credits} credits/month</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-foreground">{tier.price}</div>
                    <div className="text-[10px] text-muted-foreground">/month</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: CheckCircle2, text: "Auto-refunds", color: "text-primary" },
              { icon: Shield, text: "Cancel anytime", color: "text-primary" },
              { icon: Zap, text: "Instant access", color: "text-primary" },
              { icon: TrendingUp, text: "Scale as you grow", color: "text-primary" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <item.icon className={cn("h-3.5 w-3.5", item.color)} />
                <span className="font-medium text-muted-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = async () => {
    try {
      await secureStorage.set({ onboardingCompleted: true });
    } catch (e) {}
    setOpen(false);
  };

  const handleComplete = async () => {
    try {
      await secureStorage.set({ onboardingCompleted: true });
    } catch (e) {}
    setCompleted(true);
    setTimeout(() => {
      setOpen(false);
      setCompleted(false);
    }, 2500);
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[440px] p-0 overflow-hidden border-none shadow-2xl bg-background/98 backdrop-blur-2xl">
        {completed ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            {/* Success Animation */}
            <div className="relative mb-8 animate-in zoom-in-95 duration-700">
              <div className="absolute inset-0 bg-emerald-500/30 blur-3xl rounded-full animate-pulse" />
              <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 shadow-2xl shadow-emerald-500/40">
                <CheckCircle2 className="h-12 w-12 text-white animate-bounce" style={{ animationDuration: '1.5s' }} />
              </div>
            </div>

            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '200ms' }}>
              <h2 className="text-3xl font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                You're All Set! 🚀
              </h2>
              <p className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                Your 14-day premium trial is active. Time to dominate Amazon.
              </p>
            </div>

            {/* Confetti Effect Placeholder */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-primary rounded-full animate-ping"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 500}ms`,
                    animationDuration: `${1 + Math.random()}s`,
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full min-h-[560px]">
            {/* Animated Progress Bar */}
            <div className="relative h-1.5 bg-muted">
              <div
                className="h-full bg-gradient-to-r from-primary via-purple-600 to-blue-600 transition-all duration-700 ease-out relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-shimmer" />
              </div>
            </div>

            {/* Header */}
            <div className="px-6 pt-6 pb-2">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
                    {currentStep + 1}
                  </div>
                  <div className="h-px w-3 bg-border" />
                  <span className="text-sm text-muted-foreground font-medium">{steps.length}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs hover:bg-destructive/10 hover:text-destructive transition-colors"
                  onClick={handleSkip}
                >
                  Skip Tour
                </Button>
              </div>

              {/* Step Title */}
              <div className="space-y-1 mb-4">
                <h2 className="text-xl font-black text-foreground">{step.title}</h2>
                <p className="text-xs text-muted-foreground">{step.subtitle}</p>
              </div>
            </div>

            {/* Content Area - Scrollable */}
            <div className="flex-1 px-6 py-2 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              {step.content}
            </div>

            {/* Footer Actions */}
            <div className="p-6 pt-4 border-t border-border/50">
              <Button
                onClick={handleNext}
                className="w-full h-12 text-base font-bold shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5 bg-gradient-to-r from-primary via-purple-600 to-blue-600 hover:from-primary/90 hover:via-purple-600/90 hover:to-blue-600/90"
              >
                {currentStep < steps.length - 1 ? (
                  <span className="flex items-center gap-2">
                    Next: {steps[currentStep + 1].title}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Start Using AMZBoosted
                    <Rocket className="h-4 w-4" />
                  </span>
                )}
              </Button>

              {/* Step Indicators */}
              <div className="flex justify-center gap-1.5 mt-4">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === currentStep
                        ? "w-8 bg-primary"
                        : i < currentStep
                        ? "w-1.5 bg-primary/50"
                        : "w-1.5 bg-muted"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Add shimmer animation to global CSS or component styles
const style = document.createElement('style');
style.textContent = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
`;
document.head.appendChild(style);