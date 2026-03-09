import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, Lock } from 'lucide-react';
import { toast } from 'sonner';
// PageHeader removed as it was unused in the render, but if we want to use it we can. 
// For now removing to fix lint.

interface ToolComingSoonPageProps {
  toolName?: string;
  className?: string;
}

export const ToolComingSoonPage: React.FC<ToolComingSoonPageProps> = ({ 
  toolName: initialToolName = "New Tool",
  className
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toolName = searchParams.get('name') || initialToolName;

  return (
    <div className={`min-h-[80vh] flex flex-col items-center justify-center p-8 space-y-8 animate-in fade-in zoom-in-95 duration-700 ${className}`}>
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[128px] animate-pulse delay-1000" />
      </div>

      <div className="text-center space-y-6 max-w-lg mx-auto">
        <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary to-purple-500 blur-xl opacity-20 rounded-full" />
            <div className="relative bg-background/50 backdrop-blur-xl border border-border/50 p-6 rounded-full shadow-2xl">
                <Lock className="w-12 h-12 text-primary/80" />
            </div>
            <Badge 
                variant="secondary" 
                className="absolute -top-2 -right-4 px-3 py-1 bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50 backdrop-blur-md shadow-sm"
            >
                In Development
            </Badge>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
            {toolName}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            We're crafting something exceptional. This tool is currently in the works and will be available soon with premium features.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button 
            size="lg"
            className="group relative overflow-hidden bg-primary/90 hover:bg-primary shadow-lg hover:shadow-primary/25 transition-all duration-300"
            onClick={() => {
                toast.success("Joined Waitlist!", {
                  description: `We'll notify you as soon as ${toolName} is ready for prime time.`,
                });
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <Star className="w-4 h-4 mr-2 fill-current" />
            Notify Me When Ready
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            className="group border-primary/20 hover:bg-primary/5"
            onClick={() => navigate('/tools')}
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Explore Other Tools
          </Button>
        </div>
      </div>
    </div>
  );
};
