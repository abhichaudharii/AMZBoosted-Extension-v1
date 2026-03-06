import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PageLoading } from '@/components/ui/page-loading';
import {
  Lock,
  Loader2,
  User,
  Shield,
  Clock,
  Save,
  Mail,
  Key,
  Database,
  Upload,
  Download,
  FileJson,
  Check,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Settings,
  Archive,
  AlertCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api/client';
import { useUser } from '@/lib/hooks/useUserData';
import { encryptionService } from '@/lib/services/encryption.service';
import { secureStorage } from '@/lib/storage/secure-storage';
import { dataSyncService } from '@/lib/services/data-sync.service';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge'; 

type TabValue = 'profile' | 'security' | 'data';

export const AccountPage: React.FC = () => {
  const { user, loading: userLoading, setUser } = useUser();
  
  const loading = userLoading;
  const [activeTab, setActiveTab] = useState<TabValue>('profile');

  // Profile state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [timezone, setTimezone] = useState('America/Los_Angeles');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Data Import State
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportStep, setExportStep] = useState<'idle' | 'encrypting' | 'downloading' | 'success'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Backup History State
  const [backupHistory, setBackupHistory] = useState<any[]>([]);

  useEffect(() => {
    loadBackupHistory();
  }, []);

  const loadBackupHistory = async () => {
    const { backupHistory } = await secureStorage.get('backupHistory');
    if (backupHistory) {
      setBackupHistory(backupHistory);
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name || user.full_name || '');
      setEmail(user.email || '');
      setTimezone(user.timezone || 'America/Los_Angeles');
    }
  }, [user]);


  const handleSaveProfile = async () => {
    try {
      const updates: any = {};
      if (name !== (user?.name || user?.full_name)) updates.fullName = name;
      if (timezone !== user?.timezone) updates.timezone = timezone;

      if (Object.keys(updates).length === 0) {
        toast.info('No changes to save');
        return;
      }

      setSavingProfile(true);
      const result = await apiClient.updateProfile(updates);

      if (result) {
        toast.success('Profile updated successfully');
        setUser(result.user);
        window.dispatchEvent(new CustomEvent('userProfileUpdated', {
          detail: { name: result.user.name || result.user.full_name }
        }));
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('[AccountPage] Failed to save profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const hasProfileChanges = () => {
    return name !== (user?.name || user?.full_name || '') ||
           timezone !== (user?.timezone || 'America/Los_Angeles');
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    try {
      const success = await apiClient.changePassword(currentPassword, newPassword);

      if (success) {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error('Failed to change password');
      }
    } catch (error) {
      console.error('[AccountPage] Failed to change password:', error);
      toast.error('Failed to change password');
    }
  };


  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      setImporting(true);
      const text = await file.text();
      const data = await encryptionService.decrypt(text, user);
      
      if (data.backupMetadata && data.indexedDB) {
        await dataSyncService.importData(data.indexedDB);
        if (data.localStorage) {
           if (data.localStorage.encryption_key) {
               await chrome.storage.local.set({ encryption_key: data.localStorage.encryption_key });
               delete data.localStorage.encryption_key;
           }
          await secureStorage.set(data.localStorage);
        }
        if (data.syncStorage) {
          await chrome.storage.sync.set(data.syncStorage);
        }
      } else {
        await dataSyncService.importData(data);
      }

      // Add to History
      const newRecord = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        type: 'import',
        sizeBytes: text.length 
      };
      
      const { backupHistory: currentHistory = [] } = await secureStorage.get('backupHistory');
      const updatedHistory = [newRecord, ...currentHistory];
      await secureStorage.set({ backupHistory: updatedHistory });
      setBackupHistory(updatedHistory);

      toast.success('Data verified and imported successfully');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('[AccountPage] Import failed:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to import data. Please ensure this backup belongs to your account.');
      }
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearHistory = async () => {
    try {
        await secureStorage.set({ backupHistory: [] });
        setBackupHistory([]);
        toast.success('History cleared');
    } catch (e) {
        toast.error('Failed to clear history');
    }
  };

  const handleManualBackup = async () => {
    if (exporting) return;
    
    try {
      setExporting(true);
      setExportStep('encrypting');
      
      await new Promise(resolve => setTimeout(resolve, 800));
      setExportStep('downloading');
      
      const response = await chrome.runtime.sendMessage({ type: 'SECURE_EXPORT' });
      
      if (response && response.success) {
        setExportStep('success');
        toast.success('Secure backup created successfully');
        loadBackupHistory();
        setTimeout(() => {
          setExporting(false);
          setExportStep('idle');
        }, 3000);
      } else {
        throw new Error(response?.error || 'Export failed');
      }
    } catch (error) {
      console.error('[AccountPage] Backup failed:', error);
      toast.error('Failed to create backup');
      setExporting(false);
      setExportStep('idle');
    }
  };


  if (loading) {
    return <PageLoading text="Loading account settings..." subtitle="Fetching your profile and preferences" />;
  }

  const tabs = [
    { value: 'profile' as TabValue, label: 'Profile', icon: User, description: 'Personal information' },
    { value: 'security' as TabValue, label: 'Security', icon: ShieldCheck, description: 'Password & access' },
    { value: 'data' as TabValue, label: 'Data Mgmt', icon: Database, description: 'Backup & export' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-6 lg:p-8 animate-fade-in relative overflow-hidden text-foreground">
       {/* Ambient Background */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#FF6B00]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#FF8533]/5 rounded-full blur-[120px] pointer-events-none" />


      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        
         {/* Page Header */}
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-400 mb-4">
                    <Settings className="w-3 h-3 text-[#FF6B00]" />
                    <span>Configuration</span>
                </div>
                <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
                Account & <span className="text-[#FF6B00]">Settings</span>
                </h1>
                <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
                Manage your personal profile, security preferences, and data privacy settings.
                </p>
            </div>
         </div>

        <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:w-72 flex-shrink-0 space-y-6">
                 {/* User Identity Card */}
                 <div className="p-4 rounded-2xl bg-[#0A0A0B]/60 backdrop-blur-xl border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B00] to-[#FF8533] flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-500/20">
                        {user?.name?.[0] || 'U'}
                    </div>
                    <div className="min-w-0">
                        <div className="font-bold text-white truncate">{user?.name || 'User'}</div>
                        <div className="text-xs text-gray-400 truncate">{user?.email}</div>
                    </div>
                 </div>

                 {/* Navigation Menu */}
                 <nav className="space-y-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.value;
                        return (
                            <button
                                key={tab.value}
                                onClick={() => setActiveTab(tab.value)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 text-left group relative overflow-hidden",
                                    isActive 
                                    ? "bg-[#FF6B00]/10 text-[#FF6B00] shadow-[0_0_20px_-5px_rgba(255,107,0,0.15)] ring-1 ring-[#FF6B00]/20" 
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {isActive && <div className="absolute left-0 top-0 w-1 h-full bg-[#FF6B00]" />}
                                <Icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", isActive ? "text-[#FF6B00]" : "text-gray-500 group-hover:text-gray-300")} />
                                <div>
                                    <div className="font-semibold text-sm">{tab.label}</div>
                                    <div className="text-xs opacity-70">{tab.description}</div>
                                </div>
                                <ChevronRight className={cn(
                                    "w-4 h-4 ml-auto transition-transform duration-300",
                                    isActive ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                                )} />
                            </button>
                        );
                    })}
                 </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-w-0">
                <div className="bg-[#0A0A0B]/40 backdrop-blur-md rounded-3xl border border-white/5 p-8 relative">
                    {/* Content Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6B00]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

                    {activeTab === 'profile' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div>
                                 <h2 className="text-xl font-bold text-white mb-2">Personal Information</h2>
                                 <p className="text-gray-400 text-sm">Update your public profile details and preferences.</p>
                             </div>
                             
                             <div className="grid gap-6 max-w-2xl">
                                <div className="space-y-2">
                                    <Label className="text-gray-300">Full Name</Label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-500 group-focus-within:text-[#FF6B00] transition-colors" />
                                        <Input 
                                            value={name} 
                                            onChange={(e) => setName(e.target.value)} 
                                            className="pl-10 bg-[#0A0A0B]/50 border-white/10 focus:border-[#FF6B00]/50 focus:ring-[#FF6B00]/20 text-white h-10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-gray-300">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                                        <Input
                                            value={email}
                                            disabled
                                            className="pl-10 bg-white/5 border-white/5 text-gray-500 h-10 cursor-not-allowed"
                                        />
                                        <div className="absolute right-3 top-2.5">
                                            <Lock className="h-4 w-4 text-gray-600" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Contact support to change your email address.
                                    </p>
                                </div>

                                <div className="space-y-2 hidden">
                                    <Label className="text-gray-300">Timezone</Label>
                                    <Select value={timezone} onValueChange={setTimezone}>
                                        <SelectTrigger className="w-full bg-[#0A0A0B]/50 border-white/10 text-white focus:ring-[#FF6B00]/20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#1A1A1C] border-white/10 text-white">
                                            <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                                            <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                                            <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                                            <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                                            <SelectItem value="Europe/London">London (GMT)</SelectItem>
                                            <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                                            <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                             </div>

                             <div className="pt-6 border-t border-white/5 flex justify-end">
                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={!hasProfileChanges() || savingProfile}
                                    className="bg-[#FF6B00] hover:bg-[#FF8533] text-white min-w-[140px]"
                                >
                                    {savingProfile ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                    Save Changes
                                </Button>
                             </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div>
                                 <h2 className="text-xl font-bold text-white mb-2">Security Settings</h2>
                                 <p className="text-gray-400 text-sm">Manage your password and account access.</p>
                             </div>

                             <div className="space-y-6 max-w-2xl">
                                <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-start gap-3">
                                    <ShieldCheck className="w-5 h-5 text-orange-500 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-bold text-orange-500">Secure Your Account</h4>
                                        <p className="text-xs text-gray-400 mt-1">Use a strong password comprising letters, numbers, and symbols.</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-gray-300">Current Password</Label>
                                    <Input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="bg-[#0A0A0B]/50 border-white/10 text-white focus:border-[#FF6B00]/50"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-gray-300">New Password</Label>
                                        <Input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="bg-[#0A0A0B]/50 border-white/10 text-white focus:border-[#FF6B00]/50"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-300">Confirm New Password</Label>
                                        <Input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="bg-[#0A0A0B]/50 border-white/10 text-white focus:border-[#FF6B00]/50"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                             </div>

                             <div className="pt-6 border-t border-white/5 flex justify-end">
                                <Button onClick={handleChangePassword} className="bg-[#FF6B00] hover:bg-[#FF8533] text-white min-w-[140px]">
                                    <Key className="h-4 w-4 mr-2" />
                                    Update Password
                                </Button>
                             </div>
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div>
                                 <h2 className="text-xl font-bold text-white mb-2">Data Management</h2>
                                 <p className="text-gray-400 text-sm">Download or restore your data securely. All data is encrypted.</p>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Import Box */}
                                <div className="relative group rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] p-6 hover:bg-[#FF6B00]/[0.02] hover:border-[#FF6B00]/30 transition-all duration-300">
                                    <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                                        <Upload className="w-4 h-4 text-[#FF6B00]" /> Restore from Backup
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-6">Import a valid JSON backup file associated with this account.</p>
                                    
                                    <Input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".json"
                                        className="hidden"
                                        onChange={handleImportData}
                                    />
                                    <Button 
                                        variant="outline" 
                                        className="w-full bg-white/5 border-white/10 text-white hover:bg-[#FF6B00] hover:text-white border-0 transition-colors"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={importing}
                                    >
                                        {importing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileJson className="w-4 h-4 mr-2" />}
                                        Select File
                                    </Button>
                                </div>

                                {/* Export Box */}
                                <div className="relative group rounded-2xl border border-white/10 bg-gradient-to-br from-[#FF6B00]/5 to-[#FF8533]/5 p-6">
                                    <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                                        <Download className="w-4 h-4 text-green-400" /> Create Backup
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-6">Generate an encrypted backup of your entire account data.</p>
                                    
                                    <Button 
                                        onClick={handleManualBackup}
                                        disabled={exporting}
                                        className={cn(
                                            "w-full transition-all duration-300",
                                            exportStep === 'success' 
                                                ? "bg-green-500 hover:bg-green-600 text-white" 
                                                : "bg-[#0A0A0B] border border-white/10 text-white hover:bg-white/5"
                                        )}
                                    >
                                        {exportStep === 'idle' && (
                                            <>
                                                <Download className="h-4 w-4 mr-2" />
                                                Backup Now
                                            </>
                                        )}
                                        {exportStep === 'encrypting' && (
                                            <>
                                                <Lock className="h-4 w-4 mr-2 animate-pulse" />
                                                Encrypting...
                                            </>
                                        )}
                                        {exportStep === 'downloading' && (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Downloading...
                                            </>
                                        )}
                                        {exportStep === 'success' && (
                                            <>
                                                <Check className="h-4 w-4 mr-2" />
                                                Done
                                            </>
                                        )}
                                    </Button>
                                </div>
                             </div>

                             {/* History Table */}
                             <div className="pt-8 border-t border-white/5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-white text-sm">Activity History</h3>
                                    {backupHistory.length > 0 && (
                                        <Button variant="ghost" size="sm" className="h-6 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={handleClearHistory}>
                                            Clear History
                                        </Button>
                                    )}
                                </div>
                                
                                <div className="rounded-xl border border-white/5 overflow-hidden bg-[#0A0A0B]/40">
                                    {backupHistory.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500 text-xs">No backups created on this device yet.</div>
                                    ) : (
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-white/5 text-gray-400 font-medium text-xs">
                                                <tr>
                                                    <th className="px-4 py-3">Date</th>
                                                    <th className="px-4 py-3">Type</th>
                                                    <th className="px-4 py-3 text-right">Size</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {backupHistory.map((backup) => (
                                                    <tr key={backup.id} className="hover:bg-white/[0.02] transition-colors">
                                                        <td className="px-4 py-3 text-white">
                                                            {new Date(backup.date).toLocaleDateString()}
                                                            <span className="text-xs text-gray-500 ml-2">
                                                                {new Date(backup.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant="secondary" className="bg-[#FF6B00]/10 text-[#FF6B00] hover:bg-[#FF6B00]/20 border-0 text-[10px] capitalize">
                                                                {backup.type}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono text-xs text-gray-500">
                                                            {(backup.sizeBytes / 1024).toFixed(1)} KB
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
