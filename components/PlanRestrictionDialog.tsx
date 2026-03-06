import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Lock, Zap, Check, Star } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming you have a cn utility
import { SubscriptionState } from "@/lib/utils/subscription";

export interface PlanRestrictionDialogProps {
  open: boolean;
  onClose: () => void;
  state: SubscriptionState;
  featureName?: string;
  variant?: "access" | "limit";
}

export const PlanRestrictionDialog: React.FC<PlanRestrictionDialogProps> = ({
  open,
  onClose,
  state,
  featureName = "this feature",
  variant = "access",
}) => {
  const handleAction = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({
        url: chrome.runtime.getURL("dashboard.html#/billing"),
      });
    } else {
      window.location.hash = "/billing";
    }
    onClose();
  };

  const getContent = () => {
    if (variant === "limit") {
      return {
        icon: Zap,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        title: "Usage limit reached",
        subtitle: "Upgrade Plan",
        description: `You’ve hit the limit for ${featureName}. Upgrade to scale your workflow without interruptions.`,
        buttonText: "Upgrade Limit",
        features: [
          "Increase monthly credit limits",
          "Unlock unlimited active schedules",
          "Priority support channel",
        ],
      };
    }

    switch (state) {
      case SubscriptionState.NO_PLAN:
        return {
          icon: Star,
          color: "text-blue-600",
          bg: "bg-blue-600/10",
          border: "border-blue-600/20",
          title: "Unlock Full Access",
          subtitle: "Free Trial",
          description:
            "This feature is part of our premium suite. Start your 14-day free trial to explore everything.",
          buttonText: "Start Free Trial",
          features: [
            "Full access to all tools",
            "No credit card required today",
            "Cancel anytime during trial",
          ],
        };

      case SubscriptionState.TRIAL_EXPIRED:
        return {
          icon: Lock,
          color: "text-orange-500",
          bg: "bg-orange-500/10",
          border: "border-orange-500/20",
          title: "Trial Period Ended",
          subtitle: "Trial Expired",
          description:
            "Your trial has ended. Select a plan that fits your needs to regain access to your data.",
          buttonText: "View Plans",
          features: [
            "Instantly restore full access",
            "Keep all your existing data",
            "Flexible monthly or yearly plans",
          ],
        };

      case SubscriptionState.PLAN_EXPIRED:
        return {
          icon: AlertCircle,
          color: "text-red-500",
          bg: "bg-red-500/10",
          border: "border-red-500/20",
          title: "Subscription Inactive",
          subtitle: "Action Required",
          description:
            "Your subscription payment failed or expired. Renew now to resume your automated reports.",
          buttonText: "Renew Subscription",
          features: [
            "Resume paused schedules",
            "Restore previous usage limits",
            "Zero setup required",
          ],
        };

      default:
        return {
          icon: Lock,
          color: "text-primary",
          bg: "bg-primary/10",
          border: "border-primary/20",
          title: "Premium Feature",
          subtitle: "Upgrade Required",
          description: `Upgrade your plan to unlock ${featureName} and other advanced capabilities.`,
          buttonText: "View Upgrade Options",
          features: [
            "Higher monthly limits",
            "Advanced scheduling options",
            "Priority email support",
          ],
        };
    }
  };

  const content = getContent();
  const Icon = content.icon;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="fixed left-1/2 top-1/2 z-50 w-full max-w-[400px] -translate-x-1/2 -translate-y-1/2 gap-0 overflow-hidden rounded-2xl border bg-background p-0 shadow-2xl duration-200 sm:rounded-3xl">
        
        {/* Decorative Background Gradient */}
        <div className={`absolute top-0 left-0 h-32 w-full bg-gradient-to-b ${content.bg} to-transparent opacity-60`} />

        <div className="relative flex flex-col items-center px-8 pb-8 pt-10 text-center">
          
          {/* Subtitle Badge */}
          <div className={cn(
            "mb-4 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            content.bg,
            content.color,
            content.border
          )}>
            {content.subtitle}
          </div>

          {/* Icon with Glow Ring */}
          <div className={cn(
            "mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 bg-background shadow-sm",
            content.border
          )}>
            <Icon className={cn("h-8 w-8", content.color)} />
          </div>

          {/* Text Content */}
          <div className="mb-8 space-y-2">
            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
              {content.title}
            </DialogTitle>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {content.description}
            </p>
          </div>

          {/* Feature List Card */}
          <div className="w-full rounded-xl border bg-card/50 px-4 py-5 shadow-sm mb-8">
            <div className="space-y-3">
              {content.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 text-left">
                  <div className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full", content.bg)}>
                    <Check className={cn("h-2.5 w-2.5", content.color)} strokeWidth={3} />
                  </div>
                  <span className="text-sm font-medium text-foreground/90 leading-none">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="w-full space-y-3">
            <Button 
              onClick={handleAction} 
              className={cn("w-full h-11 rounded-xl text-base font-semibold shadow-md transition-all hover:scale-[1.02]", 
                // Optional: Dynamic button color based on state, or keep it standard primary
                // "bg-primary hover:bg-primary/90" 
              )}
            >
              {content.buttonText}
            </Button>
            
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full h-10 rounded-xl text-muted-foreground hover:text-foreground hover:bg-transparent"
            >
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};