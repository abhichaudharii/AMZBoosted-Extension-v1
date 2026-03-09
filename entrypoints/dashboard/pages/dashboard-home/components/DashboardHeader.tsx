import { LayoutDashboard, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Period } from '@/entrypoints/dashboard/hooks/useDashboardAnalytics';
import { DashboardSection } from '@/entrypoints/dashboard/hooks/useDashboardSettings';

interface DashboardHeaderProps {
  selectedPeriod: Period;
  setSelectedPeriod: (period: Period) => void;
  sectionLabels: Record<DashboardSection, string>;
  isSectionVisible: (section: DashboardSection) => boolean;
  toggleSection: (section: DashboardSection) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  selectedPeriod,
  setSelectedPeriod,
  sectionLabels,
  isSectionVisible,
  toggleSection,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
        <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-400 mb-4">
                <LayoutDashboard className="w-3 h-3 text-[#FF6B00]" />
                <span>Overview</span>
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
            Dash<span className="text-[#FF6B00]">board</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
            Overview of your Amazon seller tools and analytics.
            </p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">

            {/* Period Filter Tabs - Custom Style */}
            <div className="bg-[#1A1A1C] border border-white/10 p-1 rounded-lg flex items-center">
                {(['today', 'yesterday', 'week', 'month', 'all'] as const).map((p) => (
                    <button
                        key={p}
                        onClick={() => setSelectedPeriod(p)}
                        className={`
                            px-3 py-1.5 text-xs font-medium rounded-md transition-all
                            ${selectedPeriod === p 
                                ? 'bg-[#FF6B00] text-white shadow-sm' 
                                : 'text-gray-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                ))}
            </div>

            {/* Dashboard Settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 bg-[#1A1A1C] border-white/10 text-gray-400 hover:text-white hover:bg-white/5">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#1A1A1C] border-white/10 text-white">
                <DropdownMenuLabel>Dashboard Sections</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                {Object.entries(sectionLabels).map(([key, label]) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={isSectionVisible(key as DashboardSection)}
                    onCheckedChange={() => toggleSection(key as DashboardSection)}
                    className="focus:bg-white/10 focus:text-white"
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </div>
  );
};
