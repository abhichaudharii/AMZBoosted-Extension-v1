import { useNotifications } from '@/lib/hooks/useNotifications';
import { secureStorage } from '@/lib/storage/secure-storage';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from './ThemeToggle';
import {
  Menu, // Added
  Search,
  Bell,
  Check,
  X,
  ChevronRight,
  Settings,
  CreditCard,
  HelpCircle,
  FileText,
  LogOut,
  Loader2,
  User,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/lib/hooks/useUserData';
import { authService } from '@/lib/services/auth.service';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface TopNavProps {
  activePath?: string;
  onNavigate?: (path: string) => void;
  userName?: string;
  userEmail?: string;
  plan?: 'no_plan' | 'starter' | 'professional' | 'business' | 'enterprise';
  breadcrumbs?: Array<{ label: string; path?: string }>;
  onToggleSidebar?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onNavigate: propOnNavigate,
  userName: propUserName,
  userEmail: propUserEmail,
  breadcrumbs = [],
  onToggleSidebar,
}) => {
  const navigate = useNavigate();
  const { user } = useUser();
//   const cta = getSubscriptionCTA(subState, 'navbar');
  
  // Use props if provided, otherwise fallback to hook/defaults
  const [userName, setUserName] = useState(propUserName || user?.name || user?.full_name || '');
  const userEmail = propUserEmail || user?.email || '';
  
  const onNavigate = propOnNavigate || ((path: string) => navigate(path));

  // Notification state
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearAll 
  } = useNotifications();

  // Logout Dialog State
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [logoutConfirmText, setLogoutConfirmText] = useState('');
  const [backupEnabled, setBackupEnabled] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (logoutConfirmText !== 'LOGOUT') return;

    try {
      setIsLoggingOut(true);

      // 1. Trigger Auto-backup if enabled
      if (backupEnabled) {
        toast.info('Creating secure backup...');
        // Send message to background script to handle export
        const response = await chrome.runtime.sendMessage({ type: 'SECURE_EXPORT' });
        
        if (!response?.success) {
            toast.error('Backup failed, but proceeding with logout...');
            console.error('Backup failed:', response?.error);
        } else {
            toast.success('Backup downloaded successfully');
        }
        
        // Give it a moment to start download
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // 2. Logout from Website/API
      await authService.logout();

      // 3. Clear Extension Data
      // Send message to background to clear IndexedDB
      await chrome.runtime.sendMessage({ type: 'CLEAR_ALL_DATA' });
      
      // Clear Local & Sync Storage
      await secureStorage.clear();
      await chrome.storage.sync.clear();

      toast.success('Logged out successfully');
      
      // 4. Reload to reset state
      setTimeout(() => {
        window.location.reload();
      }, 500);

    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout encountered an error, forcing reload...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
    }
  };

  // --- Effects ---

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.name) {
        setUserName(customEvent.detail.name);
      }
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('userProfileUpdated', handleProfileUpdate);
  }, []);



  const getNotificationIcon = (type: string) => {
    // Simplified icon logic, removed unused imports
    return <div className={`h-2 w-2 rounded-full mt-1.5 ${
      type === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
      type === 'warning' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 
      type === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-[#FF6B00] shadow-[0_0_8px_rgba(255,107,0,0.5)]'
    }`} />;
  };

  return (
    <div className="sticky top-0 z-50 border-b border-white/5 bg-[#0A0A0B]/50 backdrop-blur-md">
      <div className="flex h-[64px] items-center justify-between px-8">
        
        {/* --- LEFT: Logo & Breadcrumbs --- */}
        <div className="flex items-center gap-6">
           {/* Sidebar Toggle */}
           <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="text-gray-400 hover:text-white hover:bg-white/5 h-9 w-9 -ml-2"
            >
                <Menu className="h-5 w-5" />
            </Button>

          {/* Logo Removed - Moved to Sidebar */}

          {/* Breadcrumbs separator */}
          {breadcrumbs.length > 0 && (
            <div className="h-6 w-px bg-white/10 hidden md:block" />
          )}

          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-2">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <ChevronRight className="h-4 w-4 text-gray-600" />}
                  {crumb.path ? (
                    <button
                      onClick={() => onNavigate(crumb.path!)}
                      className="text-sm font-medium text-gray-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-sm font-semibold text-white px-2 py-1 bg-white/5 rounded-md border border-white/5">
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
        </div>

        {/* --- RIGHT: Actions --- */}
        <div className="flex items-center gap-4">
          
          {/* Search Bar - Premium Glass */}
          <Button
            variant="outline"
            className="hidden md:flex relative h-9 w-64 justify-start text-sm text-gray-400 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 rounded-lg shadow-sm group"
            onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
          >
            <Search className="mr-3 h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            <span className="font-normal opacity-70 group-hover:opacity-100 transition-opacity">Search tools...</span>
            <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-0.5 rounded border border-white/10 bg-[#0A0A0B]/50 px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex text-gray-400 shadow-sm">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          {/* Notification Bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 hover:bg-white/5 transition-all rounded-full border border-transparent hover:border-white/5 group"
              >
                <Bell className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B00] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF6B00] border-2 border-[#0A0A0B]"></span>
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[380px] p-0 overflow-hidden shadow-2xl border-white/10 bg-[#0A0A0B]/80 backdrop-blur-xl text-white ring-1 ring-white/5 mt-2">
              <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border-b border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-[#FF6B00]" />
                    <span className="text-sm font-semibold text-white">Notifications</span>
                    {unreadCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#FF6B00]/20 text-[#FF6B00] border border-[#FF6B00]/20">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <div className="flex gap-1">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] hover:text-[#FF6B00] hover:bg-[#FF6B00]/10 rounded-md px-2"
                      onClick={markAllAsRead}
                    >
                      Mark read
                    </Button>
                  )}
                  {notifications.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px] hover:text-red-400 hover:bg-red-500/10 rounded-md px-2"
                        onClick={clearAll}
                      >
                        Clear
                      </Button>
                  )}
                </div>
              </div>

              {notifications.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-500 flex flex-col items-center gap-4">
                  <div className="p-4 bg-white/[0.03] rounded-full border border-white/5">
                      <Bell className="h-8 w-8 opacity-20" />
                  </div>
                  <div>
                      <p className="font-medium text-gray-400">All caught up!</p>
                      <p className="text-xs text-gray-600 mt-1">No new notifications to show</p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-[380px]">
                  <div className="flex flex-col">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "relative flex gap-4 p-4 hover:bg-white/[0.03] transition-all cursor-pointer border-b border-white/5 last:border-0 group",
                          !notification.read && "bg-[#FF6B00]/[0.02] hover:bg-[#FF6B00]/[0.05]"
                        )}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex-shrink-0 pt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 space-y-1.5 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <p className={cn(
                              "text-sm font-medium leading-none group-hover:text-white transition-colors",
                              !notification.read ? "text-white" : "text-gray-400"
                            )}>
                              {notification.title}
                            </p>
                            <span className="text-[10px] text-gray-600 whitespace-nowrap pt-0.5 font-mono">
                              {format(new Date(notification.createdAt), 'MMM dd, p')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed group-hover:text-gray-400 transition-colors">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                            <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#FF6B00] to-transparent opacity-50" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-6 w-px bg-white/10 mx-1 hidden md:block" />

          {/* Theme Toggle */}
          <div className="hidden md:block opacity-0 pointer-events-none w-0 overflow-hidden">
             {/* Hidden but kept for logic if needed later, dark mode is forced now */}
             <ThemeToggle />
          </div>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 rounded-full pl-2 pr-4 gap-3 hover:bg-white/5 transition-all border border-transparent hover:border-white/5 group">
                <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-[#FF6B00]/20 transition-all shadow-sm">
                  <AvatarImage src="" alt={userName || 'User'} />
                  <AvatarFallback className="bg-gradient-to-br from-[#FF6B00] to-[#FF8533] text-white text-xs font-bold">
                    {userName ? userName.slice(0, 2).toUpperCase() : 'US'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-medium leading-none text-gray-200 group-hover:text-white transition-colors">{userName || 'User'}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 mt-2 bg-[#0A0A0B]/80 border-white/10 text-white shadow-2xl backdrop-blur-xl p-0 overflow-hidden ring-1 ring-white/5">
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-white/[0.08] to-transparent border-b border-white/5">
                   <div className="h-10 w-10 rounded-full bg-[#FF6B00]/10 flex items-center justify-center border border-[#FF6B00]/20">
                       <User className="h-5 w-5 text-[#FF6B00]" />
                   </div>
                   <div className="flex flex-col space-y-1">
                     <p className="text-sm font-semibold leading-none text-white">{userName}</p>
                     <p className="text-xs leading-none text-gray-500 truncate max-w-[140px]">{userEmail}</p>
                   </div>
                </div>
              </DropdownMenuLabel>
              <div className="p-1.5 space-y-0.5">
                  <DropdownMenuItem onClick={() => onNavigate('/account')} className="focus:bg-white/5 focus:text-white cursor-pointer rounded-lg px-3 py-2.5">
                    <Settings className="mr-3 h-4 w-4 text-gray-500 group-focus:text-white" />
                    <span className="text-sm text-gray-300">Account Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate('/billing')} className="focus:bg-white/5 focus:text-white cursor-pointer rounded-lg px-3 py-2.5">
                    <CreditCard className="mr-3 h-4 w-4 text-gray-500 group-focus:text-white" />
                    <span className="text-sm text-gray-300">Billing & Plans</span>
                  </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="bg-white/5 mx-2" />
              <div className="p-1.5 space-y-0.5">
                  <DropdownMenuItem onClick={() => onNavigate('/support')} className="focus:bg-white/5 focus:text-white cursor-pointer rounded-lg px-3 py-2.5">
                    <HelpCircle className="mr-3 h-4 w-4 text-gray-500 group-focus:text-white" />
                    <span className="text-sm text-gray-300">Help & Support</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate('/changelog')} className="focus:bg-white/5 focus:text-white cursor-pointer rounded-lg px-3 py-2.5">
                    <FileText className="mr-3 h-4 w-4 text-gray-500 group-focus:text-white" />
                    <span className="text-sm text-gray-300">Changelog</span>
                  </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="bg-white/5 mx-2" />
              <div className="p-1.5">
                  <DropdownMenuItem 
                    className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer rounded-lg px-3 py-2.5 group"
                    onClick={() => setShowLogoutDialog(true)}
                  >
                    <LogOut className="mr-3 h-4 w-4 text-red-500/70 group-focus:text-red-400" />
                    <span className="text-sm">Log Out</span>
                  </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md bg-[#1A1A1C] border-white/10 text-white shadow-2xl backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Secure Logout
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2 text-gray-400">
              <div className="p-4 bg-red-500/10 rounded-xl text-red-200 text-xs font-medium border border-red-500/20 leading-relaxed">
                Warning: This action will clear your local extension data for security. Ensure you have backed up any important exports.
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Backup Toggle */}
            <div className="flex items-center justify-between space-x-2 border border-white/10 p-4 rounded-xl bg-white/[0.03]">
              <div className="space-y-0.5">
                <Label htmlFor="backup-mode" className="text-sm font-medium text-white">
                  Auto-backup Data
                </Label>
                <p className="text-xs text-gray-500">
                  Save your data before clearing
                </p>
              </div>
              <Switch
                id="backup-mode"
                checked={backupEnabled}
                onCheckedChange={setBackupEnabled}
                className="data-[state=checked]:bg-[#FF6B00]"
              />
            </div>

            {/* Confirmation Input */}
            <div className="space-y-3">
              <Label htmlFor="logout-confirm" className="text-xs uppercase text-gray-500 font-bold tracking-wider">
                Type <span className="text-red-400">LOGOUT</span> to confirm
              </Label>
              <Input
                id="logout-confirm"
                value={logoutConfirmText}
                onChange={(e) => setLogoutConfirmText(e.target.value)}
                onPaste={(e) => {
                  e.preventDefault();
                  toast.error('Please type the confirmation text manually');
                }}
                placeholder="LOGOUT"
                className="font-mono bg-black/40 border-white/10 text-white placeholder:text-gray-700 focus-visible:ring-red-500/50 h-11 text-center tracking-[0.2em]"
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter className="gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowLogoutDialog(false);
                setLogoutConfirmText('');
              }}
              disabled={isLoggingOut}
              className="border-white/10 text-gray-400 hover:bg-white/5 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={logoutConfirmText !== 'LOGOUT' || isLoggingOut}
              className="min-w-[120px] bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {backupEnabled ? 'Backing up...' : 'Cleaning...'}
                </>
              ) : (
                'Log Out'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};