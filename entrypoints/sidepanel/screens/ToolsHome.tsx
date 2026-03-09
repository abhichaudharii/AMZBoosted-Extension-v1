import { 
  Zap, ChevronRight, ChevronDown, Search, X
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { cn } from '@/lib/utils';
import React, { useState, useEffect, useMemo } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');
  
  // Predefined order for categories
  const CATEGORY_ORDER = [
    'Listing Optimization',
    'Product Research',
    'Competitor Analysis',
    'Customer Intelligence',
    'Inventory Management',
    'Performance Reports',
    'Business Reports',
    'PPC & Advertising'
  ];

  // Group and Sort tools by category with Search filter
  const sections = React.useMemo(() => {
    const groups: Record<string, any[]> = {};
    const normalizedQuery = searchQuery.toLowerCase().trim();
    
    // 1. Filter and Group enabled tools
    tools
      .filter(t => t.enabled)
      .filter(t => {
          if (!normalizedQuery) return true;
          return t.name.toLowerCase().includes(normalizedQuery) || 
                 (t.description?.toLowerCase().includes(normalizedQuery)) ||
                 (t.category?.toLowerCase().includes(normalizedQuery));
      })
      .forEach(tool => {
        const cat = tool.category || 'General';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(tool);
      });

    // 2. Map to section objects and sort
    const sortedSections = Object.entries(groups)
      .map(([category, items]) => {
        const id = category.toLowerCase().replace(/\s+/g, '-');
        const theme = getThemeForCategory(category);
        
        // Alphabetical sort within category
        const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name));

        return {
          id,
          title: category,
          description: `${items.length} tool${items.length > 1 ? 's' : ''}`,
          items: sortedItems,
          theme,
          // Default to open only for the first two categories if not in storage
          // OR if searching, open everything that matches
          defaultOpen: normalizedQuery !== '' || (CATEGORY_ORDER.indexOf(category) < 2 && CATEGORY_ORDER.indexOf(category) !== -1)
        };
      })
      // Predefined category sort
      .sort((a, b) => {
        const indexA = CATEGORY_ORDER.indexOf(a.title);
        const indexB = CATEGORY_ORDER.indexOf(b.title);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.title.localeCompare(b.title);
      });

    return sortedSections;
  }, [tools, searchQuery]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Initial Load from Storage
  useEffect(() => {
    secureStorage.get(['amz_boosted_section_states']).then((result) => {
      if (result.amz_boosted_section_states) {
        setOpenSections(result.amz_boosted_section_states);
      }
      setIsLoaded(true);
    });
  }, []);

  // Sync defaults if not set in storage after sections load
  useEffect(() => {
    if (isLoaded && sections.length > 0) {
      setOpenSections(prev => {
        const next = { ...prev };
        let changed = false;
        sections.forEach(s => {
          if (next[s.id] === undefined) {
            next[s.id] = s.defaultOpen;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [isLoaded, sections]);

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
        
        {/* Search Bar */}
        <div className="px-3 pt-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" />
            <input 
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1A1A1C]/40 border border-white/5 rounded-xl py-2.5 pl-10 pr-10 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-white/10 focus:bg-[#1A1A1C]/60 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="h-3 w-3 text-zinc-500" />
              </button>
            )}
          </div>
        </div>

        {/* 2. SCROLLABLE CONTENT */}
        <ScrollArea className="flex-1">
          <div className="p-3 pb-6 space-y-3">
            
            {sections.length === 0 && searchQuery && (
              <div className="py-12 text-center space-y-2">
                <p className="text-zinc-400 text-sm font-medium">No tools found</p>
                <p className="text-zinc-600 text-xs">Try a different search term</p>
              </div>
            )}
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