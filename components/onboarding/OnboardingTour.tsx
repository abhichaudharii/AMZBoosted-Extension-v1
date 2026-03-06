import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, TooltipRenderProps } from 'react-joyride';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ChevronRight, ChevronLeft, Zap, Rocket, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingTourProps {
  type: 'dashboard' | 'sidepanel';
}

// --- 1. PREMIUM CUSTOM TOOLTIP COMPONENT ---
const CustomTooltip = ({
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  isLastStep,
  size,
}: TooltipRenderProps) => {
  return (
    <Card
      {...tooltipProps}
      className="max-w-[400px] w-full border-primary/20 shadow-2xl bg-popover/95 backdrop-blur-sm p-0 overflow-hidden relative"
    >
      {/* Decorative Gradient Top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

      <div className="p-5">
        {/* Header: Title & Close */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            {/* Optional: Dynamic Icon based on step could go here */}
            <div className="p-1.5 bg-primary/10 rounded-md text-primary">
               {index === 0 ? <Rocket className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            </div>
            {step.title && (
              <h3 className="font-bold text-lg leading-tight tracking-tight">
                {step.title}
              </h3>
            )}
          </div>
          <button
            {...closeProps}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="text-sm text-muted-foreground leading-relaxed mb-6 pl-1">
          {step.content}
        </div>

        {/* Footer: Progress & Buttons */}
        <div className="flex items-center justify-between pt-2">
          {/* Progress Dots */}
          <div className="flex gap-1.5">
            {Array.from({ length: size }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === index ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                )}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {index > 0 && (
              <Button
                variant="ghost"
                size="sm"
                {...backProps}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
            
            <Button
              size="sm"
              {...primaryProps}
              className={cn(
                "shadow-lg shadow-primary/20",
                isLastStep ? "bg-emerald-600 hover:bg-emerald-700" : ""
              )}
            >
              {isLastStep ? (
                <>
                  Get Started <Check className="w-4 h-4 ml-1.5" />
                </>
              ) : (
                <>
                  Next <ChevronRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export function OnboardingTour({ type }: OnboardingTourProps) {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Check if user has seen tour
    const tourKey = `amzboosted_tour_${type}_completed`;
    const hasSeenTour = localStorage.getItem(tourKey);

    if (!hasSeenTour) {
      // Delay tour start to allow page to render fully
      const timer = setTimeout(() => setRun(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [type]);

  // --- DASHBOARD STEPS CONFIG ---
  const dashboardSteps: Step[] = [
    {
      target: 'body',
      title: 'Welcome to AMZBoosted! 🚀',
      content: "Let's take a quick tour of your new Amazon seller super-toolkit. We'll show you how to save hours of research time.",
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="command-palette"]',
      title: 'Power User Access',
      content: (
        <span>
          Press <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[10px] font-mono mx-1">Cmd+K</kbd> 
          at any time to open the Command Palette. It's the fastest way to jump between tools.
        </span>
      ),
    },
    {
      target: '[data-tour="theme-toggle"]',
      title: 'Your Workspace',
      content: "Customize your viewing experience. Switch between Light, Dark, or System themes to match your workflow.",
    },
    {
      target: '[data-tour="sidebar-tools"]',
      title: '8 Powerful Tools',
      content: "Access your complete suite here. From Review Analysis to Inventory Alerts, everything is one click away.",
    },
    {
      target: '[data-tour="favorites"]',
      title: 'Quick Access',
      content: "Use the Star icon on any tool card to pin it here. Keep your most used tools ready for action.",
    },
  ];

  // --- SIDE PANEL STEPS CONFIG ---
  const sidepanelSteps: Step[] = [
    {
      target: 'body',
      title: 'AMZBoosted Sidepanel 📌',
      content: "Analyze Amazon products without leaving the page. This panel stays with you as you browse.",
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="quick-extract"]',
      title: 'Quick Extract',
      content: "Found a product? Click here to instantly pull data from the active browser tab.",
    },
    {
      target: '[data-tour="url-input"]',
      title: 'Deep Analysis',
      content: "Paste any ASIN or URL here to start a background analysis job while you keep browsing.",
    },
  ];

  const steps = type === 'dashboard' ? dashboardSteps : sidepanelSteps;

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem(`amzboosted_tour_${type}_completed`, 'true');
      setRun(false);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      disableOverlayClose={true} // Force user to use buttons or skip
      tooltipComponent={CustomTooltip} // <--- Injecting the premium UI
      callback={handleJoyrideCallback}
      floaterProps={{
        hideArrow: false,
      }}
      styles={{
        options: {
          zIndex: 10000,
          // Colors are handled by Tailwind, but these are fallbacks
          primaryColor: '#2563eb', 
          overlayColor: 'rgba(0, 0, 0, 0.6)', 
        },
        spotlight: {
          borderRadius: 8, // Softer spotlight edges
        },
      }}
    />
  );
}

// Hook to reset tour manually (e.g. from Settings)
export function useResetTour(type: 'dashboard' | 'sidepanel') {
  const resetTour = () => {
    localStorage.removeItem(`amzboosted_tour_${type}_completed`);
    window.location.reload();
  };
  return { resetTour };
}