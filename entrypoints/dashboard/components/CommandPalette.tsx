import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CreditCard,
  User,
  Zap,
  FileText,
  Download,
  Sun,
  Moon,
  Monitor,
  HelpCircle,
  FileSearch,
  LayoutDashboard,
  Search,
  Command as CommandIcon,
  ArrowRight
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useRemoteTools } from '@/lib/hooks/useRemoteTools';
import { cn } from '@/lib/utils';

interface Command {
  id: string;
  title: string;
  description?: string;
  icon: any;
  category: 'Tools' | 'Pages' | 'Actions' | 'Theme' | 'Help';
  action: () => void;
  keywords?: string[];
  shortcut?: string;
  color?: string;
}

export const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { tools } = useRemoteTools();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    const openPalette = () => setOpen(true);

    document.addEventListener('keydown', down);
    window.addEventListener('open-command-palette', openPalette);
    
    return () => {
      document.removeEventListener('keydown', down);
      window.removeEventListener('open-command-palette', openPalette);
    };
  }, []);

  const handleAction = (action: () => void) => {
    setOpen(false);
    setSearch('');
    // Small delay to allow dialog to close smoothly
    setTimeout(() => {
      action();
    }, 100);
  };

  // Category colors for tools
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Product Research': return 'text-blue-500 group-data-[selected=true]:text-blue-400';
      case 'Listing Optimization': return 'text-purple-500 group-data-[selected=true]:text-purple-400';
      case 'PPC & Advertising': return 'text-amber-500 group-data-[selected=true]:text-amber-400';
      case 'Inventory Management': return 'text-emerald-500 group-data-[selected=true]:text-emerald-400';
      case 'Finance & Profitability': return 'text-green-500 group-data-[selected=true]:text-green-400';
      case 'Competitor Analysis': return 'text-rose-500 group-data-[selected=true]:text-rose-400';
      default: return 'text-slate-500 group-data-[selected=true]:text-white';
    }
  };

  const commands: Command[] = [
    // Tools (Dynamically generated & Filtered)
    ...tools
      .filter(tool => tool.enabled !== false)
      .map(tool => ({
        id: tool.id,
        title: tool.name,
        description: tool.description,
        icon: tool.icon,
        category: 'Tools' as const,
        action: () => navigate(tool.path || `/tools/${tool.id}`),
        keywords: [tool.name.toLowerCase(), ...(tool.name ? tool.name.split(' ').map((w: string) => w.toLowerCase()) : [])],
        color: getCategoryColor(tool.category)
      })),
    // Pages
    {
      id: 'home',
      title: 'Dashboard',
      icon: LayoutDashboard,
      category: 'Pages',
      action: () => navigate('/'),
      keywords: ['home', 'dashboard', 'overview'],
      color: 'text-primary group-data-[selected=true]:text-white'
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: FileText,
      category: 'Pages',
      action: () => navigate('/reports'),
      keywords: ['reports', 'history'],
      color: 'text-blue-500 group-data-[selected=true]:text-blue-400'
    },
    {
      id: 'schedules',
      title: 'Schedules',
      icon: Calendar,
      category: 'Pages',
      action: () => navigate('/schedules'),
      keywords: ['schedules', 'automation', 'tasks'],
      color: 'text-purple-500 group-data-[selected=true]:text-purple-400'
    },
    {
      id: 'exports',
      title: 'Exports',
      icon: Download,
      category: 'Pages',
      action: () => navigate('/exports'),
      keywords: ['exports', 'download', 'csv'],
      color: 'text-green-500 group-data-[selected=true]:text-green-400'
    },
    // Actions
    {
      id: 'refresh',
      title: 'Refresh Data',
      icon: Zap,
      category: 'Actions',
      action: () => window.location.reload(),
      keywords: ['refresh', 'reload'],
      shortcut: '⌘R',
      color: 'text-amber-500 group-data-[selected=true]:text-amber-400'
    },
    {
      id: 'export-current',
      title: 'Export Current Data',
      icon: Download,
      category: 'Actions',
      action: () => window.dispatchEvent(new CustomEvent('export-current-data')),
      keywords: ['export', 'download'],
      color: 'text-emerald-500 group-data-[selected=true]:text-emerald-400'
    },
    // Theme
    {
      id: 'theme-light',
      title: 'Light Theme',
      description: 'Switch to light mode',
      icon: Sun,
      category: 'Theme',
      action: () => setTheme('light'),
      keywords: ['appearance', 'display', 'light'],
      color: 'text-orange-500 group-data-[selected=true]:text-orange-400'
    },
    {
      id: 'theme-dark',
      title: 'Dark Theme',
      description: 'Switch to dark mode',
      icon: Moon,
      category: 'Theme',
      action: () => setTheme('dark'),
      keywords: ['appearance', 'display', 'dark'],
      color: 'text-indigo-400 group-data-[selected=true]:text-indigo-300'
    },
    {
      id: 'theme-system',
      title: 'System Theme',
      description: 'Use system preference',
      icon: Monitor,
      category: 'Theme',
      action: () => setTheme('system'),
      keywords: ['appearance', 'display', 'auto'],
      color: 'text-slate-500 group-data-[selected=true]:text-slate-300'
    },
    // Settings
    {
      id: 'billing',
      title: 'Subscription',
      icon: CreditCard,
      category: 'Help',
      action: () => navigate('/billing'),
      keywords: ['billing', 'subscription'],
      color: 'text-green-600 group-data-[selected=true]:text-green-400'
    },
    {
      id: 'account',
      title: 'Account & Security',
      icon: User,
      category: 'Help',
      action: () => navigate('/account'),
      keywords: ['account', 'security'],
      shortcut: '⌘,',
      color: 'text-blue-600 group-data-[selected=true]:text-blue-400'
    },
    {
      id: 'support',
      title: 'Support & Help',
      icon: HelpCircle,
      category: 'Help',
      action: () => navigate('/support'),
      keywords: ['support', 'help'],
      color: 'text-rose-500 group-data-[selected=true]:text-rose-400'
    },
  ];

  const filteredCommands = search
    ? commands.filter((cmd) => {
        const query = search.toLowerCase();
        return (
          cmd.title.toLowerCase().includes(query) ||
          cmd.description?.toLowerCase().includes(query) ||
          cmd.keywords?.some((kw) => kw.toLowerCase().includes(query))
        );
      })
    : commands;

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  const categoryOrder = ['Tools', 'Pages', 'Actions', 'Theme', 'Help'];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div className="flex flex-col overflow-hidden bg-[#1A1A1C]/95 backdrop-blur-2xl shadow-2xl ring-1 ring-white/10 sm:rounded-xl">
        <div className="flex items-center border-b border-white/10 px-4 py-1">
          <Search className="mr-2 h-5 w-5 shrink-0 text-white/40" />
          <CommandInput
            placeholder="What do you need?"
            value={search}
            onValueChange={setSearch}
            className="flex h-14 w-full rounded-md bg-transparent py-3 text-lg outline-none placeholder:text-white/20 disabled:cursor-not-allowed disabled:opacity-50 text-white border-0 focus:ring-0"
          />
          <div className="flex items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-white/50">
             <span className="text-xs">
                ESC
             </span>
          </div>
        </div>
        
        <CommandList className="max-h-[60vh] overflow-y-auto py-2 px-2 scrollbar-none">
          <CommandEmpty>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-white/5 p-4 mb-4 ring-1 ring-white/10">
                <FileSearch className="h-8 w-8 text-white/20" />
              </div>
              <p className="text-base font-medium text-white/80">No results found</p>
              <p className="text-sm text-white/40 mt-1 max-w-[200px]">
                We couldn't find anything matching "{search}"
              </p>
            </div>
          </CommandEmpty>

          {categoryOrder.map((group) => {
            const items = groupedCommands[group];
            if (!items || items.length === 0) return null;

            return (
              <React.Fragment key={group}>
                <CommandGroup 
                  heading={group} 
                  className="px-2 py-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-white/30 [&_[cmdk-group-heading]]:uppercase"
                >
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <CommandItem
                        key={item.id}
                        value={`${item.title} ${item.keywords?.join(' ')}`}
                        onSelect={() => handleAction(item.action)}
                        className="group relative flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-3 text-sm outline-none data-[selected='true']:bg-white/10 data-[selected='true']:text-white transition-all duration-200 ease-out"
                      >
                        {/* Selected Indicator */}
                         <div className="absolute left-0 top-1/2 h-0 w-[3px] -translate-y-1/2 rounded-r bg-primary opacity-0 transition-all duration-200 group-data-[selected='true']:h-6 group-data-[selected='true']:opacity-100 shadow-[0_0_10px_rgba(255,107,0,0.5)]" />

                        {/* Icon Container */}
                        <div className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/5 bg-white/5 shadow-inner transition-all duration-200",
                          "group-data-[selected='true']:bg-white/10 group-data-[selected='true']:border-white/10 group-data-[selected='true']:scale-105",
                          item.color || "text-white/40"
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>

                        <div className="flex flex-1 flex-col min-w-0 justify-center">
                          <span className="font-medium leading-none text-white/80 group-data-[selected='true']:text-white transition-colors">
                            {item.title}
                          </span>
                          {item.description && (
                            <span className="mt-1 line-clamp-1 text-xs text-white/40 group-data-[selected='true']:text-white/60 transition-colors">
                              {item.description}
                            </span>
                          )}
                        </div>

                        {item.shortcut ? (
                          <div className="hidden sm:flex items-center gap-1">
                            {item.shortcut.split('').map((key, i) => (
                              <kbd key={i} className="flex h-5 min-w-[20px] items-center justify-center rounded border border-white/10 bg-white/5 px-1.5 text-[10px] font-medium text-white/40 font-mono group-data-[selected='true']:border-white/20 group-data-[selected='true']:text-white/60">
                                {key}
                              </kbd>
                            ))}
                          </div>
                        ) : (
                             <ArrowRight className="h-4 w-4 text-white/0 -translate-x-2 group-data-[selected='true']:translate-x-0 group-data-[selected='true']:text-white/20 transition-all duration-300 ease-out" />
                        )}
                        
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                {group !== 'Help' && <CommandSeparator className="my-1 mx-4 bg-white/5" />}
              </React.Fragment>
            );
          })}
        </CommandList>

        <div className="flex items-center justify-between border-t border-white/5 bg-white/[0.02] px-4 py-2.5 backdrop-blur-sm">
          <div className="flex items-center gap-4 text-[10px] text-white/30 font-medium">
             <div className="flex items-center gap-1">
                <CommandIcon className="h-3 w-3" />
                <span className="font-mono tracking-wider">COMMAND PALETTE</span>
             </div>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-white/30 font-medium select-none">
            <span className="flex items-center gap-1.5 hover:text-white/50 transition-colors">
               Navigate
               <div className="flex gap-0.5">
                   <kbd className="rounded bg-white/5 border border-white/10 px-1 py-0.5 font-mono shadow-sm min-w-[16px] text-center">↑</kbd>
                   <kbd className="rounded bg-white/5 border border-white/10 px-1 py-0.5 font-mono shadow-sm min-w-[16px] text-center">↓</kbd>
               </div>
            </span>
            <div className="h-3 w-[1px] bg-white/10" />
            <span className="flex items-center gap-1.5 hover:text-white/50 transition-colors">
               Select
               <kbd className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 font-mono shadow-sm">↵</kbd>
            </span>
          </div>
        </div>
      </div>
    </CommandDialog>
  );
};