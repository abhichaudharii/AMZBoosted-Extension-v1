import React, { useState, useMemo } from 'react';
import { 
  Zap, TrendingUp, RotateCw, Calendar, ArrowUpRight, ArrowDownRight, 
  Search, ChevronLeft, ChevronRight, RotateCcw, Ban, CreditCard
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '../components/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useTasks } from '@/lib/hooks/useTasks';
import { usePageState } from '@/lib/hooks/usePersistedState';
import { PageLoading } from '@/components/ui/page-loading';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// Define the shape of our data to prevent TS errors
interface Transaction {
  id: string;
  timestamp: string;
  toolName: string;
  toolId: string;
  type: 'partial' | 'debit' | 'failed';
  creditsDebited: number;
  creditsRefunded: number;
  creditsUsed: number;
  urlsProcessed: number;
  urlsFailed: number;
  status: string;
  marketplace: string;
  source: string;
}

export const CreditHistoryPage: React.FC = () => {
  const { tasks, loading } = useTasks({ autoLoad: true, pollInterval: 50000 });
  
  const [pageState, updatePageState] = usePageState('credit-history', {
    searchQuery: '',
    typeFilter: 'all',
    toolFilter: 'all',
    itemsPerPage: 10,
    page: 1,
  });

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // 1. DATA TRANSFORMATION (Wrapped in useMemo for performance)
  const transactions = useMemo(() => {
    if (!tasks) return [];
    
    return tasks
      .filter(task => task.status === 'completed' || task.status === 'failed')
      .map(task => {
        const urlsProcessed = task.outputData?.successful || 0;
        const urlsFailed = task.outputData?.failed || 0;
        
        // Explicitly convert to Number to avoid NaN issues
        const creditsDebited = Number(task.urlCount || 0);
        const creditsRefunded = Number(urlsFailed || 0);
        const creditsUsed = Number(task.creditsUsed ?? urlsProcessed);

        const tx: Transaction = {
          id: task.id || `temp-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: task.completedAt || task.createdAt || new Date().toISOString(),
          toolName: task.toolName || 'Unknown Tool',
          toolId: task.toolId || 'unknown',
          type: creditsRefunded > 0 ? 'partial' : creditsUsed > 0 ? 'debit' : 'failed',
          creditsDebited,
          creditsRefunded,
          creditsUsed,
          urlsProcessed,
          urlsFailed,
          status: task.status,
          marketplace: task.marketplace || 'N/A',
          source: task.inputData?.scheduleId ? 
            (task.inputData?.triggeredBy === 'manual' ? 'Manual Schedule' : 'Auto Schedule') : 
            'Quick Run',
        };
        return tx;
      })
      .sort((a, b) => {
        // Safe sort handling
        const dateA = new Date(a.timestamp).getTime() || 0;
        const dateB = new Date(b.timestamp).getTime() || 0;
        return dateB - dateA;
      });
  }, [tasks]);

  // 2. STATS CALCULATION
  const stats = useMemo(() => ({
    totalDebited: transactions.reduce((sum, t) => sum + t.creditsDebited, 0),
    totalRefunded: transactions.reduce((sum, t) => sum + t.creditsRefunded, 0),
    totalUsed: transactions.reduce((sum, t) => sum + t.creditsUsed, 0),
    successfulTasks: transactions.filter(t => t.status === 'completed' && t.creditsRefunded === 0).length,
    partialTasks: transactions.filter(t => t.creditsRefunded > 0 && t.creditsUsed > 0).length,
    failedTasks: transactions.filter(t => t.creditsUsed === 0).length,
  }), [transactions]);

  // 3. FILTERING
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = !pageState.searchQuery || 
        transaction.toolName.toLowerCase().includes(pageState.searchQuery.toLowerCase());

      const matchesType = pageState.typeFilter === 'all' ||
        (pageState.typeFilter === 'debit' && transaction.creditsRefunded === 0 && transaction.creditsUsed > 0) ||
        (pageState.typeFilter === 'refund' && transaction.creditsRefunded > 0) ||
        (pageState.typeFilter === 'failed' && transaction.creditsUsed === 0);

      const matchesTool = pageState.toolFilter === 'all' || transaction.toolId === pageState.toolFilter;

      return matchesSearch && matchesType && matchesTool;
    });
  }, [transactions, pageState.searchQuery, pageState.typeFilter, pageState.toolFilter]);

  // 4. ROBUST PAGINATION LOGIC
  const itemsPerPage = Number(pageState.itemsPerPage) || 10;
  const currentPageState = Number(pageState.page) || 1;
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const safePage = currentPageState > totalPages || currentPageState < 1 ? 1 : currentPageState;

  const startIdx = (safePage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  
  const paginatedTransactions = filteredTransactions.slice(startIdx, endIdx);

  // Helper: Unique tools list
  const uniqueTools = useMemo(() => {
    return Array.from(new Map(tasks.map(t => [t.toolId, t.toolName])).entries())
      .map(([id, name]) => ({ id, name: name || id }));
  }, [tasks]);

  // Helper: Safe Date Format
  const safeFormat = (dateString: string, fmt: string) => {
    try {
      return format(new Date(dateString), fmt);
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const getTypeConfig = (transaction: Transaction) => {
    // CASE 1: Failed / Void 
    if (transaction.creditsUsed === 0) {
      return {
        label: 'Void / Failed',
        icon: <Ban className="w-3.5 h-3.5" />,
        color: 'text-red-500', 
        bg: 'bg-red-500/5 border-red-500/20',
        amountColor: 'text-red-500'
      };
    }

    // CASE 2: Refund (Green - Money Coming Back)
    if (transaction.creditsRefunded > 0) {
      return {
        label: 'Refunded',
        icon: <RotateCcw className="w-3.5 h-3.5" />,
        color: 'text-green-500',
        bg: 'bg-green-500/5 border-green-500/20',
        amountColor: 'text-green-500'
      };
    }

    // CASE 3: Debit (Orange - Money Leaving)
    return {
      label: 'Debited',
      icon: <ArrowUpRight className="w-3.5 h-3.5" />,
      color: 'text-[#FF6B00]',
      bg: 'bg-[#FF6B00]/5 border-[#FF6B00]/20',
      amountColor: 'text-white' 
    };
  };

  if (loading) {
    return <PageLoading text="Loading credit history..." />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] p-6 lg:p-8 animate-fade-in relative overflow-hidden text-foreground">
      {/* Ambient Background */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#FF6B00]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#FF8533]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-gray-400 mb-4">
                    <CreditCard className="w-3 h-3 text-[#FF6B00]" />
                    <span>Transaction Log</span>
                </div>
                <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
                Credit <span className="text-[#FF6B00]">History</span>
                </h1>
                <p className="text-lg text-gray-400 max-w-2xl leading-relaxed">
                Track all credit transactions, costs per task, and automated refunds.
                </p>
            </div>
         </div>

        {/* Stats Cards - Updated to Dark Theme */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <PremiumStatCard
                title="Total Debited"
                value={stats.totalDebited}
                icon={TrendingUp}
                colorClass="text-[#FF6B00]"
                bgClass="bg-[#FF6B00]/10"
            />
            <PremiumStatCard
                title="Total Refunded"
                value={stats.totalRefunded}
                icon={RotateCw}
                colorClass="text-green-500"
                bgClass="bg-green-500/10"
            />
            <PremiumStatCard
                title="Net Used"
                value={stats.totalUsed}
                icon={Zap}
                colorClass="text-blue-400"
                bgClass="bg-blue-400/10"
            />
            <PremiumStatCard
                title="Successful"
                value={stats.successfulTasks}
                icon={ArrowUpRight}
                colorClass="text-emerald-500"
                bgClass="bg-emerald-500/10"
            />
            <PremiumStatCard
                title="Partial"
                value={stats.partialTasks}
                icon={RotateCw}
                colorClass="text-amber-500"
                bgClass="bg-amber-500/10"
            />
            <PremiumStatCard
                title="Failed"
                value={stats.failedTasks}
                icon={ArrowDownRight}
                colorClass="text-red-500"
                bgClass="bg-red-500/10"
            />
        </div>

        {/* Filters Area */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#1A1A1C]/50 backdrop-blur-md p-4 rounded-xl border border-white/5">
             <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                    placeholder="Search by tool name..."
                    value={pageState.searchQuery}
                    onChange={(e) => updatePageState({ searchQuery: e.target.value })}
                    className="pl-9 bg-[#0A0A0B] border-white/10 text-white focus:ring-[#FF6B00]/20 focus:border-[#FF6B00]/50"
                />
             </div>
             
             <div className="flex gap-2 w-full md:w-auto">
                <Select
                    value={pageState.typeFilter}
                    onValueChange={(value) => updatePageState({ typeFilter: value })}
                >
                    <SelectTrigger className="w-full md:w-[150px] bg-[#0A0A0B] border-white/10 text-gray-300">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1C] border-white/10 text-gray-300">
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="debit">Debited Only</SelectItem>
                        <SelectItem value="refund">With Refunds</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={pageState.toolFilter}
                    onValueChange={(value) => updatePageState({ toolFilter: value })}
                >
                    <SelectTrigger className="w-full md:w-[200px] bg-[#0A0A0B] border-white/10 text-gray-300">
                         <SelectValue placeholder="All Tools" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1C] border-white/10 text-gray-300">
                        <SelectItem value="all">All Tools</SelectItem>
                        {uniqueTools.map(tool => (
                            <SelectItem key={tool.id} value={tool.id}>{tool.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {(pageState.searchQuery || pageState.typeFilter !== 'all' || pageState.toolFilter !== 'all') && (
                     <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updatePageState({ searchQuery: '', typeFilter: 'all', toolFilter: 'all' })}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                     >
                        <RotateCcw className="h-4 w-4" />
                     </Button>
                )}
             </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
             {filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-[#1A1A1C]/30 rounded-2xl border border-dashed border-white/10">
                    <div className="p-4 rounded-full bg-white/5 mb-4">
                        <Search className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-400 font-medium">No transactions found</p>
                </div>
             ) : (
                <div className="grid gap-3">
                     {paginatedTransactions.map((transaction, index) => {
                         const typeConfig = getTypeConfig(transaction);
                         return (
                             <div
                                key={transaction.id || index}
                                onClick={() => setSelectedTransaction(transaction)}
                                className={cn(
                                    "relative overflow-hidden group p-4 rounded-xl border transition-all duration-300 cursor-pointer",
                                    "bg-[#0A0A0B]/60 backdrop-blur-xl border-white/5 hover:border-white/10",
                                    "hover:shadow-[0_0_20px_-5px_rgba(255,107,0,0.1)] hover:-translate-y-0.5"
                                )}
                             >
                                 <div className="flex items-center justify-between gap-4">
                                     <div className="flex-1 min-w-0">
                                         <div className="flex items-center gap-3 mb-1">
                                             <h4 className="text-white font-bold truncate">{transaction.toolName}</h4>
                                             {/* Badges */}
                                             <div className="flex gap-2">
                                                 <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/5 text-gray-400 border border-white/5">
                                                     {transaction.source}
                                                 </div>
                                                 <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border bg-opacity-10", typeConfig.color, typeConfig.bg)}>
                                                     {typeConfig.icon}
                                                     <span>{typeConfig.label}</span>
                                                 </div>
                                             </div>
                                         </div>
                                         
                                         <div className="flex items-center gap-4 text-xs text-gray-500">
                                             <span className="font-mono">{safeFormat(transaction.timestamp, 'MMM dd, HH:mm')}</span>
                                             <span className="uppercase tracking-wider opacity-70 border-l border-white/10 pl-4">{transaction.marketplace}</span>
                                         </div>
                                     </div>

                                     <div className="text-right">
                                         <div className={cn("text-2xl font-bold font-mono tracking-tight", typeConfig.amountColor)}>
                                             {transaction.creditsUsed === 0 ? '0' : `-${transaction.creditsUsed}`}
                                         </div>
                                         <div className="text-[10px] text-gray-600 uppercase font-bold tracking-wider">Credits</div>
                                     </div>
                                 </div>
                             </div>
                         )
                     })}
                </div>
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

        {/* Details Dialog - Dark Theme */}
        <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
            <DialogContent className="max-w-md bg-[#1A1A1C] border-white/10 text-white">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-white">
                    <Zap className="w-5 h-5 text-[#FF6B00]" />
                    Transaction Details
                </DialogTitle>
                <DialogDescription className="text-gray-500">
                    ID: <span className="font-mono text-xs">{selectedTransaction?.id}</span>
                </DialogDescription>
            </DialogHeader>

            {selectedTransaction && (
                <div className="space-y-5 pt-2">
                     <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                        <div>
                             <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Cost</p>
                             <p className="text-2xl font-bold text-white font-mono">-{selectedTransaction.creditsUsed}</p>
                        </div>
                        <Badge variant="outline" className={cn("px-3 py-1 bg-opacity-10 capitalize", 
                            selectedTransaction.status === 'completed' ? "text-green-500 bg-green-500 border-green-500/20" : "text-red-500 bg-red-500 border-red-500/20")}>
                            {selectedTransaction.status}
                        </Badge>
                     </div>

                     <div className="space-y-3">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg bg-[#0A0A0B] border border-white/5">
                                <p className="text-xs text-gray-500 mb-1">Debited Initial</p>
                                <p className="font-mono text-gray-300">{selectedTransaction.creditsDebited}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-[#0A0A0B] border border-white/5">
                                <p className="text-xs text-green-500 mb-1">Refunded</p>
                                <p className="font-mono text-green-400">+{selectedTransaction.creditsRefunded}</p>
                            </div>
                         </div>
                     </div>

                     <div className="space-y-3 border-t border-white/5 pt-4">
                         <div className="flex justify-between text-sm">
                             <span className="text-gray-500">Tool Name</span>
                             <span className="text-gray-300 font-medium">{selectedTransaction.toolName}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                             <span className="text-gray-500">Marketplace</span>
                             <span className="text-gray-300 font-medium uppercase">{selectedTransaction.marketplace}</span>
                         </div>
                         <div className="flex justify-between text-sm">
                             <span className="text-gray-500">Timestamp</span>
                             <span className="text-gray-300 font-medium font-mono">{safeFormat(selectedTransaction.timestamp, 'MMM dd, HH:mm:ss')}</span>
                         </div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between bg-green-500/10 p-2 rounded text-green-400">
                             <span>Processed</span>
                             <span className="font-bold">{selectedTransaction.urlsProcessed}</span>
                        </div>
                        <div className="flex justify-between bg-red-500/10 p-2 rounded text-red-400">
                             <span>Failed</span>
                             <span className="font-bold">{selectedTransaction.urlsFailed}</span>
                        </div>
                     </div>
                </div>
            )}
            </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Internal Component for Stats
function PremiumStatCard({ title, value, icon: Icon, colorClass, bgClass }: any) {
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
                <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform origin-left">
                    {value}
                </div>
            </CardContent>
        </Card>
    );
}