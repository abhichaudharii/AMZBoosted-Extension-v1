import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface StatItem {
    title: string;
    value: string | number;
    subtitle?: React.ReactNode;
    icon: LucideIcon;
    colorClass: string;
    bgClass: string;
}

interface PremiumToolStatsProps {
    stats: StatItem[];
    className?: string;
}

export const PremiumToolStats: React.FC<PremiumToolStatsProps> = ({ stats, className }) => {
    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
            {stats.map((stat, i) => (
                <PremiumStatCard 
                    key={i}
                    {...stat}
                />
            ))}
        </div>
    );
};

function PremiumStatCard({ title, value, subtitle, icon: Icon, colorClass, bgClass }: StatItem) {
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
