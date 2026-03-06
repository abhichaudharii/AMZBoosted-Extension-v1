import React, { useState, useEffect } from 'react';
import { 
  Zap, ChevronRight, ChevronDown
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { cn } from '@/lib/utils';
import { useRemoteTools } from '@/lib/hooks/useRemoteTools'; // Dynamic Import
import { ScrollArea } from '@/components/ui/scroll-area';
import { secureStorage } from '@/lib/storage/secure-storage';

// Helper to get color styles based on theme/category
const getColorStyles = (theme: string) => {
  const styles: Record<string, any> = {
    violet: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'group-hover:border-purple-500/20',
      accent: 'bg-purple-500',
      hoverText: 'group-hover:text-purple-400',
      iconRing: 'ring-purple-500/20'
    },
    indigo: {
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-400',
        border: 'group-hover:border-indigo-500/20',
        accent: 'bg-indigo-500',
        hoverText: 'group-hover:text-indigo-400',
        iconRing: 'ring-indigo-500/20'
    },
    blue: {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'group-hover:border-blue-500/20',
        accent: 'bg-blue-500',
        hoverText: 'group-hover:text-blue-400',
        iconRing: 'ring-blue-500/20'
    },
    emerald: {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'group-hover:border-emerald-500/20',
        accent: 'bg-emerald-500',
        hoverText: 'group-hover:text-emerald-400',
        iconRing: 'ring-emerald-500/20'
    },
    amber: {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'group-hover:border-amber-500/20',
        accent: 'bg-orange-500', // Kept orange for amber/orange mapping consistency
        hoverText: 'group-hover:text-amber-400',
        iconRing: 'ring-amber-500/20'
    },
    rose: {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        border: 'group-hover:border-rose-500/20',
        accent: 'bg-rose-500',
        hoverText: 'group-hover:text-rose-400',
        iconRing: 'ring-rose-500/20'
    },
    cyan: {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400',
        border: 'group-hover:border-cyan-500/20',
        accent: 'bg-cyan-500',
        hoverText: 'group-hover:text-cyan-400',
        iconRing: 'ring-cyan-500/20'
    },
    slate: {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'group-hover:border-slate-500/20',
        accent: 'bg-slate-500',
        hoverText: 'group-hover:text-slate-400',
        iconRing: 'ring-slate-500/20'
    }
  };
  return styles[theme] || styles.slate;
};

// Fallback logic in case theme is missing in data
const getThemeForCategory = (category: string = ''): string => {
  const lower = category.toLowerCase();
  
  if (lower.includes('customer')) return 'rose';
  if (lower.includes('ai') || lower.includes('intelligence')) return 'violet';
  if (lower.includes('list') || lower.includes('optimiz')) return 'blue';
  if (lower.includes('price') || lower.includes('money') || lower.includes('finance')) return 'emerald';
  if (lower.includes('research') || lower.includes('market') || lower.includes('keyword')) return 'amber';
  if (lower.includes('bulk') || lower.includes('data') || lower.includes('export')) return 'cyan';
  if (lower.includes('alert') || lower.includes('monitor') || lower.includes('track')) return 'rose';
  
  if (lower.includes('advert') || lower.includes('ppc')) return 'amber';
  if (lower.includes('business') || lower.includes('fulfill')) return 'blue';
  if (lower.includes('analyt') || lower.includes('emerald')) return 'emerald';
  
  return 'slate'; // Default return
};

interface ToolsHomeProps {
  onSelectTool: (tool: any) => void;
  onOpenDashboard: () => void;
  onViewAsins?: () => void;
}

export const ToolsHome: React.FC<ToolsHomeProps> = ({
  onSelectTool,
  onOpenDashboard,
}) => {
  const { tools } = useRemoteTools();
  
  // Group tools by category
  const sections = React.useMemo(() => {
    const groups: Record<string, any[]> = {};
    // Only show enabled tools
    tools.filter(t => t.enabled).forEach(tool => {
      if (!groups[tool.category]) {
        groups[tool.category] = [];
      }
      groups[tool.category].push(tool);
    });

    return Object.entries(groups).map(([category, items]) => {
      let displayTitle = category;
      if (category.toLowerCase() === 'business_reports') {
        displayTitle = 'Business Reports';
      }

      const firstItem = items[0];
      let itemTheme = firstItem?.colorTheme || firstItem?.theme; 
      
      if (displayTitle === 'Business Reports') {
          itemTheme = 'violet'; 
      }

      const theme = (typeof itemTheme === 'string' ? itemTheme : '') || getThemeForCategory(category);

      return {
        id: category.toLowerCase().replace(/\s+/g, '-'),
        title: displayTitle,
        description: `${items.length} tools available`,
        items,
        theme,
        defaultOpen: true
      };
    });
  }, [tools]);

  // Initialize state with defaults
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    return {}; 
  });

  // Sync openSections when sections change (tools loaded)
  useEffect(()=> {
      if (sections.length > 0) {
         setOpenSections(prev => {
             const next = { ...prev };
             sections.forEach(s => {
                 if (next[s.id] === undefined) {
                     next[s.id] = s.defaultOpen;
                 }
             });
             return next;
         });
      }
  }, [sections]);

  // Load persisted states from Chrome storage on mount
  useEffect(() => {
    secureStorage.get(['amz_boosted_section_states']).then((result) => {
      if (result.amz_boosted_section_states) {
        setOpenSections((prev) => ({
          ...prev,
          ...result.amz_boosted_section_states
        }));
      }
    });
  }, []);

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const newState = {
        ...prev,
        [id]: !prev[id]
      };
      secureStorage.set({ amz_boosted_section_states: newState });
      return newState;
    });
  };

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0B] font-sans text-foreground">
      {/* 1. COMPACT HEADER */}
      <Navbar 
        title="AMZBoosted" 
        icon={Zap} 
        onOpenDashboard={onOpenDashboard} 
        className="px-4 py-3 h-14" 
      />

      <div className="flex-1 flex flex-col min-h-0 relative">
        
        {/* 2. SCROLLABLE CONTENT */}
        <ScrollArea className="flex-1">
          <div className="p-3 pb-6 space-y-3">
            
            {sections.map((section) => {
              if (section.items.length === 0) return null;

              return (
                <div key={section.id} className="rounded-xl border border-white/5 bg-[#1A1A1C]/20 overflow-hidden">
                  {/* Section Header */}
                  <button 
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors group"
                  >
                      <div className="text-left">
                          <h3 className="text-sm font-bold text-white/90 capitalize group-hover:text-white transition-colors">{section.title}</h3>
                          {!openSections[section.id] && (
                              <p className="text-[10px] text-zinc-500">{section.description}</p>
                          )}
                      </div>
                      <ChevronDown 
                          className={cn(
                              "h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-all duration-200",
                              openSections[section.id] ? "transform rotate-180" : ""
                          )} 
                      />
                  </button>

                  {/* Section Items */}
                  {openSections[section.id] && (
                      <div className="p-1 pt-0 space-y-1 animate-in slide-in-from-top-1 fade-in duration-200">
                          <div className="h-px bg-white/5 mx-3 mb-2" />
                          {section.items.map((tool: any, idx: number) => (
                              <ToolItem 
                                  key={tool.id} 
                                  tool={tool} 
                                  theme={section.theme} 
                                  onClick={() => onSelectTool(tool)}
                                  index={idx}
                              />
                          ))}
                      </div>
                  )}
                </div>
              );
            })}

          </div>
        </ScrollArea>
        
        {/* Footer Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0A0A0B] to-transparent pointer-events-none" />
      </div>
    </div>
  );
};

// --- HELPER COMPONENT FOR INDIVIDUAL TOOLS ---
const ToolItem = ({ tool, theme, onClick, index = 0 }: any) => {
    const styles = getColorStyles(theme);
    
    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent mx-2 mb-1",
                "bg-transparent hover:bg-[#1A1A1C]/60 hover:shadow-md hover:border-white/5",
                styles.border
            )}
            style={{ animationDelay: `${index * 0.05}s` }}
        >
            {/* Active Accent */}
            <div className={cn(
                "absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity",
                styles.accent
            )} />

            {/* Icon */}
            <div className={cn(
                "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
                "bg-[#1A1A1C] border border-white/5 group-hover:scale-105",
                styles.bg,
                styles.text,
                styles.iconRing && `group-hover:ring-1 ${styles.iconRing}`
            )}>
                {React.createElement(tool.icon, { className: "w-5 h-5" })}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                <h4 className={cn(
                    "text-sm font-semibold text-zinc-300 transition-colors truncate",
                    styles.hoverText,
                    "group-hover:text-white"
                )}>
                    {tool.name}
                </h4>
                <p className="text-[11px] text-zinc-600 line-clamp-1 group-hover:text-zinc-500 transition-colors">
                    {tool.description}
                </p>
            </div>

            {/* Arrow */}
            <ChevronRight className="w-4 h-4 text-zinc-700 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
        </div>
    );
};