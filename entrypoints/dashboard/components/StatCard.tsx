import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

type IconComp = React.FC<{ className?: string }> | undefined;

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: IconComp;
  progress?: number | null;
  fallback?: string;
  description?: string;
  trend?: number | null;
  trendLabel?: string;
  color?: 'green' | 'blue' | 'orange' | 'purple' | 'red' | 'yellow' | 'gray' | 'emerald' | 'amber' | 'cyan' | 'rose' | 'indigo' | 'violet' | 'slate';
}

const colorStyles = {
  green: {
    card: 'bg-green-50 dark:bg-green-950/20',
    iconBg: 'bg-green-100 dark:bg-green-900',
    iconColor: 'text-green-600 dark:text-green-300',
  },
  blue: {
    card: 'bg-blue-50 dark:bg-blue-950/20',
    iconBg: 'bg-blue-100 dark:bg-blue-900',
    iconColor: 'text-blue-600 dark:text-blue-300',
  },
  orange: {
    card: 'bg-orange-50 dark:bg-orange-950/20',
    iconBg: 'bg-orange-100 dark:bg-orange-900',
    iconColor: 'text-orange-600 dark:text-orange-300',
  },
  purple: {
    card: 'bg-purple-50 dark:bg-purple-950/20',
    iconBg: 'bg-purple-100 dark:bg-purple-900',
    iconColor: 'text-purple-600 dark:text-purple-300',
  },
  red: {
    card: 'bg-red-50 dark:bg-red-950/20',
    iconBg: 'bg-red-100 dark:bg-red-900',
    iconColor: 'text-red-600 dark:text-red-300',
  },
  yellow: {
    card: 'bg-yellow-50 dark:bg-yellow-950/20',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900',
    iconColor: 'text-yellow-600 dark:text-yellow-300',
  },
  gray: {
    card: 'bg-gray-50 dark:bg-gray-950/20',
    iconBg: 'bg-gray-100 dark:bg-gray-900',
    iconColor: 'text-gray-600 dark:text-gray-300',
  },
  emerald: {
    card: 'bg-emerald-50 dark:bg-emerald-950/20',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900',
    iconColor: 'text-emerald-600 dark:text-emerald-300',
  },
  amber: {
    card: 'bg-amber-50 dark:bg-amber-950/20',
    iconBg: 'bg-amber-100 dark:bg-amber-900',
    iconColor: 'text-amber-600 dark:text-amber-300',
  },
  cyan: {
    card: 'bg-cyan-50 dark:bg-cyan-950/20',
    iconBg: 'bg-cyan-100 dark:bg-cyan-900',
    iconColor: 'text-cyan-600 dark:text-cyan-300',
  },
  rose: {
    card: 'bg-rose-50 dark:bg-rose-950/20',
    iconBg: 'bg-rose-100 dark:bg-rose-900',
    iconColor: 'text-rose-600 dark:text-rose-300',
  },
  indigo: {
    card: 'bg-indigo-50 dark:bg-indigo-950/20',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900',
    iconColor: 'text-indigo-600 dark:text-indigo-300',
  },
  violet: {
    card: 'bg-violet-50 dark:bg-violet-950/20',
    iconBg: 'bg-violet-100 dark:bg-violet-900',
    iconColor: 'text-violet-600 dark:text-violet-300',
  },
  slate: {
    card: 'bg-slate-50 dark:bg-slate-950/20',
    iconBg: 'bg-slate-100 dark:bg-slate-900',
    iconColor: 'text-slate-600 dark:text-slate-300',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  progress = null,
  fallback = 'No usage data available',
  color = 'blue',
  trend,
  trendLabel,
  description
}) => {
  const styles = colorStyles[color];

  return (
    <Card className={`${styles.card} transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && (
          <div className={`p-1.5 rounded-md ${styles.iconBg}`}>
            <Icon className={`h-4 w-4 ${styles.iconColor}`} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value ?? <span className="text-sm text-muted-foreground">{fallback}</span>}
        </div>
        
        {progress != null ? (
          <div className="mt-3">
            <Progress value={Math.max(0, Math.min(100, progress))} />
          </div>
        ) : (
          <div className="space-y-1 mt-1">
             {(subtitle || description) && (
                <p className="text-xs text-muted-foreground">{subtitle || description}</p>
             )}
             
             {trend !== undefined && trend !== null && (
                 <div className="flex items-center gap-2 text-xs">
                    <span className={trend > 0 ? "text-green-600 font-medium" : trend < 0 ? "text-red-600 font-medium" : "text-gray-500"}>
                        {trend > 0 ? "+" : ""}{trend.toFixed(1)}%
                    </span>
                    {trendLabel && <span className="text-muted-foreground">{trendLabel}</span>}
                 </div>
             )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
