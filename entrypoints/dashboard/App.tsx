import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardLayout } from './components/DashboardLayout';
import { CommandPalette } from './components/CommandPalette';
import { OnboardingFlow } from './components/OnboardingFlow';
import { OfflineIndicator } from './components/OfflineIndicator';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/lib/contexts/ThemeContext';
import { UserProvider } from '@/lib/contexts/UserContext';
import { KeyboardShortcutsDialog } from '@/components/keyboard-shortcuts/KeyboardShortcutsDialog';
import { ScrollProgress } from '@/components/ui/scroll-progress';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSubscriptionStatus } from '@/lib/hooks/useUserData';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { getSubscriptionState, SubscriptionState } from '@/lib/utils/subscription';

// Lazy load pages for better code splitting
const DashboardHome = React.lazy(() => import('./pages/DashboardHome').then(m => ({ default: m.DashboardHome })));
// Feature Pages
const ReportsPage = React.lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const SchedulesPage = React.lazy(() => import('./pages/SchedulesPage').then(m => ({ default: m.SchedulesPage })));
const ExportsPage = React.lazy(() => import('./pages/ExportsPage').then(m => ({ default: m.ExportsPage })));
// Generic Tool Page
const GenericToolPage = React.lazy(() => import('./pages/tools/GenericToolPage').then(m => ({ default: m.GenericToolPage })));
const PriceTrackerPage = React.lazy(() => import('./pages/tools/PriceTrackerPage').then(m => ({ default: m.PriceTrackerPage })));

import { toolDefinitions } from '@/lib/tool-definitions';


const IntegrationsPage = React.lazy(() => import('./pages/IntegrationsPage').then(m => ({ default: m.IntegrationsPage })));
const BillingPage = React.lazy(() => import('./pages/BillingPage').then(m => ({ default: m.BillingPage })));
const NotificationsPage = React.lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const AccountPage = React.lazy(() => import('./pages/AccountPage').then(m => ({ default: m.AccountPage })));
const ChangelogPage = React.lazy(() => import('./pages/ChangelogPage').then(m => ({ default: m.ChangelogPage })));
const SupportPage = React.lazy(() => import('./pages/SupportPage').then(m => ({ default: m.SupportPage })));
const AuthPage = React.lazy(() => import('./pages/AuthPage').then(m => ({ default: m.AuthPage })));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const ActivityPage = React.lazy(() => import('./pages/ActivityPage').then(m => ({ default: m.ActivityPage })));
const CreditHistoryPage = React.lazy(() => import('./pages/CreditHistoryPage').then(m => ({ default: m.CreditHistoryPage })));
const AllToolsPage = React.lazy(() => import('./pages/AllToolsPage'));
import { Skeleton } from '@/components/ui/skeleton';
import LoadingScreen from '@/components/ui/loading-screen';

// Enhanced loading screen component with animations

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, authenticated } = useAuth();
  const { status: subscriptionStatus } = useSubscriptionStatus();
  useAnalytics(); // Auto-track page views

  const subState = getSubscriptionState(subscriptionStatus);
  const activePlanId = subState === SubscriptionState.PLAN_ACTIVE 
      ? (subscriptionStatus?.planId || subscriptionStatus?.currentPlan || 'no_plan')
      : 'no_plan';

  const [showShortcuts, setShowShortcuts] = useState(false);

  // Handle navigation shortcuts
  useEffect(() => {
    const handleNavigateEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      navigate(customEvent.detail.path);
    };

    window.addEventListener('navigate-to', handleNavigateEvent);
    return () => {
      window.removeEventListener('navigate-to', handleNavigateEvent);
    };
  }, [navigate]);

  // Session validation on mount (handled by useAuth hook)
  useEffect(() => {
    if (authenticated && user) {
      // Session validation is already handled by useAuth hook
    }
  }, [authenticated, user]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Show shortcuts dialog with ?
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcuts(true);
      }

      // Navigation shortcuts with Alt
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            navigate('/');
            break;
          case '2':
            e.preventDefault();
            navigate('/reports');
            break;
          case '3':
            e.preventDefault();
            navigate('/schedules');
            break;
          case '4':
            e.preventDefault();
            navigate('/exports');
            break;
          case '5':
            e.preventDefault();
            navigate('/integrations');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  // Generate breadcrumbs based on current path
  const getBreadcrumbs = () => {
    const path = location.pathname;
    const breadcrumbs: Array<{ label: string; path?: string }> = [];

    // Tool pages
    if (path.startsWith('/tools/')) {
      breadcrumbs.push({ label: 'Tools', path: '/tools' });


      if (path === '/tools/coming-soon') {
        breadcrumbs.push({ label: 'Coming Soon' });
        return breadcrumbs;
      }

      const toolName = path.split('/tools/')[1];
      const toolDef = toolDefinitions.find(t => t.id === toolName);

      if (toolDef) {
        breadcrumbs.push({ label: toolDef.name });
      } else {
        // Fallback for unknown tools - prettify ID
        const prettified = toolName
          ?.split('-')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        if (prettified) breadcrumbs.push({ label: prettified });
      }
    }

    return breadcrumbs;
  };

  // Show loading screen while checking auth
  if (loading) {
    return <LoadingScreen />;
  }

  // Show auth page if not authenticated
  if (!authenticated || !user) {
    // Redirect all routes to auth except /auth
    if (location.pathname !== '/auth') {
      return <Navigate to="/auth" replace />;
    }
    return <AuthPage />;
  }

  // Redirect /auth to dashboard if already authenticated
  if (location.pathname === '/auth') {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      {/* Global Components */}
      <CommandPalette />
      <OnboardingFlow />
      <OfflineIndicator />
      <KeyboardShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />

      <DashboardLayout
        currentPath={location.pathname}
        onNavigate={handleNavigate}
        userName={user.name || user.email || 'User'}
        userEmail={user.email || ''}
        // Fix: Use 'plan' from User interface, fallback to 'planId' or 'starter'
        breadcrumbs={getBreadcrumbs()}
        // Fix: Only show plan badge if subscription is strictly active
        plan={activePlanId as any}
      >
        <React.Suspense fallback={
          <div className="p-8 space-y-4 animate-in fade-in duration-300">
            <div className="space-y-3">
              <Skeleton className="h-10 w-64 animate-pulse" />
              <Skeleton className="h-5 w-96 animate-pulse" style={{ animationDelay: '100ms' }} />
            </div>
            <div className="grid gap-4 pt-4" style={{ animationDelay: '200ms' }}>
              <Skeleton className="h-48 w-full animate-pulse" />
              <Skeleton className="h-48 w-full animate-pulse" style={{ animationDelay: '150ms' }} />
            </div>
          </div>
        }>
        {/* Add page transition animation */}
        <div key={location.pathname} className="animate-in fade-in slide-in-from-right-4 duration-300">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/home" element={<DashboardHome />} />

        <Route path="/tools" element={<AllToolsPage />} />
        {/* <Route path="/tools/price-tracker" element={<PriceTrackerPage />} /> */}
        <Route path="/tools/:toolId" element={<GenericToolPage />} />

        {/* Global Pages */}
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/schedules" element={<SchedulesPage />} />
        <Route path="/exports" element={<ExportsPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/credit-history" element={<CreditHistoryPage />} />
        <Route path="/account" element={<AccountPage />} />
            <Route path="/changelog" element={<ChangelogPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/auth" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        </React.Suspense>
      </DashboardLayout>
    </>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TooltipProvider delayDuration={300}>
          <HashRouter>
            <UserProvider>
              <ScrollProgress />
              <ScrollToTop />
              <AppContent />
              <Toaster 
                position="top-right" 
                richColors 
                closeButton 
                expand={true} 
                visibleToasts={4}
                offset={80} // Push down below navbar (approx 64px + padding)
                toastOptions={{
                  className: 'group right-0 translate-x-full data-[visible=true]:translate-x-0 transition-all duration-300 ease-in-out',
                  style: {
                      // Ensure it slides from right and sits below navbar
                      right: 0,
                  }
                }}
              />
            </UserProvider>
          </HashRouter>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};