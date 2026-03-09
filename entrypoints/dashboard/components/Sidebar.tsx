import { cn } from '@/lib/utils';
import { useFavorites } from '@/lib/hooks/useFavorites';
// import { tools } from '@/entrypoints/sidepanel/lib/tools'; // Removed static import
import { useRemoteTools } from '@/lib/hooks/useRemoteTools'; // Added dynamic import
import { useSubscriptionStatus, useCredits } from '@/lib/hooks/useUserData';
import {
  LayoutDashboard,
  Zap,
  FileText,
  Calendar,
  Download,
  Activity,
  Plug,
  Bell as BellIcon,
  CreditCard,
  Shield,
  BookOpen,
  LifeBuoy,
  ChevronDown,
  ChevronRight,
  Star,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SubscriptionFooter } from './sidebar/SubscriptionFooter';
import { 
  getSubscriptionState, 
  getPlanDisplayName, 
  getTrialProgress,
  SubscriptionState 
} from '@/lib/utils/subscription';
import { useMemo } from 'react';


// --- Types ---

interface NavItem {
  id: string;
  label: string;
  icon: any;
  path: string;
  children?: NavItem[];
  comingSoon?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

interface SidebarProps {
  activePath: string;
  onNavigate: (path: string) => void;
  collapsed: boolean;
}

interface SidebarItemProps {
  item: NavItem;
  depth?: number;
  activePath: string;
  collapsed: boolean;
  expandedItems: string[];
  toggleExpanded: (id: string) => void;
  onNavigate: (path: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (item: any) => void;
}

// --- Sub-Component: Sidebar Item ---

import { Lock } from 'lucide-react'; // Import Lock icon

const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  depth = 0,
  activePath,
  collapsed,
  expandedItems,
  toggleExpanded,
  onNavigate,
  isFavorite,
  toggleFavorite,
}) => {
  const Icon = item.icon;
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems.includes(item.id);
  const isActive = activePath === item.path || (hasChildren && item.children?.some(child => activePath === child.path));
  
  const isTool = depth > 0 && item.path.startsWith('/tools/');
  const toolFavorited = isTool ? isFavorite(item.id) : false;

  const handleClick = () => {
    if (item.comingSoon) {
       onNavigate(`/tools/coming-soon?name=${encodeURIComponent(item.label)}`);
       return;
    }

    // Only toggle expansion if NOT collapsed. 
    // If collapsed, we want the group icon to behave like a link to the main section path.
    if (hasChildren && !collapsed) {
      toggleExpanded(item.id);
    } else {
      onNavigate(item.path);
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite({
      id: item.id,
      type: 'tool',
      name: item.label,
      path: item.path,
    });
  };

  const Content = (
    <button
      onClick={handleClick}
      className={cn(
        'group relative w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00]/50 overflow-hidden',
        collapsed ? 'justify-center p-2 my-1 aspect-square' : 'px-4 py-2.5 my-1',
        isActive
          ? 'bg-white/5 text-white' 
          : 'text-gray-400 hover:bg-white/5 hover:text-white',
        depth > 0 && !collapsed && 'pl-10 text-xs',
        item.comingSoon && "opacity-60 grayscale hover:bg-transparent cursor-default"
      )}
    >
      {/* Active Indicator */}
      {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#FF6B00]" />
      )}

      {/* Icon or Lock */}
      <div className="relative z-10">
          <Icon className={cn(
            'shrink-0 transition-all duration-300',
            collapsed ? 'h-4 w-4' : 'h-4 w-4',
            isActive ? 'text-white' : 'text-gray-500 group-hover:text-white'
          )} />
          {item.comingSoon && (
              <div className="absolute -bottom-1 -right-1 bg-[#1A1A1C] rounded-full p-[1px] border border-white/10">
                  <Lock className="w-2 h-2 text-gray-500" />
              </div>
          )}
      </div>

      {!collapsed && (
        <>
          <span className={cn("flex-1 text-left truncate flex items-center gap-2 relative z-10 transition-colors", isActive ? "font-semibold" : "")}>
              {item.label}
              {item.comingSoon && <span className="text-[10px] text-gray-500 font-normal border border-white/10 px-1.5 py-0.5 rounded-md ml-auto bg-white/5">Soon</span>}
          </span>
          {hasChildren && (
            <div className="text-gray-500 group-hover:text-white/70 transition-colors">
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </div>
          )}
        </>
      )}
    </button>
  );

  return (
    <div className="relative">
      <div className="relative group/item">
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>{Content}</TooltipTrigger>
            <TooltipContent side="right" className="font-medium flex items-center gap-2 bg-[#1A1A1C] border-white/10 text-white shadow-xl backdrop-blur-xl">
              {item.label}
              {hasChildren && <Badge variant="outline" className="text-[10px] h-4 px-1 border-white/20 text-gray-300">Group</Badge>}
            </TooltipContent>
          </Tooltip>
        ) : (
          Content
        )}

        {isTool && !collapsed && !item.comingSoon && ( // Don't show favorite for coming soon
          <button
            onClick={handleFavorite}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all z-20",
              toolFavorited 
                ? "opacity-100 text-amber-400 hover:bg-amber-400/10" 
                : "opacity-0 group-hover/item:opacity-100 text-gray-600 hover:text-amber-400 hover:bg-white/5"
            )}
          >
            <Star className={cn("h-3 w-3", toolFavorited && "fill-current")} />
          </button>
        )}
      </div>

      {hasChildren && isExpanded && !collapsed && (
        <div className="animate-in slide-in-from-left-2 fade-in duration-300 space-y-0.5 mt-1 mb-2 relative">
           {/* Connecting Line for Sub-items */}
           <div className="absolute left-[26px] top-0 bottom-2 w-px bg-gradient-to-b from-white/10 to-transparent" />
           
          {item.children!.map((child) => (
            <SidebarItem
              key={child.id}
              item={child}
              depth={depth + 1}
              activePath={activePath}
              collapsed={collapsed}
              expandedItems={expandedItems}
              toggleExpanded={toggleExpanded}
              onNavigate={onNavigate}
              isFavorite={isFavorite}
              toggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main Sidebar Component ---

export const Sidebar: React.FC<SidebarProps> = ({ activePath, onNavigate, collapsed }) => {
  const { tools } = useRemoteTools();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [expandedItems, setExpandedItems] = useState<string[]>(['tools']);
  const [recentToolIds, setRecentToolIds] = useState<string[]>([]);
  
  // Base navigation items
  const navSections = useMemo((): NavSection[] => {
    const toolsItem: NavItem = {
      id: 'tools',
      label: 'Tools & AI',
      icon: Zap,
      path: '/tools',
      children: tools
        .filter(t => t.enabled)
        .sort((a, b) => {
          const aFav = isFavorite(a.id);
          const bFav = isFavorite(b.id);
          if (aFav && !bFav) return -1;
          if (!aFav && bFav) return 1;
          const aRecent = recentToolIds.indexOf(a.id);
          const bRecent = recentToolIds.indexOf(b.id);
          if (aRecent > -1 && bRecent > -1) return aRecent - bRecent;
          if (aRecent > -1) return -1;
          if (bRecent > -1) return 1;
          return 0;
        })
        .map(tool => ({
          id: tool.id,
          label: tool.name,
          icon: tool.icon,
          path: `/tools/${tool.id}`,
          comingSoon: tool.comingSoon
        }))
    };

    return [
      {
        label: 'General',
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
          { id: 'reports', label: 'Reports', icon: FileText, path: '/reports' },
        ]
      },
      {
        label: 'Intelligence',
        items: [toolsItem]
      },
      {
        label: 'Workflows',
        items: [
          { id: 'schedules', label: 'Schedules', icon: Calendar, path: '/schedules' },
          { id: 'exports', label: 'Exports', icon: Download, path: '/exports' },
          { id: 'activity', label: 'Activity Log', icon: Activity, path: '/activity' },
        ]
      },
      {
        label: 'Account & Billing',
        items: [
          { id: 'credit-history', label: 'Credit History', icon: Zap, path: '/credit-history' },
          { id: 'integrations', label: 'Integrations', icon: Plug, path: '/integrations' },
          { id: 'notifications', label: 'Notifications', icon: BellIcon, path: '/notifications' },
          { id: 'billing', label: 'Billing', icon: CreditCard, path: '/billing' },
          { id: 'account', label: 'Account', icon: Shield, path: '/account' },
        ]
      },
      {
        label: 'Support',
        items: [
          { id: 'changelog', label: 'Changelog', icon: BookOpen, path: '/changelog' },
          { id: 'support', label: 'Support', icon: LifeBuoy, path: '/support' },
        ]
      }
    ];
  }, [tools, isFavorite, recentToolIds]);

  // FIX: Use prop instead of local state
  // const [collapsed, setCollapsed] = useState<boolean>(...);

  
  // Fetch recent tools from local history
  useEffect(() => {
    const loadRecents = async () => {
        try {
            const { indexedDBService } = await import('@/lib/services/indexed-db.service');
            const tasks = await indexedDBService.getAllTasks();
            
            // Sort by createdAt descending
            const sorted = tasks.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            
            // Extract unique tool IDs
            const uniqueIds = Array.from(new Set(sorted.map(t => t.toolId)));
            setRecentToolIds(uniqueIds.slice(0, 10)); // Keep top 10 most recent
        } catch (e) {
            console.error('Failed to load recent tools', e);
        }
    };
    loadRecents();
  }, [activePath]); // Refresh when navigating (assumption: running a tool triggers nav or we return here)
  
  // User Data State via Hook
  const { status: subscriptionStatusData } = useSubscriptionStatus();
  const { credits } = useCredits();
  const subscriptionState = getSubscriptionState(subscriptionStatusData);
  


  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // const isPremium = subscriptionState === SubscriptionState.PLAN_ACTIVE;
  // const cta = getSubscriptionCTA(subscriptionState, 'sidebar');
  const trialProgress = subscriptionStatusData?.trialEndsAt ? (getTrialProgress(subscriptionStatusData.trialEndsAt) ?? undefined) : undefined;
  
  // Get plan display name - check multiple possible locations
  const planId = subscriptionStatusData?.planId || subscriptionStatusData?.currentPlan;
  const planDisplayName = (subscriptionState === SubscriptionState.PLAN_ACTIVE && planId) 
    ? getPlanDisplayName(planId) 
    : 'No Active Plan';

  return (
    <div 
      className={cn(
        "relative flex flex-col border-r border-white/5 bg-[#0A0A0B]/80 backdrop-blur-xl transition-all duration-300 ease-in-out h-full z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.5)]",
        collapsed ? "w-[64px]" : "w-[260px]"
      )}
    >
      {/* Header / Toggle */}
      <div className={cn(
        "flex items-center h-[64px] border-b border-white/5 px-4 mb-2 sticky top-0 bg-[#0A0A0B]/50 backdrop-blur-md z-30",
        collapsed ? "justify-center px-0" : "justify-between"
      )}>
        {/* LOGO (Only when expanded) */}
        <div className={cn(
           "flex items-center transition-all duration-300 ease-in-out", 
           collapsed ? "gap-0" : "gap-3 px-1"
        )}>
            <div className={cn(
                "flex-shrink-0 transition-all duration-300",
                collapsed ? "w-8 h-8" : "w-10 h-10"
            )}>
                <img 
                    src="/amzboosted_logo.png" 
                    alt="AMZBoosted" 
                    className="w-full h-full object-contain"
                />
            </div>
            
            <div className={cn(
               "flex flex-col overflow-hidden transition-all duration-300 ease-in-out origin-left",
               collapsed ? "w-0 opacity-0 scale-95" : "w-auto opacity-100 scale-100"
            )}>
               <span className="font-extrabold text-lg tracking-tight text-white block leading-none whitespace-nowrap">
                   AMZ<span className="text-[#FF6B00]">Boosted</span>
               </span>
               <span className="text-[10px] text-gray-500 font-medium tracking-wide uppercase whitespace-nowrap">Seller Tools</span>
            </div>
        </div>
      </div>

      {/* Navigation Area */}
      <ScrollArea className="flex-1 py-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <nav className={cn("space-y-1 transition-all duration-300", collapsed ? "px-2" : "px-3")}>
          {navSections.map((section, idx) => (
            <div key={section.label} className={cn(idx > 0 && "mt-6")}>
              {!collapsed && (
                <div className="px-4 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">
                    {section.label}
                  </span>
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <SidebarItem
                    key={item.id}
                    item={item}
                    activePath={activePath}
                    collapsed={collapsed}
                    expandedItems={expandedItems}
                    toggleExpanded={toggleExpanded}
                    onNavigate={onNavigate}
                    isFavorite={isFavorite}
                    toggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
              {idx < navSections.length - 1 && !collapsed && (
                 <div className="mx-4 mt-6 h-px bg-white/5 opacity-50" />
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* --- Footer: Plan Status / Upgrade --- */}
      <div className="sticky bottom-0 bg-[#0A0A0B]/80 backdrop-blur-md p-0 border-t border-white/5 z-30">
        <SubscriptionFooter
            collapsed={collapsed}
            subscriptionState={subscriptionState}
            trialProgress={trialProgress}
            planDisplayName={planDisplayName}
            credits={credits ? {
                used: credits.used,
                total: credits.total,
                resetsAt: credits.resetsAt
            } : undefined}
            onNavigate={onNavigate}
        />
      </div>
    </div>
  );
};