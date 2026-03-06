import React from 'react';
import { ArrowLeft, MoreVertical, Settings2, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface MenuItem {
  label: string;
  icon?: any;
  onClick?: () => void;
  variant?: 'default' | 'destructive';
  separator?: boolean;
}

interface NavbarProps {
  title: string;
  icon?: any;
  showBack?: boolean;
  onBack?: () => void;
  showMenu?: boolean;
  menuItems?: MenuItem[];
  onOpenSettings?: () => void;
  onOpenDashboard?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  title,
  icon: Icon,
  showBack = false,
  onBack,
  showMenu = false,
  menuItems = [],
  onOpenSettings,
  onOpenDashboard,
  children,
  className,
}) => {
  return (
    <div className={cn("h-14 border-b border-white/5 bg-[#0A0A0B]/80 backdrop-blur-xl px-4 flex items-center justify-between shrink-0 z-50 shadow-sm", className)}>
      <div className="flex items-center gap-3 overflow-hidden">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        
        <div className="flex items-center gap-3 overflow-hidden">
          {Icon && (
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
          )}
          <div className="flex flex-col overflow-hidden">
            <h1 className="text-sm font-extrabold truncate leading-none text-white tracking-tight">{title}</h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {children}
        
        {onOpenDashboard && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenDashboard}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
            title="Open Dashboard"
          >
            <LayoutDashboard className="h-4 w-4" />
          </Button>
        )}

        {onOpenSettings && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
            title="Processing Settings"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        )}

        {showMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 rounded-xl border-border/50 bg-background/95 backdrop-blur-2xl p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            >
              {menuItems.map((item, index) => (
                <React.Fragment key={index}>
                  {item.separator && <DropdownMenuSeparator className="bg-border/50 my-1" />}
                  
                  <DropdownMenuItem
                    onClick={item.onClick}
                    className={cn(
                      "rounded-lg text-xs font-medium px-3 py-2.5 cursor-pointer transition-colors flex items-center gap-2.5",
                      item.variant === 'destructive' 
                        ? 'text-destructive focus:text-destructive focus:bg-destructive/10' 
                        : 'text-foreground/80 focus:text-primary focus:bg-primary/10'
                    )}
                  >
                    {item.icon && <item.icon className="w-4 h-4 opacity-70" />}
                    {item.label}
                  </DropdownMenuItem>
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};