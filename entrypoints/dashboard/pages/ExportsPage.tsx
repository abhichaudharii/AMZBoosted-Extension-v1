import React, { useState, useMemo } from 'react';
import { 
  Download, FileText, Trash2, Search, RotateCcw, 
  FileSpreadsheet, FileJson, Clock, Database, BarChart, Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useExports } from '@/lib/hooks/useExports';
import { useRemoteTools } from '@/lib/hooks/useRemoteTools';
import { usePageState } from '@/lib/hooks/usePersistedState';
import { Export } from '@/lib/db/schema';
import { toast } from 'sonner';
import { getFlagByMarketplace } from './activity/utils';
import { ToolPageLayout } from '@/entrypoints/dashboard/components/ToolPageLayout';
import { PremiumToolStats } from '../components/PremiumToolStats';

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const ExportsPage: React.FC = () => {
    const { tools } = useRemoteTools();
    const { exports: allExports, loading, deleteExport } = useExports({ autoLoad: true });
    
    // State
    const [pageState, updatePageState] = usePageState('exports-v3', {
        searchQuery: '',
        formatFilter: 'all',
        marketplaceFilter: 'all',
        toolFilter: 'all',
        page: 1,
        itemsPerPage: 10,
    });
    const [downloading, setDownloading] = useState<Set<string>>(new Set());
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [deleteId, setDeleteId] = useState<string | null>(null); // Single delete
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false); // Bulk delete

    // Filtering
    const filteredExports = useMemo(() => {
        return allExports.filter(item => {
            const matchesSearch = !pageState.searchQuery || 
                (item.name || '').toLowerCase().includes(pageState.searchQuery.toLowerCase());
            
            const matchesFormat = pageState.formatFilter === 'all' || item.format === pageState.formatFilter;
            const matchesMarketplace = pageState.marketplaceFilter === 'all' || item.marketplace === pageState.marketplaceFilter;
            const matchesTool = pageState.toolFilter === 'all' || item.toolId === pageState.toolFilter;

            return matchesSearch && matchesFormat && matchesMarketplace && matchesTool;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [allExports, pageState]);

    // Stats
    const stats = useMemo(() => {
        const totalSize = allExports.reduce((sum, e) => sum + (e.fileSize || 0), 0);
        return {
            count: allExports.length,
            size: formatBytes(totalSize),
            avgSize: allExports.length ? formatBytes(totalSize / allExports.length) : '0 B',
        };
    }, [allExports]);

    // Helpers
    const uniqueMarketplaces = useMemo(() => 
        Array.from(new Set(allExports.map(e => e.marketplace).filter(Boolean))), 
    [allExports]);

    const uniqueTools = useMemo(() => {
        const ids = new Set(allExports.map(e => e.toolId).filter(Boolean));
        return Array.from(ids).map(id => {
            const tool = tools.find(t => t.id === id);
            return { id, name: tool?.name || id };
        });
    }, [allExports, tools]);

    // Pagination Logic
    const itemsPerPage = Number(pageState.itemsPerPage) || 10;
    const currentPage = Number(pageState.page) || 1;
    const totalPages = Math.ceil(filteredExports.length / itemsPerPage) || 1;
    const safePage = currentPage > totalPages || currentPage < 1 ? 1 : currentPage;

    const startIdx = (safePage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    
    const paginatedExports = filteredExports.slice(startIdx, endIdx);

    // Helpers
    const handleSelectAll = () => {
        if (selectedIds.size === filteredExports.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredExports.map(e => e.id)));
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const [bulkDeleteSize, setBulkDeleteSize] = React.useState<number>(0);
    const [isDeletingAll, setIsDeletingAll] = React.useState(false);

    const handleBulkDownload = async () => {
        const items = allExports.filter(e => selectedIds.has(e.id));
        toast.message(`Starting download for ${items.length} files...`);
        for (const item of items) {
            await handleDownload(item); // Process sequentially-ish
        }
    };

    const handleBulkDelete = async () => {
        const selectedItems = allExports.filter(e => selectedIds.has(e.id));
        const totalSize = selectedItems.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);
        setBulkDeleteSize(totalSize);
        setIsDeletingAll(false);
        setShowBulkDeleteConfirm(true);
    };

    const handleDeleteAll = () => {
        const totalSize = allExports.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);
        setBulkDeleteSize(totalSize);
        setIsDeletingAll(true);
        setShowBulkDeleteConfirm(true);
    };

    const confirmBulkDelete = async () => {
        try {
            const itemsToDelete = isDeletingAll ? allExports : allExports.filter(e => selectedIds.has(e.id));
            const total = itemsToDelete.length;
            let deletedCount = 0;
            
            // Close dialog immediately to show progress toast
            setShowBulkDeleteConfirm(false);
            
            const toastId = toast.loading(`Deleting 0/${total} exports...`);

            for (const item of itemsToDelete) {
                 await deleteExport(item.id);
                 deletedCount++;
                 toast.loading(`Deleting ${deletedCount}/${total} exports...`, { id: toastId });
                 // Small artificial delay for visual "progressive" feel
                 await new Promise(r => setTimeout(r, 20)); 
            }
            
            toast.success(`Deleted ${total} exports (${formatBytes(bulkDeleteSize)} freed)`, { id: toastId });
            setSelectedIds(new Set());
            setIsDeletingAll(false);
        } catch (e) {
            toast.error('Failed to delete some files');
        }
    };


    // Handlers
    const handleDownload = async (exportItem: Export) => {
        try {
            setDownloading(prev => new Set(prev).add(exportItem.id));
            if (!exportItem.fileContent) {
                toast.error(`File content missing for ${exportItem.name}`);
                return;
            }
            const link = document.createElement('a');
            link.href = exportItem.fileContent;
            link.download = exportItem.fileName || `export-${exportItem.id}.${exportItem.format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            // Small toast for single only
            if (selectedIds.size <= 1) toast.success('Download started');
        } catch (e) {
            toast.error('Download failed');
        } finally {
            setDownloading(prev => {
                const next = new Set(prev);
                next.delete(exportItem.id);
                return next;
            });
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteExport(deleteId);
            toast.success('Export deleted');
        } catch (e) {
            toast.error('Failed to delete export');
        } finally {
            setDeleteId(null);
        }
    };

    const clearFilters = () => {
        updatePageState({
            searchQuery: '',
            formatFilter: 'all',
            marketplaceFilter: 'all',
            toolFilter: 'all',
        });
    };

    // Icons
    const getIconForType = (type: string) => {
        const t = (type || '').toLowerCase();
        if (t.includes('csv')) return <FileText className="w-5 h-5 text-emerald-500" />;    // Green for CSV
        if (t.includes('xls')) return <FileSpreadsheet className="w-5 h-5 text-green-600" />; // Darker Green for Excel
        if (t.includes('json')) return <FileJson className="w-5 h-5 text-amber-500" />;     // Amber/Orange for JSON
        return <FileText className="w-5 h-5 text-gray-400" />;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0B] p-8 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#FF6B00]" />
            </div>
        );
    }
  
  const statsList = [
    { 
        title: "Total Exports", 
        value: stats.count, 
        icon: FileText, 
        colorClass: "text-[#FF6B00]",
        bgClass: "bg-[#FF6B00]/10"
    },
    { 
        title: "Storage Used", 
        value: stats.size, 
        icon: Database, 
        colorClass: "text-emerald-500",
        bgClass: "bg-emerald-500/10"
    },
    { 
        title: "Avg Size", 
        value: stats.avgSize, 
        icon: BarChart, 
        colorClass: "text-blue-400",
        bgClass: "bg-blue-400/10"
    },
    { 
        title: "Latest", 
        value: allExports[0] ? format(new Date(allExports[0].createdAt), 'MMM dd') : '-',
        icon: Clock, 
        colorClass: "text-amber-500",
        bgClass: "bg-amber-500/10"
    }
  ];

  return (
    <ToolPageLayout
        title='My <span class="text-[#FF6B00]">Exports</span>'
        subtitle="Access and manage your generated reports and data exports."
        icon={Download}
        badge="Data Management"
        iconColorClass="text-[#FF6B00]"
        showBackButton={false}
        actions={
            allExports.length > 0 && (
                <Button 
                        onClick={handleDeleteAll}
                        variant="destructive"
                        className="bg-red-600/10 text-red-500 hover:bg-red-600/20 border-red-600/20 border"
                >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete All
                </Button>
            )
        }
    >
            {/* Stats Cards using Premium Component */}
            <PremiumToolStats stats={statsList} />

            {/* Controls: Search + Filters + Select All */}
            <div className="bg-[#1A1A1C]/50 backdrop-blur-md rounded-xl border border-white/5 p-4 space-y-4">
                 <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                      {/* Search */}
                     <div className="relative w-full md:max-w-xs">
                         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                         <Input
                             placeholder="Search files..."
                             value={pageState.searchQuery}
                             onChange={(e) => updatePageState({ searchQuery: e.target.value })}
                             className="pl-9 bg-[#0A0A0B] border-white/10 text-white focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]/50"
                         />
                     </div>
                      
                      {/* Filters */}
                     <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                          <Select value={pageState.formatFilter} onValueChange={(v) => updatePageState({ formatFilter: v })}>
                             <SelectTrigger className="bg-[#0A0A0B] border-white/10 text-gray-300 w-[130px]">
                                 <SelectValue placeholder="Format" />
                             </SelectTrigger>
                             <SelectContent className="bg-[#1A1A1C] border-white/10 text-gray-300">
                                 <SelectItem value="all">All Formats</SelectItem>
                                 <SelectItem value="csv">CSV</SelectItem>
                                 <SelectItem value="json">JSON</SelectItem>
                                 <SelectItem value="xlsx">Excel</SelectItem>
                             </SelectContent>
                         </Select>
                         <Select value={pageState.marketplaceFilter} onValueChange={(v) => updatePageState({ marketplaceFilter: v })}>
                             <SelectTrigger className="bg-[#0A0A0B] border-white/10 text-gray-300 w-[140px]">
                                 <SelectValue placeholder="Marketplace" />
                             </SelectTrigger>
                             <SelectContent className="bg-[#1A1A1C] border-white/10 text-gray-300">
                                 <SelectItem value="all">All Markets</SelectItem>
                                 {uniqueMarketplaces.map(m => (
                                     <SelectItem key={m} value={m}>{m}</SelectItem>
                                 ))}
                             </SelectContent>
                         </Select>
                          <Select value={pageState.toolFilter} onValueChange={(v) => updatePageState({ toolFilter: v })}>
                             <SelectTrigger className="bg-[#0A0A0B] border-white/10 text-gray-300 w-[150px]">
                                 <SelectValue placeholder="Tool" />
                             </SelectTrigger>
                             <SelectContent className="bg-[#1A1A1C] border-white/10 text-gray-300">
                                 <SelectItem value="all">All Tools</SelectItem>
                                 {uniqueTools.map(t => (
                                     <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                 ))}
                             </SelectContent>
                         </Select>
                         
                         {(pageState.searchQuery || pageState.formatFilter !== 'all' || pageState.toolFilter !== 'all' || pageState.marketplaceFilter !== 'all') && (
                              <Button
                                 variant="ghost"
                                 size="icon"
                                 onClick={clearFilters}
                                 className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                             >
                                 <RotateCcw className="h-4 w-4" />
                             </Button>
                         )}
                     </div>
                 </div>

                 <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <Checkbox 
                         id="select-all"
                         checked={selectedIds.size === filteredExports.length && filteredExports.length > 0} 
                         onCheckedChange={handleSelectAll}
                         className="border-white/20 data-[state=checked]:bg-[#FF6B00] data-[state=checked]:border-[#FF6B00]"
                     />
                     <label htmlFor="select-all" className="text-sm text-gray-400 cursor-pointer select-none">
                         Select All ({filteredExports.length})
                     </label>
                 </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {filteredExports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-[#1A1A1C]/30 rounded-2xl border border-dashed border-white/10">
                         <div className="p-4 rounded-full bg-white/5 mb-4">
                             <Download className="w-8 h-8 text-gray-500" />
                         </div>
                         <h3 className="text-lg font-bold text-white mb-2">No Exports Found</h3>
                         <p className="text-gray-400 text-center max-w-sm">
                             {allExports.length === 0 ? "You haven't generated any exports yet." : "No fields match your current filters."}
                         </p>
                    </div>
                ) : (
                    paginatedExports.map((item) => {
                        const toolName = tools.find(t => t.id === item.toolId)?.name || item.toolName || item.toolId;
                        const isSelected = selectedIds.has(item.id);
                        const Flag = getFlagByMarketplace(item.marketplace);
                        const isDownloading = downloading.has(item.id);

                        return (
                             <div
                                 key={item.id}
                                 className={cn(
                                     "group relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 hover:cursor-pointer",
                                     isSelected 
                                         ? "bg-[#FF6B00]/10 border-[#FF6B00]/40 shadow-[0_0_15px_-5px_rgba(255,107,0,0.2)]" 
                                         : "bg-[#0A0A0B]/60 backdrop-blur-xl border-white/5 hover:border-white/10 hover:shadow-[0_0_20px_-5px_rgba(255,107,0,0.1)] hover:-translate-y-0.5"
                                 )}
                                 onClick={(e) => {
                                     // Prevent triggering if clicked on button
                                     const target = e.target as HTMLElement;
                                     if(target.closest('button')) return;
                                     toggleSelection(item.id);
                                 }}
                             >
                                 <Checkbox 
                                     checked={isSelected}
                                     onCheckedChange={() => toggleSelection(item.id)}
                                     className="border-white/20 data-[state=checked]:bg-[#FF6B00] data-[state=checked]:border-[#FF6B00] mr-2"
                                 />

                                 <div className="flex-shrink-0 p-3 rounded-lg bg-white/5 border border-white/5 group-hover:border-[#FF6B00]/20 transition-colors">
                                     {getIconForType(item.format)}
                                 </div>

                                 <div className="flex-1 min-w-0">
                                     <div className="flex items-center gap-2 mb-1">
                                         <h4 className={cn(
                                             "font-bold text-base transition-colors truncate",
                                             isSelected ? "text-white" : "text-white group-hover:text-[#FF6B00]"
                                         )}>
                                             {item.name || item.fileName}
                                         </h4>
                                         {/* Marketplace Badge with Flag */}
                                         {item.marketplace && (
                                             <Badge variant="outline" className="ml-2 gap-1.5 border-white/10 bg-white/5 text-gray-300 font-normal hover:bg-white/10">
                                                 {Flag && <Flag className="w-3.5 h-3.5 rounded-sm" />}
                                                 <span className="uppercase">{item.marketplace}</span>
                                             </Badge>
                                         )}
                                     </div>
                                     
                                     <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                          <Badge variant="secondary" className="bg-white/5 text-gray-400 hover:bg-white/10 border-transparent text-[10px] h-5 uppercase font-mono">
                                             {item.format}
                                         </Badge>
                                         <div className="flex items-center gap-1">
                                             <Clock className="w-3 h-3" />
                                             {format(new Date(item.createdAt), 'MMM dd, HH:mm')}
                                         </div>
                                         <div className="w-1 h-1 rounded-full bg-white/10" />
                                         <div className="font-mono">{formatBytes(item.fileSize || 0)}</div>
                                         
                                         {toolName && (
                                             <>
                                                 <div className="w-1 h-1 rounded-full bg-white/10" />
                                                 <div className="text-gray-400">{toolName}</div>
                                             </>
                                         )}
                                     </div>
                                 </div>

                                 {/* Actions */}
                                 <div className="flex items-center gap-2">
                                      <Button
                                         size="sm"
                                         className="bg-[#FF6B00] hover:bg-[#FF8533] text-white font-medium shadow-lg shadow-orange-500/10"
                                         onClick={() => handleDownload(item)}
                                         disabled={isDownloading}
                                     >
                                         {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                     </Button>
                                      <Button
                                         variant="ghost"
                                         size="icon"
                                         onClick={() => setDeleteId(item.id)}
                                         className="text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                                      >
                                          <Trash2 className="w-4 h-4" />
                                      </Button>
                                 </div>
                             </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                 <div className="flex items-center justify-center gap-2 pt-4 pb-8">
                 <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => updatePageState({ page: 1 })}
                     disabled={safePage === 1}
                     className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
                 >
                     «
                 </Button>

                 <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => updatePageState({ page: Math.max(1, safePage - 1) })}
                     disabled={safePage === 1}
                     className="h-8 px-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
                 >
                     <ChevronLeft className="h-3 w-3 mr-1" />
                     Prev
                 </Button>

                 <div className="flex items-center gap-1 mx-2">
                     {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                     let n;
                     if (totalPages <= 5) n = i + 1;
                     else if (safePage <= 3) n = i + 1;
                     else if (safePage >= totalPages - 2) n = totalPages - 4 + i;
                     else n = safePage - 2 + i;

                     return (
                         <Button
                         key={n}
                         variant="ghost"
                         size="sm"
                         onClick={() => updatePageState({ page: n })}
                         className={cn(
                             "h-8 w-8 p-0 text-xs transition-all duration-300",
                             safePage === n 
                                 ? "bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20 font-bold shadow-[0_0_10px_-5px_rgba(255,107,0,0.3)]" 
                                 : "bg-transparent text-gray-400 hover:text-white hover:bg-white/5 border-transparent"
                         )}
                         >
                         {n}
                         </Button>
                     );
                     })}
                 </div>

                 <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => updatePageState({ page: Math.min(totalPages, safePage + 1) })}
                     disabled={safePage === totalPages}
                     className="h-8 px-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
                 >
                     Next
                     <ChevronRight className="h-3 w-3 ml-1" />
                 </Button>

                 <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => updatePageState({ page: totalPages })}
                     disabled={safePage === totalPages}
                     className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30"
                 >
                     »
                 </Button>
                 </div>
            )}

            {/* Bulk Actions Floating Bar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-2xl bg-[#0A0A0B] border border-[#FF6B00]/30 shadow-2xl shadow-orange-900/20 rounded-2xl p-4 flex items-center justify-between z-50 animate-in slide-in-from-bottom-5">
                    <div className="flex items-center gap-3">
                         <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#FF6B00]/20 text-[#FF6B00] font-bold text-sm">
                             {selectedIds.size}
                         </div>
                         <span className="text-white font-medium">Selected</span>
                    </div>

                    <div className="flex items-center gap-2">
                         <Button
                             variant="ghost" 
                             size="sm"
                             onClick={() => setSelectedIds(new Set())}
                             className="text-gray-400 hover:text-white h-7 text-xs"
                         >
                             Cancel
                         </Button>
                         <div className="h-6 w-px bg-white/10 mx-2" />
                         <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkDownload}
                            className="h-7 text-xs bg-white/5 border-white/10 hover:bg-white/10 text-white"
                        >
                            <Download className="w-3 h-3 mr-1.5" />
                            Download
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            className="h-7 text-xs hover:bg-red-600/90"
                        >
                            <Trash2 className="w-3 h-3 mr-1.5" />
                            Delete
                        </Button>
                    </div>
                </div>
            )}
           
           {/* Dialogs (Single + Bulk Delete) */}
           <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                 <AlertDialogContent className="bg-[#1A1A1C] border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Export?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                           Permanently delete this file?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={confirmDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
           </AlertDialog>

            <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
                 <AlertDialogContent className="bg-[#1A1A1C] border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {isDeletingAll ? 'Delete All Exports?' : `Delete ${selectedIds.size} Exports?`}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                           {isDeletingAll 
                               ? `Are you sure you want to delete ALL ${allExports.length} export files?` 
                               : `Are you sure you want to delete these ${selectedIds.size} files?`}
                           <br />
                           <br />
                           <span className="text-red-400 font-medium">
                               This will free up {formatBytes(bulkDeleteSize)} of storage.
                           </span>
                           <br />
                           This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white">Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={confirmBulkDelete}>Delete All</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
           </AlertDialog>
    </ToolPageLayout>
  );
};