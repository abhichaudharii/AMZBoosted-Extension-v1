import React from 'react';
import { Star, Zap, TrendingUp, Check, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils'; 

interface PricingPlan {
  name: string;
  price: number | null;
  annualPrice?: number | null;
  originalPrice?: number | null;
  originalAnnualPrice?: number | null;
  popular?: boolean;
  features: string[];
}

interface PricingCardsProps {
  plans: Record<string, PricingPlan>;
  billingInterval: 'monthly' | 'annual';
  currentPlanId?: string;
  hasActiveSubscription?: boolean;
  actionLoading?: string | null;
  canStartTrial?: boolean;
  handleStartTrial: (planId: string) => void;
  openWebDashboard: () => void;
}

export const PricingCards: React.FC<PricingCardsProps> = ({
  plans,
  billingInterval,
  currentPlanId,
  hasActiveSubscription,
  actionLoading,
  canStartTrial,
  handleStartTrial,
  openWebDashboard,
}) => {
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-1">
      {Object.entries(plans).map(([planId, plan]) => {
        const isCurrentPlan = hasActiveSubscription && currentPlanId === planId;
        const isPopular = plan.popular || false;
        const Icon = planId === 'starter' ? Star : planId === 'professional' ? Zap : TrendingUp;

        // Price Calculations
        const monthlyPrice = plan.price;
        const annualPrice = plan.annualPrice || (monthlyPrice ? monthlyPrice * 12 : null);
        const originalMonthlyPrice = plan.originalPrice;
        const originalAnnualPrice = plan.originalAnnualPrice || (originalMonthlyPrice ? originalMonthlyPrice * 12 : null);

        const displayPrice = billingInterval === 'monthly' ? monthlyPrice : (annualPrice ? Math.round(annualPrice / 12) : null);
        const originalDisplayPrice = billingInterval === 'monthly' ? originalMonthlyPrice : (originalAnnualPrice ? Math.round(originalAnnualPrice / 12) : null);

        return (
          <Card
            key={planId}
            className={cn(
              "relative overflow-hidden transition-all duration-300 flex flex-col",
              // Base Styles
              "border bg-card/40 backdrop-blur-sm",
              // Popular Styles
              isPopular 
                ? "border-primary/50 shadow-xl shadow-primary/5 ring-1 ring-primary/20 scale-[1.02] z-10 bg-gradient-to-b from-primary/5 to-card/40" 
                : "border-border/40 hover:border-border/80 hover:bg-card/60 hover:shadow-lg",
              // Current Plan Styles
              isCurrentPlan && "border-green-500/50 ring-1 ring-green-500/20 bg-green-500/5"
            )}
          >
            {/* Popular Badge */}
            {isPopular && (
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />
            )}
            {isPopular && !isCurrentPlan && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-primary/90 hover:bg-primary text-primary-foreground shadow-sm text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 h-5">
                  Most Popular
                </Badge>
              </div>
            )}

            {/* Current Plan Badge */}
            {isCurrentPlan && (
              <div className="absolute top-3 right-3">
                <Badge variant="outline" className="border-green-500/50 text-green-600 bg-green-500/10 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 h-5">
                  Active
                </Badge>
              </div>
            )}

            <CardHeader className="pb-4">
              {/* Icon & Title */}
              <div className="flex items-center gap-3 mb-5">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ring-1 shadow-sm",
                  isPopular ? "from-primary/20 to-primary/5 ring-primary/30 text-primary" : "from-muted/50 to-muted/20 ring-border text-muted-foreground"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">{plan.name}</CardTitle>
                  <p className="text-xs text-muted-foreground font-normal">
                    {planId === 'starter' ? 'Perfect for individuals' : planId === 'professional' ? 'For growing teams' : 'For large scale needs'}
                  </p>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold tracking-tight text-foreground">
                    {displayPrice !== null ? `$${displayPrice}` : 'Custom'}
                  </span>
                  {displayPrice !== null && (
                    <span className="text-sm text-muted-foreground font-medium">/mo</span>
                  )}
                </div>
                
                <div className="h-5 flex items-center gap-2">
                  {originalDisplayPrice && (
                    <span className="text-xs text-muted-foreground line-through decoration-muted-foreground/50">
                      ${originalDisplayPrice}
                    </span>
                  )}
                  {billingInterval === 'annual' && displayPrice && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] text-primary bg-primary/10 hover:bg-primary/15 border-0 rounded-sm">
                      Save ${(originalDisplayPrice || 0) - (displayPrice || 0)}/mo
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col gap-6">
              {/* Action Button */}
              <Button
                className={cn(
                  "w-full h-10 font-semibold shadow-sm transition-all",
                  isPopular && !isCurrentPlan 
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20" 
                    : "",
                  isCurrentPlan 
                    ? "bg-background border border-green-500/30 text-green-600 hover:bg-green-50 hover:text-green-700"
                    : ""
                )}
                variant={isCurrentPlan ? 'outline' : isPopular ? 'default' : 'outline'}
                disabled={isCurrentPlan || !!actionLoading}
                onClick={() => {
                  if (canStartTrial) {
                    handleStartTrial(planId);
                  } else {
                    openWebDashboard();
                  }
                }}
              >
                {actionLoading === `trial-${planId}` ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...
                  </>
                ) : isCurrentPlan ? (
                  <>
                    <Check className="h-4 w-4 mr-2" /> Current Plan
                  </>
                ) : !hasActiveSubscription && canStartTrial ? (
                  'Start 14-Day Free Trial'
                ) : (
                  <>
                    Choose on Web <ExternalLink className="h-3.5 w-3.5 ml-2 opacity-70" />
                  </>
                )}
              </Button>

              {/* Features Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/40" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                  <span className={cn("bg-background px-2 text-muted-foreground", isPopular ? "bg-gradient-to-b from-transparent to-transparent" : "")}>
                    Includes
                  </span>
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-3 mb-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground/90 group">
                    <div className={cn(
                      "mt-0.5 rounded-full p-0.5 shrink-0",
                      isPopular ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                    )}>
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="leading-tight group-hover:text-foreground transition-colors">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};