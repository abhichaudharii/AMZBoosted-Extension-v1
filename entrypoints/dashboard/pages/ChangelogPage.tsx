import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sparkles,
  Zap,
  Bug,
  AlertTriangle,
  History,
  Calendar,
  Tag,
  CheckCircle2,
  Rocket
} from 'lucide-react';
import { format } from 'date-fns';
import { ToolPageLayout } from '@/entrypoints/dashboard/components/ToolPageLayout';
import { cn } from '@/lib/utils';

interface ChangelogEntry {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  changes: {
    features?: string[];
    improvements?: string[];
    bugFixes?: string[];
    breaking?: string[];
  };
}

const changelog: ChangelogEntry[] = [
  {
    version: '1.3.0',
    date: '2024-01-20',
    type: 'minor',
    changes: {
      features: [
        'Added Bulk URL Runner tool for processing multiple products simultaneously',
        'Implemented Review Sentiment Classifier with AI-powered analysis',
        'New webhook system for real-time notifications',
        'Added Discord integration for alerts',
      ],
      improvements: [
        'Enhanced data table performance with virtualization',
        'Improved chart rendering speed by 40%',
        'Updated UI with smoother animations and transitions',
        'Better error messages and user feedback',
      ],
      bugFixes: [
        'Fixed export CSV encoding issue with special characters',
        'Resolved memory leak in schedule polling',
        'Fixed timezone display inconsistencies',
        'Corrected pagination bug in Reports page',
      ],
    },
  },
  {
    version: '1.2.0',
    date: '2024-01-10',
    type: 'minor',
    changes: {
      features: [
        'Introduced Keyword Insights tool for SEO optimization',
        'Added Inventory Alerts with real-time monitoring',
        'New Airtable integration',
        'API key management in Integrations page',
      ],
      improvements: [
        'Redesigned dashboard with better data visualization',
        'Enhanced mobile responsiveness',
        'Faster report generation (2x speed improvement)',
        'Improved search functionality across all pages',
      ],
      bugFixes: [
        'Fixed Google Sheets sync delay',
        'Resolved notification badge count accuracy',
        'Fixed schedule timezone conversion',
        'Corrected chart tooltip positioning',
      ],
    },
  },
  {
    version: '1.1.1',
    date: '2024-01-05',
    type: 'patch',
    changes: {
      bugFixes: [
        'Fixed critical bug in Price Tracker calculations',
        'Resolved authentication token refresh issue',
        'Fixed export file naming with special characters',
        'Corrected Listing Analyzer product count',
      ],
      improvements: [
        'Minor UI polish and accessibility improvements',
        'Optimized database queries for faster load times',
      ],
    },
  },
  {
    version: '1.1.0',
    date: '2024-01-01',
    type: 'minor',
    changes: {
      features: [
        'Added Price Tracker tool for competitor monitoring',
        'Introduced Listing Analyzer with detailed insights',
        'New Slack integration for team notifications',
        'Implemented scheduled reports with customizable frequency',
      ],
      improvements: [
        'Revamped side panel with better navigation',
        'Enhanced tool dashboard with 6 tabs',
        'Improved data export with multiple format options',
        'Better marketplace flag icons',
      ],
      bugFixes: [
        'Fixed QnA Extractor pagination',
        'Resolved Notion sync conflicts',
        'Fixed chart legend overflow on small screens',
      ],
    },
  },
  {
    version: '1.0.0',
    date: '2023-12-15',
    type: 'major',
    changes: {
      features: [
        'Initial public release of AMZBoosted',
        'AI Review Summary Scraper with sentiment analysis',
        'QnA Extractor for product questions and answers',
        'Google Sheets and Notion integrations',
        'Comprehensive dashboard with analytics',
        'Schedule system for automated tasks',
        'Export functionality (CSV, JSON, XLSX)',
        'Multi-marketplace support (8 Amazon regions)',
      ],
      breaking: [
        'New extension architecture requires fresh installation',
        'Previous beta data will not be migrated',
      ],
    },
  },
];

const changeTypeIcons: Record<string, React.ElementType> = {
  features: Sparkles,
  improvements: Zap,
  bugFixes: Bug,
  breaking: AlertTriangle,
};

const changeTypeColors: Record<string, string> = {
  features: 'text-emerald-500',
  improvements: 'text-[#FF6B00]',
  bugFixes: 'text-yellow-500',
  breaking: 'text-red-500',
};

const changeTypeBgColors: Record<string, string> = {
  features: 'bg-emerald-500/10',
  improvements: 'bg-[#FF6B00]/10',
  bugFixes: 'bg-yellow-500/10',
  breaking: 'bg-red-500/10',
};


const changeTypeLabels: Record<string, string> = {
  features: 'New Features',
  improvements: 'Improvements',
  bugFixes: 'Bug Fixes',
  breaking: 'Breaking Changes',
};

const versionTypeBadges: Record<ChangelogEntry['type'], { label: string; className: string }> = {
  major: { label: 'Major Release', className: 'border-red-500/20 bg-red-500/10 text-red-500' },
  minor: { label: 'Minor Update', className: 'border-[#FF6B00]/20 bg-[#FF6B00]/10 text-[#FF6B00]' },
  patch: { label: 'Patch Fix', className: 'border-white/10 bg-white/5 text-gray-400' },
};

export const ChangelogPage: React.FC = () => {
  return (
    <ToolPageLayout
        title='Product <span class="text-[#FF6B00]">Updates</span>'
        subtitle="Track new features, improvements, and bug fixes."
        icon={History}
        badge="Release Notes"
        iconBgClass="bg-[#FF6B00]/10"
        iconColorClass="text-[#FF6B00]"
        showBackButton={false}
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <PremiumStatCard
            title="Latest Version"
            value={`v${changelog[0].version}`}
            subtitle={`Released ${format(new Date(changelog[0].date), 'MMM dd')}`}
            icon={Rocket}
            colorClass="text-[#FF6B00]"
            bgClass="bg-[#FF6B00]/10"
        />
        <PremiumStatCard
            title="Total Releases"
            value={changelog.length}
            icon={History}
            colorClass="text-blue-500"
            bgClass="bg-blue-500/10"
        />
        <PremiumStatCard
            title="New Features"
            value={changelog.reduce((acc, entry) => acc + (entry.changes.features?.length || 0), 0)}
            icon={Sparkles}
            colorClass="text-emerald-500"
            bgClass="bg-emerald-500/10"
        />
        <PremiumStatCard
            title="Bugs Squashed"
            value={changelog.reduce((acc, entry) => acc + (entry.changes.bugFixes?.length || 0), 0)}
            icon={Bug}
            colorClass="text-yellow-500"
            bgClass="bg-yellow-500/10"
        />
      </div>

      {/* Release Timeline */}
      <div className="relative space-y-8 pl-4 sm:pl-0">
          {/* Vertical Line */}
          <div className="absolute left-[23px] sm:left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent -translate-x-1/2 hidden sm:block" />
          
           {/* REVISED TIMELINE LAYOUT - Single Column with Left Gutter */}
           <div className="space-y-12">
            {changelog.map((entry, index) => {
               const isLatest = index === 0;
               const badge = versionTypeBadges[entry.type];

               return (
                   <div key={entry.version} className="relative pl-12 sm:pl-16">
                       {/* Timeline Line */}
                       <div className="absolute left-[19px] top-12 bottom-0 w-px bg-white/10 h-[calc(100%+3rem)] last:h-0" />
                       
                       {/* Timeline Dot */}
                       <div className={cn(
                           "absolute left-[11px] top-6 w-[18px] h-[18px] rounded-full border-[3px] z-10 ring-4 ring-[#0A0A0B] transition-all duration-300",
                           isLatest 
                               ? "bg-[#FF6B00] border-[#FF6B00] shadow-[0_0_20px_rgba(255,107,0,0.4)]" 
                               : "bg-[#0A0A0B] border-white/20 group-hover:border-[#FF6B00] group-hover:bg-[#FF6B00]"
                       )} />

                       <Card 
                          className={cn(
                              "relative overflow-hidden transition-all duration-300 group",
                              "bg-[#0A0A0B]/60 backdrop-blur-md border-white/5",
                              isLatest ? "ring-1 ring-[#FF6B00]/20 shadow-[0_0_30px_-10px_rgba(255,107,0,0.1)]" : "hover:border-white/10"
                          )}
                        >
                           {isLatest && <div className="absolute top-0 left-0 w-1 h-full bg-[#FF6B00]" />}
                           
                           <CardHeader className="pb-4">
                               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                   <div className="space-y-1">
                                       <div className="flex items-center gap-3">
                                           <h2 className="text-2xl font-bold tracking-tight text-white">v{entry.version}</h2>
                                           <Badge variant="outline" className={cn("rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold", badge.className)}>
                                               {badge.label}
                                           </Badge>
                                           {isLatest && (
                                               <Badge className="bg-[#FF6B00] text-white border-0 shadow-lg shadow-[#FF6B00]/20">Latest</Badge>
                                           )}
                                       </div>
                                       <div className="flex items-center gap-2 text-sm text-gray-500">
                                           <Calendar className="w-3.5 h-3.5" />
                                           <span>Released on {format(new Date(entry.date), 'MMMM dd, yyyy')}</span>
                                       </div>
                                   </div>
                               </div>
                           </CardHeader>
                           
                           <CardContent className="space-y-6">
                               {Object.entries(entry.changes).map(([changeType, changes]) => {
                                   if (!changes || changes.length === 0) return null;
                                   const Icon = changeTypeIcons[changeType];
                                   const colorClass = changeTypeColors[changeType];
                                   const bgClass = changeTypeBgColors[changeType];
                                   const label = changeTypeLabels[changeType];

                                   return (
                                       <div key={changeType} className="space-y-3">
                                           <div className="flex items-center gap-2.5">
                                               <div className={cn("p-1.5 rounded-md", bgClass)}>
                                                    <Icon className={cn("h-4 w-4", colorClass)} />
                                               </div>
                                               <h3 className="font-semibold text-sm text-gray-300 uppercase tracking-wide opacity-90">{label}</h3>
                                           </div>
                                           <ul className="grid grid-cols-1 gap-2 ml-2 sm:ml-9 border-l border-white/5 pl-4">
                                               {changes.map((change, idx) => (
                                                   <li key={idx} className="text-sm text-gray-400 leading-relaxed flex items-start gap-2 group/item hover:text-gray-200 transition-colors">
                                                       <span className="mt-1.5 w-1 h-1 rounded-full bg-white/20 group-hover/item:bg-[#FF6B00] transition-colors" />
                                                       <span>{change}</span>
                                                   </li>
                                               ))}
                                           </ul>
                                       </div>
                                   );
                               })}
                           </CardContent>
                       </Card>
                   </div>
               );
            })}
           </div>
      </div>
    </ToolPageLayout>
  );
};

function PremiumStatCard({ title, value, subtitle, icon: Icon, colorClass, bgClass }: any) {
  return (
      <Card className="bg-[#0A0A0B]/60 backdrop-blur-md border-white/5 overflow-hidden relative group hover:border-white/10 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {title}
              </CardTitle>
              <div className={cn("p-1.5 rounded-lg transition-colors", bgClass, colorClass)}>
                  <Icon className="h-4 w-4" />
              </div>
          </CardHeader>
          <CardContent>
              <div className="flex flex-col gap-1">
                 <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">
                  {value}
                 </div>
                 {subtitle && (
                   <div className="text-xs text-gray-500 font-mono">
                     {subtitle}
                   </div>
                 )}
              </div>
          </CardContent>
      </Card>
  );
}
