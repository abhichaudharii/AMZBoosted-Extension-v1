import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  ArrowRight,
  Zap,
  Star,
  Lock,
  Clock,
  Search,
  LayoutGrid, 
  List
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { cn } from '@/lib/utils';
import { useRemoteTools } from '@/lib/hooks/useRemoteTools';
import { PageLoading } from '@/components/ui/page-loading';
import type { Tool, ToolTheme } from '@/entrypoints/sidepanel/lib/tools';

// --- 1. THEME DEFINITIONS ---

export type ColorTheme = ToolTheme;

interface ExtendedTool extends Tool {
  credits: number;
}

// Updated Premium Styles map
export const getColorStyles = (theme: ColorTheme = 'slate') => {
  const styles: Record<ColorTheme, {
    iconBg: string; // The box behind the icon
    iconColor: string; // The icon itself
    border: string; // Card border
    hoverBorder: string; // Card border on hover
    badge: string; // Category badge
    glow: string; // The ambient glow behind the card content
    textHover: string; // Title hover color
  }> = {
    violet: {
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
      border: 'border-purple-500/10',
      hoverBorder: 'group-hover:border-purple-500/30',
      badge: 'bg-purple-500/10 text-purple-300 border-purple-500/10',
      glow: 'from-purple-500/5 to-transparent',
      textHover: 'group-hover:text-purple-300',
    },
    indigo: {
        iconBg: 'bg-indigo-500/10',
        iconColor: 'text-indigo-400',
        border: 'border-indigo-500/10',
        hoverBorder: 'group-hover:border-indigo-500/30',
        badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/10',
        glow: 'from-indigo-500/5 to-transparent',
        textHover: 'group-hover:text-indigo-300',
    },
    blue: {
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
      border: 'border-blue-500/10',
      hoverBorder: 'group-hover:border-blue-500/30',
      badge: 'bg-blue-500/10 text-blue-300 border-blue-500/10',
      glow: 'from-blue-500/5 to-transparent',
      textHover: 'group-hover:text-blue-300',
    },
    emerald: {
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
      border: 'border-emerald-500/10',
      hoverBorder: 'group-hover:border-emerald-500/30',
      badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/10',
      glow: 'from-emerald-500/5 to-transparent',
      textHover: 'group-hover:text-emerald-300',
    },
    amber: {
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
      border: 'border-amber-500/10',
      hoverBorder: 'group-hover:border-amber-500/30',
      badge: 'bg-amber-500/10 text-amber-300 border-amber-500/10',
      glow: 'from-amber-500/5 to-transparent',
      textHover: 'group-hover:text-amber-300',
    },
    rose: {
      iconBg: 'bg-rose-500/10',
      iconColor: 'text-rose-400',
      border: 'border-rose-500/10',
      hoverBorder: 'group-hover:border-rose-500/30',
      badge: 'bg-rose-500/10 text-rose-300 border-rose-500/10',
      glow: 'from-rose-500/5 to-transparent',
      textHover: 'group-hover:text-rose-300',
    },
    cyan: {
      iconBg: 'bg-cyan-500/10',
      iconColor: 'text-cyan-400',
      border: 'border-cyan-500/10',
      hoverBorder: 'group-hover:border-cyan-500/30',
      badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/10',
      glow: 'from-cyan-500/5 to-transparent',
      textHover: 'group-hover:text-cyan-300',
    },
    slate: {
      iconBg: 'bg-slate-800',
      iconColor: 'text-slate-400',
      border: 'border-white/5',
      hoverBorder: 'group-hover:border-white/10',
      badge: 'bg-slate-800 text-slate-400 border-white/5',
      glow: 'from-white/5 to-transparent',
      textHover: 'group-hover:text-white',
    }
  };

  return styles[theme] || styles.slate;
};

// --- 2. DATA PREPARATION ---

const getThemeForCategory = (category: string = ''): ColorTheme => {
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
  if (lower.includes('analyt')) return 'emerald';
  
  return 'slate';
};

// --- 3. PAGE COMPONENT ---

export const AllToolsPage: React.FC = () => {
  const navigate = useNavigate();
  const { tools: rawTools, loading } = useRemoteTools();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const tools = useMemo<ExtendedTool[]>(() => {
    return rawTools.map(t => ({
       ...t,
       credits: 1, 
       colorTheme: (t.colorTheme || getThemeForCategory(t.category)) as ColorTheme 
    }));
  }, [rawTools]);

  const filteredTools = useMemo(() => {
    if (!searchQuery) return tools;
    return tools.filter(tool => 
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tools, searchQuery]);

  const favoriteTools = filteredTools.filter((tool) => isFavorite(tool.id));
  const otherTools = filteredTools.filter((tool) => !isFavorite(tool.id));

  // --- STATS COMPONENTS (Local) ---
  const MinimalStat = ({ label, value, icon: Icon, colorClass }: { label: string, value: number | string, icon: any, colorClass: string }) => (
      <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0A0A0B]/40 border border-white/5 backdrop-blur-sm">
          <div className={cn("p-2.5 rounded-lg bg-white/5", colorClass)}>
              <Icon className="w-5 h-5" />
          </div>
          <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">{label}</p>
              <p className="text-xl font-bold text-white">{value}</p>
          </div>
      </div>
  );

  if (loading) {
    return <PageLoading text="Loading tools..." subtitle="Fetching your suite" />;
  }

  const renderToolCard = (tool: ExtendedTool) => {
    const Icon = tool.icon;
    const toolFavorited = isFavorite(tool.id);
    const styles = getColorStyles(tool.comingSoon ? 'slate' : tool.colorTheme);

    if (viewMode === 'list') {
        return (
            <div 
                key={tool.id}
                onClick={() => !tool.comingSoon && navigate(tool.path || '#')}
                className={cn(
                    "group flex items-center gap-4 p-4 rounded-xl bg-[#0A0A0B]/60 border border-white/5 backdrop-blur-sm transition-all duration-300 hover:border-white/10 hover:bg-white/[0.02]",
                    tool.comingSoon ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                )}
            >
                <div className={cn("p-2.5 rounded-lg shrink-0", styles.iconBg)}>
                    {Icon && <Icon className={cn("w-5 h-5", styles.iconColor)} />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                        <h3 className={cn("font-bold text-white truncate transition-colors", styles.textHover)}>{tool.name}</h3>
                         {tool.comingSoon && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-white/5 text-gray-400 border-white/5">
                                Soon
                            </Badge>
                        )}
                        <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px] font-normal", styles.badge)}>
                            {tool.category}
                        </Badge>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{tool.description}</p>
                </div>
                 <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-600 hover:text-white hover:bg-white/5"
                    onClick={(e) => {
                        e.stopPropagation();
                        // Copied handleFavoriteClick logic
                        toggleFavorite({ id: tool.id, type: 'tool', name: tool.name, path: tool.path });
                    }}
                >
                    <Star className={cn('h-4 w-4', toolFavorited ? 'fill-yellow-500 text-yellow-500' : '')} />
                </Button>
            </div>
        );
    }

    return (
      <Card
        key={tool.id}
        className={cn(
          "group relative overflow-hidden transition-all duration-300 bg-[#0A0A0B]/60 backdrop-blur-sm",
          styles.border,
          styles.hoverBorder,
          tool.comingSoon ? "opacity-75" : "hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50 cursor-pointer"
        )}
        onClick={() => {
            if (tool.comingSoon) {
                 navigate(`/tools/coming-soon?name=${encodeURIComponent(tool.name)}`);
                 return;
            }
            navigate(tool.path || '#');
        }}
      >
        {/* Hover Glow Gradient */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out pointer-events-none",
          styles.glow
        )} />

        <CardHeader className="relative pb-2 z-10">
          <div className="flex items-start justify-between">
            <div className={cn(
              "p-3 rounded-xl transition-all duration-300",
              styles.iconBg,
              !tool.comingSoon && "group-hover:scale-105 group-hover:shadow-lg " + styles.iconColor.replace('text', 'shadow') + "/20"
            )}>
              {Icon && <Icon className={cn("w-6 h-6", styles.iconColor)} />}
            </div>

            {tool.comingSoon ? (
                <div className="h-8 w-8 -mr-2 flex items-center justify-center text-gray-600">
                    <Lock className="w-4 h-4" />
                </div>
            ) : (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -mr-2 text-gray-600 hover:text-white hover:bg-white/5"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite({ id: tool.id, type: 'tool', name: tool.name, path: tool.path });
                    }}
                >
                <Star className={cn('h-5 w-5 transition-transform duration-300', toolFavorited ? 'fill-yellow-500 text-yellow-500 scale-110' : 'group-hover:text-gray-400')} />
                </Button>
            )}
          </div>

          <div className="mt-4 space-y-1.5">
            <CardTitle className={cn("text-lg font-bold text-white transition-colors", styles.textHover)}>
              {tool.name}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
               <Badge variant="outline" className={cn("text-[10px] h-5 font-normal px-2", styles.badge)}>
                 {tool.category}
               </Badge>
               {tool.comingSoon && (
                  <Badge variant="secondary" className="text-[10px] h-5 font-medium px-2 bg-white/5 text-gray-400 border-white/5">
                      Dev
                  </Badge>
               )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4 pt-2 z-10">
          <CardDescription className="text-sm text-gray-500 line-clamp-2 leading-relaxed min-h-[2.5em]">
            {tool.description}
          </CardDescription>

          <div className="flex items-center justify-between pt-4 mt-auto border-t border-white/5">
            {tool.comingSoon ? (
                 <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Coming Soon</span>
                 </div>
            ) : (
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 group-hover:text-white transition-colors">
                    <Zap className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                    <span>{tool.credits} credit</span>
                </div>
            )}

            {!tool.comingSoon && (
                <div className={cn(
                    "flex items-center gap-1 text-xs font-semibold opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300",
                    styles.iconColor
                )}>
                Open
                <ArrowRight className="w-3.5 h-3.5" />
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-6 lg:p-8 animate-fade-in relative overflow-hidden text-foreground pb-20">
      
       {/* Ambient Background - Neutral Calm */}
       <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
       <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-slate-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
            {/* Header */}
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
                <div>
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-400 mb-4">
                       <Wrench className="w-3 h-3 text-primary" />
                       <span>Tools Suite</span>
                   </div>
                   <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
                    Tools & <span className="text-primary">Utilities</span>
                   </h1>
                   <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
                    Access our powerful collection of Amazon seller tools. Analyze, optimize, and grow your business.
                   </p>
                </div>
                
                {/* Search & View Toggle */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input 
                            placeholder="Find a tool..." 
                            className="bg-[#0A0A0B]/60 border-white/10 text-white pl-9 focus:border-primary/50 h-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-lg border border-white/5 shrink-0">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button 
                             onClick={() => setViewMode('list')}
                             className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300")}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
           </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <MinimalStat 
                    label="Available Tools" 
                    value={tools.length} 
                    icon={Wrench} 
                    colorClass="text-blue-400 bg-blue-500/10" 
                />
                <MinimalStat 
                    label="Favorites" 
                    value={favoriteTools.length} 
                    icon={Star} 
                    colorClass="text-amber-400 bg-amber-500/10" 
                />
                 <MinimalStat 
                    label="Weekly Usage" 
                    value="124" 
                    icon={Zap} 
                    colorClass="text-emerald-400 bg-emerald-500/10" 
                />
            </div>

            {/* Favorites Section */}
            {favoriteTools.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="flex items-center gap-2 pb-2">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <h2 className="text-xl font-bold text-white tracking-tight">Favorites</h2>
                    </div>
                    <div className={cn("grid gap-6", viewMode === 'grid' ? "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1")}>
                        {favoriteTools.map(renderToolCard)}
                    </div>
                </div>
            )}

            {/* All Tools / Categories */}
            {Object.entries(
                otherTools.reduce((acc, tool) => {
                const cat = tool.category || 'General';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(tool);
                return acc;
                }, {} as Record<string, ExtendedTool[]>)
            ).map(([category, categoryTools]) => {
                let displayCategory = category;
                if (category.toLowerCase() === 'business_reports') {
                    displayCategory = 'Business Reports';
                }

                let theme = categoryTools[0]?.colorTheme || 'slate';
                if (displayCategory === 'Business Reports') {
                    theme = 'violet'; 
                }

                const styles = getColorStyles(theme);
                
                return (
                <div key={category} className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center gap-3 pb-2 pt-4 border-b border-white/5">
                        <div className={cn("p-1.5 rounded-lg", styles.iconBg)}>
                            <Wrench className={cn("w-4 h-4", styles.iconColor)} />
                        </div>
                        <h2 className="text-lg font-bold text-white tracking-tight">{displayCategory.toUpperCase()}</h2>
                        <Badge variant="outline" className="ml-auto text-xs font-medium border-white/10 text-gray-500">
                            {categoryTools.length}
                        </Badge>
                    </div>
                    <div className={cn("grid gap-6", viewMode === 'grid' ? "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1")}>
                        {categoryTools.map(renderToolCard)}
                    </div>
                </div>
                );
            })}
            
            {filteredTools.length === 0 && (
                <div className="text-center py-20 opacity-50">
                    <Search className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                    <h3 className="text-xl font-bold text-white">No tools found</h3>
                    <p className="text-gray-400">Try adjusting your search query</p>
                </div>
            )}
      </div>
    </div>
  );
};

export default AllToolsPage;