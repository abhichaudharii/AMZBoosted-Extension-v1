import React from 'react';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';

interface Breadcrumb {
  label: string;
  path?: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
  userName: string;
  userEmail: string;
  plan: 'no_plan' | 'starter' | 'professional' | 'business' | 'enterprise';
  breadcrumbs?: Breadcrumb[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  currentPath,
  onNavigate,
  userName,
  userEmail,
  plan,
  breadcrumbs,
}) => {
  // Initialize from storage or default to false
  const [collapsed, setCollapsed] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar_collapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(newState));
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[#0A0A0B] text-foreground font-sans selection:bg-[#FF6B00]/30">
      {/* Premium Background Layers */}
      <div className="absolute inset-0 bg-[#0A0A0B]" />
       {/* Ambient Orbs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#FF6B00]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#FF8533]/5 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Grid Pattern Overlay (Optional, consistent with Reports) */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.02] pointer-events-none" />


      {/* Main Content Wrapper - Relative z-10 to sit above background */}
      <div className="relative z-10 flex h-full w-full">
        {/* Sidebar */}
        <Sidebar 
          activePath={currentPath} 
          onNavigate={onNavigate} 
          collapsed={collapsed}
        />

        {/* Main Content */}
        <div className="flex flex-1 flex-col min-w-0 bg-transparent relative">
          {/* Top Navigation */}
          <TopNav
            userName={userName}
            userEmail={userEmail}
            plan={plan}
            onNavigate={onNavigate}
            breadcrumbs={breadcrumbs}
            onToggleSidebar={toggleSidebar}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-auto bg-transparent relative scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
