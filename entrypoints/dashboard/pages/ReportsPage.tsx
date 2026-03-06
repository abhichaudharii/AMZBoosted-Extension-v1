import React, { useState, useEffect } from 'react';
import { Download, Eye, Trash2, X, FileDown, Copy, Printer, Loader2, Search, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/data-table/DataTable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { toast } from 'sonner';
import { Report } from '@/lib/types/entities';
import { createSortableHeader } from '@/components/data-table/columns-helper';
import { useReports } from '@/lib/hooks/useReports';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageLoading } from '@/components/ui/page-loading';
import { exportToCSV, exportToExcel, printTable, copyToClipboard } from '@/lib/export-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SavedViewsManager } from '@/components/saved-views/SavedViewsManager';
import { BulkExportDialog } from '@/components/export/BulkExportDialog';
import { MarketplaceIcon } from '../components/shared/MarketplaceIcon';
import { StatusBadge } from '../components/shared/StatusBadge';
import { usePageState } from '@/lib/hooks/usePersistedState';



export const ReportsPage: React.FC = () => {
  // Persisted page state (filters, search, etc)
  const [pageState, updatePageState] = usePageState('reports', {
    searchQuery: '',
    toolFilter: 'all',
    statusFilter: 'all',
    marketplaceFilter: 'all',
    dateFilter: 'all',
  });

  // Use IndexedDB hook
  const {
    reports: allReportsRaw,
    loading,
    error,
    deleteReport,
    createReport,
    loadReports,
  } = useReports({ autoLoad: true });

  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ reports: Report[]; clearSelection: () => void } | null>(null);

  // Map IndexedDB reports to UI format
  const mappedReports: Report[] = allReportsRaw.map((report) => ({
    id: report.id,
    name: report.name || `Report ${report.id.slice(0, 8)}`,
    tool: report.toolName || 'Unknown Tool',
    createdAt: new Date(report.createdAt),
    marketplace: (report.marketplace || 'US').toUpperCase(),
    urlCount: report.data?.total_items || 0,
    status: (report.data ? 'ready' : 'generating') as 'ready' | 'generating' | 'failed',
    format: 'json' as const,
    size: 'N/A', // Client-side reports don't track size
  }));

  // Dummy Data for Preview
  const dummyReports: Report[] = Array.from({ length: 12 }).map((_, i) => ({
      id: `dummy-${i}`,
      name: `Performance Analysis - ${['Electronics', 'Home', 'Fashion', 'Toys'][i % 4]}`,
      tool: ['Product Scout', 'Keyword Tracker', 'Market Intelligence', 'Review Analyzer'][i % 4],
      createdAt: new Date(Date.now() - i * 86400000 * 1.5), // Spread over days
      marketplace: ['US', 'UK', 'DE', 'CA'][i % 4],
      urlCount: 100 + (i * 50),
      status: i === 0 ? 'generating' : i === 4 ? 'failed' : 'ready',
      format: (['csv', 'json', 'excel'][i % 3]) as any,
      size: `${(1.2 + i * 0.5).toFixed(1)} MB`,
  }));

  const allReports = mappedReports.length > 0 ? mappedReports : dummyReports;

  // Show error toast if loading fails
  useEffect(() => {
    if (error) {
      toast.error('Failed to load reports', {
        description: error,
      });
    }
  }, [error]);

  // Filter handlers
  const applyFilters = () => {
    let filtered = allReports;  // Use combined list

    // Search filter
    if (pageState.searchQuery) {
      const query = pageState.searchQuery.toLowerCase();
      filtered = filtered.filter((r) =>
        r.tool.toLowerCase().includes(query) || r.name.toLowerCase().includes(query)
      );
    }

    if (pageState.toolFilter !== 'all') {
      filtered = filtered.filter((r) => r.tool === pageState.toolFilter);
    }

    if (pageState.statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === pageState.statusFilter);
    }

    if (pageState.marketplaceFilter !== 'all') {
      filtered = filtered.filter((r) => r.marketplace === pageState.marketplaceFilter);
    }

    // Date filter
    if (pageState.dateFilter === 'today') {
      filtered = filtered.filter((r) => isToday(r.createdAt));
    } else if (pageState.dateFilter === 'week') {
      filtered = filtered.filter((r) => isThisWeek(r.createdAt, { weekStartsOn: 1 }));
    } else if (pageState.dateFilter === 'month') {
      filtered = filtered.filter((r) => isThisMonth(r.createdAt));
    }


    setFilteredReports(filtered);
  };

  React.useEffect(() => {
    applyFilters();
  }, [pageState.searchQuery, pageState.toolFilter, pageState.statusFilter, pageState.marketplaceFilter, pageState.dateFilter, allReportsRaw]); // allReportsRaw dependency triggers recalc of allReports

  // Handle loading saved view
  const handleLoadView = (filters: Record<string, any>) => {
    updatePageState(filters);
  };

  // Handle download report
  const handleDownloadReport = async (report: Report) => {
    try {
      setDownloading(report.id);

      toast.loading('Preparing download...', {
        id: `download-${report.id}`,
      });

      // Reports are stored in IndexedDB - show status message
      if (report.status === 'ready') {
        toast.success('Download started', {
          id: `download-${report.id}`,
          description: `${report.tool} - ${report.format.toUpperCase()}`,
        });
      } else {
        toast.error('Report not ready', {
          id: `download-${report.id}`,
          description: 'The report file may still be generating',
        });
      }
    } catch (error) {
      console.error('[ReportsPage] Error downloading report:', error);
      toast.error('Failed to download report', {
        id: `download-${report.id}`,
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setDownloading(null);
    }
  };

  // Handle view report details
  const handleViewReport = async (report: Report) => {
    try {
      if (report) {
        // TODO: Open a modal or navigate to report details page
        toast.info('Report details', {
          description: `Report: ${report.name} (${report.urlCount} URLs)`,
        });
      }
    } catch (error) {
      console.error('[ReportsPage] Error viewing report:', error);
      toast.error('Failed to load report details', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Handle delete single report
  const handleDeleteSingleReport = (report: Report) => {
    setPendingDelete({
      reports: [report],
      clearSelection: () => {},
    });
    setDeleteConfirm(true); // Show confirm dialog
  };

  // Get current filters for saving
  const currentFilters = {
    toolFilter: pageState.toolFilter,
    statusFilter: pageState.statusFilter,
    marketplaceFilter: pageState.marketplaceFilter,
    dateFilter: pageState.dateFilter,
  };

  // Clear all filters
  const handleClearFilters = () => {
    updatePageState({
      searchQuery: '',
      toolFilter: 'all',
      statusFilter: 'all',
      marketplaceFilter: 'all',
      dateFilter: 'all',
    });
  };

  // Bulk action handlers
  const handleBulkDelete = (selectedReports: Report[], clearSelection: () => void) => {
    setPendingDelete({ reports: selectedReports, clearSelection });
    setDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (pendingDelete) {
      try {
        setDeleting(true);
        const count = pendingDelete.reports.length;

        // Show deleting toast
        toast.loading(`Deleting ${count} report${count > 1 ? 's' : ''}...`, {
          id: 'delete-reports',
        });

        // Get full report data from raw reports (which has the correct type from IndexedDB)
        const reportsToDelete = pendingDelete.reports
          .map(report => allReportsRaw.find(rawReport => rawReport.id === report.id))
          .filter(report => report != null);

        // Delete reports via IndexedDB
        const deletePromises = pendingDelete.reports.map(report =>
          deleteReport(report.id)
        );

        await Promise.all(deletePromises);

        toast.success(`${count} report${count > 1 ? 's' : ''} deleted`, {
          id: 'delete-reports',
          description: 'The selected reports have been removed',
          duration: 5000,
          action: {
            label: 'Undo',
            onClick: async () => {
              try {
                // Restore all reports
                await Promise.all(reportsToDelete.map(report => createReport(report)));
                await loadReports();
                toast.success(`${count} report${count > 1 ? 's' : ''} restored`, {
                  description: 'All deleted reports have been restored',
                });
              } catch (error) {
                console.error('[ReportsPage] Error restoring reports:', error);
                toast.error('Failed to restore reports');
              }
            },
          },
        });

        pendingDelete.clearSelection();
        setPendingDelete(null);
        setDeleteConfirm(false);
      } catch (error) {
        console.error('[ReportsPage] Error deleting reports:', error);
        toast.error('Failed to delete reports', {
          id: 'delete-reports',
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        setDeleting(false);
        setPendingDelete(null);
      }
    }
  };

  const handleBulkDownload = async (selectedReports: Report[], clearSelection: () => void) => {
    const readyReports = selectedReports.filter((r) => r.status === 'ready');
    if (readyReports.length === 0) {
      toast.error('No ready reports selected', {
        description: 'Please select reports that are ready for download',
      });
      return;
    }

    try {
      toast.loading(`Preparing ${readyReports.length} download(s)...`, {
        id: 'bulk-download-reports',
      });

      let successCount = 0;
      let failCount = 0;

      // Download each report
      for (const report of readyReports) {
        try {
          // Reports are stored in IndexedDB - simulate download for ready reports
          if (report.status === 'ready') {
            successCount++;
            // Add small delay between downloads to avoid overwhelming browser
            await new Promise(resolve => setTimeout(resolve, 300));
          } else {
            console.warn(`[ReportsPage] Report ${report.id} is not ready for download`);
            failCount++;
          }
        } catch (error) {
          console.error(`[ReportsPage] Error downloading report ${report.id}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Downloaded ${successCount} report(s)`, {
          id: 'bulk-download-reports',
          description: failCount > 0 ? `${failCount} download(s) failed` : 'All downloads started',
        });
      } else {
        toast.error('Failed to download reports', {
          id: 'bulk-download-reports',
          description: 'No ready reports available',
        });
      }

      clearSelection();
    } catch (error) {
      console.error('[ReportsPage] Error during bulk download:', error);
      toast.error('Failed to download reports', {
        id: 'bulk-download-reports',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      const { allowed, reason } = await import('@/lib/services/credits.service').then(m => m.creditsService.canPerformAction('export'));
      if (!allowed) {
        toast.error(reason || 'Export limit reached');
        return;
      }

      const exportData = filteredReports.map(r => ({
        Tool: r.tool,
        Date: format(r.createdAt, 'yyyy-MM-dd HH:mm'),
        Marketplace: r.marketplace,
        URLs: r.urlCount,
        Status: r.status,
        Format: r.format,
        Size: r.size,
      }));
      exportToCSV(exportData, `reports-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      toast.success('Exported to CSV', {
        description: `${filteredReports.length} reports exported successfully`,
      });
    } catch (error) {
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      const { allowed, reason } = await import('@/lib/services/credits.service').then(m => m.creditsService.canPerformAction('export'));
      if (!allowed) {
          toast.error(reason || 'Export limit reached');
          return;
      }
      
      const exportData = filteredReports.map(r => ({
        Tool: r.tool,
        Date: format(r.createdAt, 'yyyy-MM-dd HH:mm'),
        Marketplace: r.marketplace,
        URLs: r.urlCount,
        Status: r.status,
        Format: r.format,
        Size: r.size,
      }));
      exportToExcel(exportData, `reports-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      toast.success('Exported to Excel', {
        description: `${filteredReports.length} reports exported successfully`,
      });
    } catch (error) {
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handlePrint = () => {
    try {
      const exportData = filteredReports.map(r => ({
        Tool: r.tool,
        Date: format(r.createdAt, 'yyyy-MM-dd HH:mm'),
        Marketplace: r.marketplace,
        URLs: r.urlCount,
        Status: r.status,
        Format: r.format,
        Size: r.size,
      }));
      printTable(exportData, 'Reports');
      toast.success('Opening print dialog');
    } catch (error) {
      toast.error('Print failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const exportData = filteredReports.map(r => ({
        Tool: r.tool,
        Date: format(r.createdAt, 'yyyy-MM-dd HH:mm'),
        Marketplace: r.marketplace,
        URLs: r.urlCount,
        Status: r.status,
        Format: r.format,
        Size: r.size,
      }));
      await copyToClipboard(exportData);
      toast.success('Copied to clipboard', {
        description: `${filteredReports.length} reports copied`,
      });
    } catch (error) {
      toast.error('Copy failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Table columns
  const columns: ColumnDef<Report>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: createSortableHeader('Name'),
      cell: ({ row }) => {
        const report = row.original;
        return (
          <div className="max-w-[200px]">
            <div className="font-medium text-sm truncate text-white">{report.name}</div>
            <div className="text-xs text-muted-foreground truncate">{report.tool}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: createSortableHeader('Date'),
      cell: ({ row }) => (
        <div className="text-sm text-gray-400">
          {format(row.getValue('createdAt'), 'MMM dd, yyyy')}
          <div className="text-xs text-gray-500">{format(row.getValue('createdAt'), 'HH:mm')}</div>
        </div>
      ),
    },
    {
      accessorKey: 'marketplace',
      header: 'Marketplace',
      cell: ({ row }) => {
        const market = row.getValue('marketplace') as string;
        return <MarketplaceIcon marketplace={market} showName={true} />;
      },
    },
    {
      accessorKey: 'urlCount',
      header: createSortableHeader('URLs'),
      cell: ({ row }) => (
        <div className="text-sm font-mono text-gray-400">
          {row.getValue('urlCount')}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
    },
    {
      accessorKey: 'format',
      header: 'Format',
      cell: ({ row }) => {
        const format = row.getValue('format') as string;
        const colors: Record<string, string> = {
            csv: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
            json: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
            excel: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
        };
        return (
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${colors[format] || 'text-gray-400 bg-gray-500/10 border-gray-500/20'}`}>
                {format}
            </span>
        );
      },
    },
    // {
    //   accessorKey: 'size',
    //   header: 'Size',
    //   cell: ({ row }) => <div className="text-sm text-muted-foreground">{row.getValue('size')}</div>,
    // },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const report = row.original;
        const isDownloading = downloading === report.id;
        return (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white"
                  disabled={report.status !== 'ready' || isDownloading}
                  onClick={() => handleDownloadReport(report)}
                >
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#FF6B00]" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isDownloading ? 'Downloading...' : 'Download report'}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-white"
                  disabled={report.status !== 'ready'}
                  onClick={() => handleViewReport(report)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View details</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-500/10"
                  disabled={deleting}
                  onClick={() => handleDeleteSingleReport(report)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete report</TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
  ];

  const uniqueTools = Array.from(new Set(allReports.map((r) => r.tool)));
  const uniqueMarketplaces = Array.from(new Set(allReports.map((r) => r.marketplace)));


  if (loading && allReportsRaw.length === 0) {
    return <PageLoading text="Loading reports..." subtitle="Fetching your generated reports" />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-6 lg:p-8 animate-fade-in relative overflow-hidden text-foreground pb-24">
       {/* Ambient Background */}
       <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#FF6B00]/5 rounded-full blur-[120px] pointer-events-none" />
       <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#FF8533]/5 rounded-full blur-[120px] pointer-events-none" />

       <div className="max-w-7xl mx-auto space-y-8 relative z-10">
          {/* Header */}
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
               <div>
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-400 mb-4">
                       <FileText className="w-3 h-3 text-[#FF6B00]" />
                       <span>Reporting</span>
                   </div>
                   <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
                   Generated <span className="text-[#FF6B00]">Reports</span>
                   </h1>
                   <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
                   View and download detailed reports generated by your tools.
                   </p>
               </div>
               
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="bg-[#FF6B00] hover:bg-[#FF8533] text-white shadow-lg shadow-orange-500/20 border-transparent gap-2 px-6">
                            <FileDown className="h-4 w-4" />
                            Export Data
                        </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1A1A1C] border-white/10 text-white">
                        <DropdownMenuItem onClick={handleExportCSV} className="gap-2 focus:bg-white/10 focus:text-white cursor-pointer">
                            <FileDown className="h-4 w-4" />
                            Export as CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportExcel} className="gap-2 focus:bg-white/10 focus:text-white cursor-pointer">
                            <FileDown className="h-4 w-4" />
                            Export as Excel
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem onClick={handleCopyToClipboard} className="gap-2 focus:bg-white/10 focus:text-white cursor-pointer">
                            <Copy className="h-4 w-4" />
                            Copy to Clipboard
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
           </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Reports - Blue */}
        <div className="bg-[#0A0A0B]/60 backdrop-blur-md border border-white/5 rounded-xl p-4 flex flex-col justify-between relative group hover:border-white/10 transition-all overflow-hidden">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Reports</span>
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                    <FileText className="h-4 w-4" />
                </div>
            </div>
            <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">
                {allReports.length}
            </div>
            <div className="text-xs text-gray-500 font-mono mt-1">All generated reports</div>
        </div>

        {/* Ready Reports - Emerald */}
        <div className="bg-[#0A0A0B]/60 backdrop-blur-md border border-white/5 rounded-xl p-4 flex flex-col justify-between relative group hover:border-white/10 transition-all overflow-hidden">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Ready for Download</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <Download className="h-4 w-4" />
                </div>
            </div>
            <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">
                {allReports.filter(r => r.status === 'ready').length}
            </div>
            <div className="text-xs text-gray-500 font-mono mt-1">
                 {allReports.length > 0 ? Math.round(allReports.filter(r => r.status === 'ready').length / allReports.length * 100) : 0}% success rate
            </div>
        </div>

        {/* Total URLs - Orange */}
        <div className="bg-[#0A0A0B]/60 backdrop-blur-md border border-white/5 rounded-xl p-4 flex flex-col justify-between relative group hover:border-white/10 transition-all overflow-hidden">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Items</span>
                <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
                    <Search className="h-4 w-4" />
                </div>
            </div>
             <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">
                {allReports.reduce((acc, curr) => acc + curr.urlCount, 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 font-mono mt-1">Processed across all reports</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1A1A1C]/50 backdrop-blur-md rounded-xl border border-white/5 p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
               {/* Search */}
                <div className="relative w-full md:max-w-xs">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search reports..."
                    value={pageState.searchQuery}
                    onChange={(e) => updatePageState({ searchQuery: e.target.value })}
                    className="pl-9 bg-[#0A0A0B] border-white/10 text-white focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]/50"
                  />
                </div>

                {/* Filters Row */}
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 items-center">
                    <Select value={pageState.toolFilter} onValueChange={(value) => updatePageState({ toolFilter: value })}>
                        <SelectTrigger className="w-[130px] bg-[#0A0A0B] border-white/10 text-gray-300">
                        <SelectValue placeholder="Tool" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A1C] border-white/10 text-gray-300">
                        <SelectItem value="all">All Tools</SelectItem>
                        {uniqueTools.map((tool) => (
                            <SelectItem key={tool} value={tool}>
                            {tool}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>

                    <Select value={pageState.statusFilter} onValueChange={(value) => updatePageState({ statusFilter: value })}>
                        <SelectTrigger className="w-[110px] bg-[#0A0A0B] border-white/10 text-gray-300">
                        <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A1C] border-white/10 text-gray-300">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="ready">Ready</SelectItem>
                        <SelectItem value="generating">Generating</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={pageState.marketplaceFilter} onValueChange={(value) => updatePageState({ marketplaceFilter: value })}>
                        <SelectTrigger className="w-[140px] bg-[#0A0A0B] border-white/10 text-gray-300">
                        <SelectValue placeholder="Market" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A1C] border-white/10 text-gray-300">
                        <SelectItem value="all">All Markets</SelectItem>
                        {uniqueMarketplaces.map((market) => (
                            <SelectItem key={market} value={market}>
                            {market}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>

                    <Select value={pageState.dateFilter} onValueChange={(value) => updatePageState({ dateFilter: value })}>
                        <SelectTrigger className="w-[130px] bg-[#0A0A0B] border-white/10 text-gray-300">
                        <SelectValue placeholder="Date" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A1C] border-white/10 text-gray-300">
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                    </Select>

                    {(pageState.searchQuery || pageState.toolFilter !== 'all' || pageState.statusFilter !== 'all' || pageState.marketplaceFilter !== 'all' || pageState.dateFilter !== 'all') && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleClearFilters}
                            title="Clear filters"
                            className="h-9 w-9 text-muted-foreground hover:text-white hover:bg-white/10 shrink-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
          </div>
      </div>

       {/* Table */}
       <div className="rounded-xl border border-white/5 bg-[#0A0A0B]/60 backdrop-blur-md overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredReports}
            searchPlaceholder="Search reports..."
            showColumnVisibility={false}
            showDensityToggle={false}
            showGlobalFilter={false}
            floatingBar={true}
            selectOnRowClick={true}
            pageSize={15}
            bulkActions={(selectedReports, clearSelection) => {
              const exportColumns = [
                { id: 'tool', label: 'Tool' },
                { id: 'createdAt', label: 'Date' },
                { id: 'marketplace', label: 'Marketplace' },
                { id: 'urlCount', label: 'URLs' },
                { id: 'status', label: 'Status' },
                { id: 'format', label: 'Format' },
                { id: 'size', label: 'Size' },
              ];

              return (
                <>
                  <BulkExportDialog
                    data={selectedReports.map(r => ({
                      tool: r.tool,
                      createdAt: format(r.createdAt, 'yyyy-MM-dd HH:mm'),
                      marketplace: r.marketplace,
                      urlCount: r.urlCount,
                      status: r.status,
                      format: r.format,
                      size: r.size,
                    }))}
                    columns={exportColumns}
                    filename={`reports-${format(new Date(), 'yyyy-MM-dd')}`}
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs bg-white/5 border-white/10 hover:bg-white/10 text-white gap-1.5"
                      >
                        <FileDown className="h-3 w-3" />
                        Export
                      </Button>
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs bg-white/5 border-white/10 hover:bg-white/10 text-white gap-1.5"
                    onClick={() => handleBulkDownload(selectedReports, clearSelection)}
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-7 text-xs hover:bg-red-600/90 gap-1.5"
                    onClick={() => handleBulkDelete(selectedReports, clearSelection)}
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </>
              );
            }}
          />
        </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm}
        onOpenChange={setDeleteConfirm}
        title="Delete Reports"
        description={`Are you sure you want to delete ${pendingDelete?.reports.length || 0} report(s)? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDelete}
      />
      </div>
    </div>
  );
};
