import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export interface ToolPageLayoutProps {
    title: string;
    subtitle?: string;
    icon?: React.ElementType;
    iconColorClass?: string;
    badge?: string;
    lastActive?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
    showBackButton?: boolean;
    headerContent?: React.ReactNode; 
    wide?: boolean; 
}

export const ToolPageLayout: React.FC<ToolPageLayoutProps> = ({
    title,
    subtitle,
    icon: Icon,
    iconColorClass = "text-gray-400",
    badge,
    lastActive,
    actions,
    children,
    showBackButton = true,
    headerContent,
    wide = false
}) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0A0A0B] p-6 lg:p-8 animate-fade-in relative overflow-hidden text-foreground pb-24">
             {/* Ambient Background - Relaxed Neutral Glow */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-slate-500/2 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-slate-400/2 rounded-full blur-[120px] pointer-events-none" />

            <div className={cn("mx-auto space-y-8 relative z-10", wide ? "max-w-[1600px]" : "max-w-7xl")}>
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
                     <div>
                        {/* Upper Badge Row */}
                        <div className="flex items-center gap-3 mb-4">
                            {showBackButton && (
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => navigate(-1)} 
                                    className="h-6 px-2 -ml-2 text-gray-500 hover:text-white hover:bg-white/5"
                                >
                                    <ArrowLeft className="h-3 w-3 mr-1" />
                                    Back
                                </Button>
                            )}
                            
                            {badge && (
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-400">
                                    {Icon && <Icon className={cn("w-3 h-3", iconColorClass.includes('text') ? iconColorClass : "text-gray-400")} />}
                                    <span>{badge}</span>
                                </div>
                            )}
                        </div>

                        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
                             <span dangerouslySetInnerHTML={{ __html: title }} />
                        </h1>
                        
                        <div className="space-y-2">
                             {subtitle && (
                                <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
                                    {subtitle}
                                </p>
                            )}
                             {lastActive && (
                                 <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                    <Timer className="h-3.5 w-3.5" />
                                    Last run {lastActive}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions Area */}
                    {actions && (
                        <div className="flex gap-3 w-full md:w-auto">
                            {actions}
                        </div>
                    )}
                </div>
                
                {/* Optional extra header content */}
                {headerContent && (
                    <div className="space-y-4">
                        {headerContent}
                    </div>
                )}

                {/* Main Content */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                    {children}
                </div>
            </div>
        </div>
    );
};
