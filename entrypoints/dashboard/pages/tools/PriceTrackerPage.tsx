import React, { useState, useMemo } from 'react';
import { PageLoading } from '@/components/ui/page-loading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trash2, ExternalLink, RefreshCw, Plus, TrendingDown, TrendingUp,
  Minus, Bell, BellOff, BarChart2, X, ArrowLeft, AlertCircle,
  Clock, Globe, Activity, ChevronRight, Package
} from 'lucide-react';
import { usePriceTrackers } from '@/lib/hooks/usePriceTrackers';
import { usePriceHistory } from '@/lib/hooks/usePriceHistory';
import { priceTrackerService } from '@/lib/services/tools/price-tracker.service';
import { PriceTracker } from '@/lib/db/schema';
import { formatDistanceToNow, format } from 'date-fns';
import { CreateScheduleDialog } from '../../components/CreateScheduleDialog';
import { useSchedulesLogic } from '../schedules/useSchedulesLogic';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';

// ─── Marketplace domain map ────────────────────────────────────────────────
const MKP_DOMAIN: Record<string, string> = {
  us: 'com', uk: 'co.uk', de: 'de', fr: 'fr', it: 'it',
  es: 'es', ca: 'ca', au: 'com.au', jp: 'co.jp', mx: 'com.mx',
};
const amazonUrl = (asin: string, marketplace: string) => {
  const domain = MKP_DOMAIN[marketplace?.toLowerCase()] ?? marketplace ?? 'com';
  return `https://www.amazon.${domain}/dp/${asin}`;
};

// ─── Price helpers ─────────────────────────────────────────────────────────
const fmt = (n: number | undefined | null, currency = 'USD') => {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n);
};

const pctChange = (current: number, previous: number) => {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
};

// ─── Stat card ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent?: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-4 border border-white/5 bg-[#0A0A0B]/40 flex items-start gap-3">
      <div className={`p-2 rounded-xl ${accent ?? 'bg-primary/10'}`}>
        <Icon className={`w-4 h-4 ${accent ? 'text-white' : 'text-primary'}`} />
      </div>
      <div>
        <div className="text-lg font-bold leading-tight">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
        {sub && <div className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Custom chart tooltip ─────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-[#111113] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-lg">
      <div className="text-muted-foreground mb-1">{label}</div>
      <div className="font-bold text-white">{fmt(d.value, d.payload.currency)}</div>
      {d.payload.inStock != null && (
        <div className={d.payload.inStock ? 'text-emerald-400' : 'text-red-400'}>
          {d.payload.inStock ? 'In Stock' : 'Out of Stock'}
        </div>
      )}
    </div>
  );
}

// ─── Price History Detail Panel ────────────────────────────────────────────
function PriceHistoryPanel({
  tracker, onClose
}: { tracker: PriceTracker; onClose: () => void }) {
  const { history, loading } = usePriceHistory(tracker.id);
  const [range, setRange] = useState<30 | 60 | 90>(30);

  const filteredHistory = useMemo(() => {
    const cutoff = Date.now() - range * 24 * 60 * 60 * 1000;
    return history.filter(h => new Date(h.timestamp).getTime() >= cutoff);
  }, [history, range]);

  const chartData = useMemo(() =>
    filteredHistory.map(h => ({
      date: format(new Date(h.timestamp), 'MMM d HH:mm'),
      price: h.price,
      currency: h.currency ?? 'USD',
      inStock: (h as any).inStock,
    })), [filteredHistory]);

  const prices = filteredHistory.map(h => h.price).filter(Boolean);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const maxPrice = prices.length ? Math.max(...prices) : null;
  const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
  const currentPrice = tracker.currentPrice ?? prices[prices.length - 1] ?? null;
  const firstPrice = prices[0] ?? null;
  const change = currentPrice && firstPrice ? pctChange(currentPrice, firstPrice) : null;
  const currency = tracker.currency ?? filteredHistory[0]?.currency ?? 'USD';

  const domain = MKP_DOMAIN[tracker.marketplace?.toLowerCase()] ?? 'com';

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-start gap-3 p-5 border-b border-white/5">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-colors shrink-0 mt-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        {tracker.image
          ? <img src={tracker.image} alt="" className="w-12 h-12 object-contain rounded-xl bg-white/5 p-1 border border-white/10 shrink-0" />
          : <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0"><Package className="w-5 h-5 text-muted-foreground" /></div>
        }
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-sm leading-snug line-clamp-2">{tracker.title || tracker.asin}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">{tracker.asin}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{tracker.marketplace?.toUpperCase()}</Badge>
            <a
              href={amazonUrl(tracker.asin, tracker.marketplace)}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
            >
              View <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 p-4">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Current</div>
            <div className="text-lg font-bold">{fmt(currentPrice, currency)}</div>
            {change != null && (
              <div className={`text-xs font-semibold mt-0.5 flex items-center justify-center gap-1 ${change < 0 ? 'text-emerald-400' : change > 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                {change < 0 ? <TrendingDown className="w-3 h-3" /> : change > 0 ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                {change < 0 ? '' : change > 0 ? '+' : ''}{change.toFixed(1)}%
              </div>
            )}
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Average</div>
            <div className="text-lg font-bold">{fmt(avgPrice, currency)}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{range}d avg</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
            <div className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">Lowest</div>
            <div className="text-base font-bold text-emerald-400">{fmt(minPrice, currency)}</div>
          </div>
          <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-center">
            <div className="text-[10px] text-red-400 uppercase tracking-wider mb-1">Highest</div>
            <div className="text-base font-bold text-red-400">{fmt(maxPrice, currency)}</div>
          </div>
        </div>

        {/* Alert rules */}
        {tracker.alertRules && (tracker.alertRules.targetPrice || tracker.alertRules.notifyOnStock) && (
          <div className="mx-4 mb-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2">
            <Bell className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-300 space-y-0.5">
              {tracker.alertRules.targetPrice && (
                <div>Alert when price drops to <strong>{fmt(tracker.alertRules.targetPrice, currency)}</strong></div>
              )}
              {tracker.alertRules.notifyOnStock && (
                <div>Alert when back in stock</div>
              )}
            </div>
          </div>
        )}

        {/* Range toggle */}
        <div className="flex items-center gap-1 px-4 mb-3">
          {([30, 60, 90] as const).map(d => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${range === d ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}
            >
              {d}d
            </button>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground">{filteredHistory.length} checks</span>
        </div>

        {/* Chart */}
        <div className="px-4 mb-4">
          {loading ? (
            <div className="h-36 flex items-center justify-center text-muted-foreground text-xs">Loading...</div>
          ) : chartData.length === 0 ? (
            <div className="h-36 flex items-center justify-center text-muted-foreground text-xs">No price history yet — run a check to start tracking</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: '#71717a' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 9, fill: '#71717a' }}
                  tickLine={false}
                  axisLine={false}
                  width={42}
                  tickFormatter={v => `$${v}`}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<ChartTooltip />} />
                {tracker.alertRules?.targetPrice && (
                  <ReferenceLine
                    y={tracker.alertRules.targetPrice}
                    stroke="#f59e0b"
                    strokeDasharray="4 3"
                    label={{ value: 'Target', fill: '#f59e0b', fontSize: 9 }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#FF6B00"
                  strokeWidth={2}
                  fill="url(#priceGrad)"
                  dot={chartData.length < 15 ? { r: 3, fill: '#FF6B00', strokeWidth: 0 } : false}
                  activeDot={{ r: 5, fill: '#FF6B00', strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* History table */}
        <div className="px-4 pb-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Price History</div>
          {filteredHistory.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">No history for this period</div>
          ) : (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {[...filteredHistory].reverse().map((h, i) => {
                const prev = filteredHistory[filteredHistory.length - 2 - i];
                const chg = prev ? pctChange(h.price, prev.price) : null;
                return (
                  <div key={h.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{fmt(h.price, h.currency)}</div>
                      <div className="text-[10px] text-muted-foreground">{format(new Date(h.timestamp), 'MMM d, yyyy h:mm a')}</div>
                    </div>
                    {chg != null && (
                      <div className={`flex items-center gap-0.5 font-semibold shrink-0 ${chg < 0 ? 'text-emerald-400' : chg > 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                        {chg < 0 ? <TrendingDown className="w-3 h-3" /> : chg > 0 ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        {Math.abs(chg).toFixed(1)}%
                      </div>
                    )}
                    {(h as any).inStock != null && (
                      <div className={`w-2 h-2 rounded-full shrink-0 ${(h as any).inStock ? 'bg-emerald-400' : 'bg-red-400'}`} title={(h as any).inStock ? 'In Stock' : 'Out of Stock'} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tracker row card ─────────────────────────────────────────────────────
function TrackerCard({ tracker, selected, onSelect, onDelete }: {
  tracker: PriceTracker;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const priceChange = tracker.currentPrice && (tracker as any).previousPrice
    ? pctChange(tracker.currentPrice, (tracker as any).previousPrice)
    : null;
  const currency = tracker.currency ?? 'USD';

  return (
    <div
      onClick={onSelect}
      className={`group flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
        selected
          ? 'bg-primary/10 border-primary/30 shadow-sm shadow-primary/10'
          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
      }`}
    >
      {tracker.image
        ? <img src={tracker.image} alt="" className="w-10 h-10 object-contain rounded-lg bg-white/5 p-0.5 border border-white/10 shrink-0" />
        : <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0"><Package className="w-4 h-4 text-muted-foreground" /></div>
      }

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-sm leading-tight line-clamp-1 truncate">{tracker.title || tracker.asin}</span>
          {tracker.currentPrice != null && (
            <span className="text-sm font-bold text-primary shrink-0">{fmt(tracker.currentPrice, currency)}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="text-[10px] font-mono text-muted-foreground">{tracker.asin}</span>
          <Badge variant="outline" className="text-[9px] px-1 py-0">{tracker.marketplace?.toUpperCase()}</Badge>
          <span className={`text-[10px] capitalize ${tracker.status === 'active' ? 'text-emerald-400' : tracker.status === 'error' ? 'text-red-400' : 'text-amber-400'}`}>
            {tracker.frequency}
          </span>
          {priceChange != null && (
            <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${priceChange < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {priceChange < 0 ? <TrendingDown className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
              {Math.abs(priceChange).toFixed(1)}%
            </span>
          )}
        </div>
        {tracker.lastRunAt && (
          <div className="text-[10px] text-muted-foreground/60 mt-0.5">
            Last check {formatDistanceToNow(new Date(tracker.lastRunAt), { addSuffix: true })}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => { e.stopPropagation(); window.open(amazonUrl(tracker.asin, tracker.marketplace), '_blank'); }}
          className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
          title="View on Amazon"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
          title="Delete tracker"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-colors ${selected ? 'text-primary' : ''}`} />
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
export const PriceTrackerPage: React.FC = () => {
  const { trackers, loading, refresh } = usePriceTrackers();
  const [selectedTracker, setSelectedTracker] = useState<PriceTracker | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { handleScheduleCreation } = useSchedulesLogic();

  const handleDelete = async (id: string) => {
    if (confirm('Delete this tracker? All price history will be lost.')) {
      await priceTrackerService.deleteTracker(id);
      if (selectedTracker?.id === id) setSelectedTracker(null);
      refresh();
    }
  };

  const handleRunNow = async () => {
    try {
      const win = await chrome.windows.getCurrent();
      if (win.id) await chrome.runtime.sendMessage({ type: 'OPEN_SIDEPANEL', windowId: win.id, toolId: 'price-tracker' });
    } catch {}
  };

  const filteredTrackers = useMemo(() => {
    if (!search.trim()) return trackers;
    const q = search.toLowerCase();
    return trackers.filter(t =>
      t.asin.toLowerCase().includes(q) || (t.title ?? '').toLowerCase().includes(q)
    );
  }, [trackers, search]);

  // Stats
  const totalTrackers = trackers.length;
  const activeAlerts = trackers.filter(t => t.alertRules?.targetPrice || t.alertRules?.notifyOnStock).length;
  const dropsDetected = trackers.filter(t => {
    if (!t.currentPrice || !(t as any).previousPrice) return false;
    return t.currentPrice < (t as any).previousPrice;
  }).length;
  const neverChecked = trackers.filter(t => !t.lastRunAt).length;

  if (loading) return <PageLoading text="Loading Price Tracker..." />;

  return (
    <div className="flex flex-col h-full min-h-0 max-w-7xl mx-auto space-y-4 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3 px-1">
        <div>
          <h1 className="text-xl font-bold">Price Tracker</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Monitor ASIN prices and receive alerts when targets are hit</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleRunNow} variant="outline" className="gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Quick Check
          </Button>
          <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-1.5 bg-primary hover:bg-primary/90">
            <Plus className="h-3.5 w-3.5" />
            Add Tracker
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Tracked ASINs" value={totalTrackers} icon={BarChart2} />
        <StatCard label="Active Alerts" value={activeAlerts} icon={Bell} accent="bg-amber-500/20" />
        <StatCard label="Price Drops" value={dropsDetected} sub="since last check" icon={TrendingDown} accent="bg-emerald-500/20" />
        <StatCard label="Never Checked" value={neverChecked} icon={Clock} accent={neverChecked > 0 ? 'bg-red-500/20' : 'bg-white/5'} />
      </div>

      {/* Main content: list + detail */}
      {totalTrackers === 0 ? (
        // Empty state
        <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4 text-center">
          <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10">
            <BarChart2 className="w-10 h-10 text-primary/60 mx-auto" />
          </div>
          <div>
            <div className="font-bold text-lg">No trackers yet</div>
            <div className="text-sm text-muted-foreground mt-1">Add an ASIN to start monitoring its price</div>
          </div>
          <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-2 bg-primary">
            <Plus className="w-4 h-4" />
            Add Your First Tracker
          </Button>
        </div>
      ) : (
        <div className={`flex gap-4 min-h-0 ${selectedTracker ? 'flex-row' : 'flex-col'}`}>
          {/* Trackers list */}
          <div className={`flex flex-col gap-3 min-w-0 ${selectedTracker ? 'w-[340px] shrink-0' : 'w-full'}`}>
            {/* Search */}
            <input
              type="text"
              placeholder="Search by ASIN or product name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white/[0.03] border border-white/10 rounded-xl outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground"
            />
            <div className={`space-y-2 ${selectedTracker ? 'max-h-[calc(100vh-320px)] overflow-y-auto pr-1' : ''}`}>
              {filteredTrackers.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">No trackers match "{search}"</div>
              ) : filteredTrackers.map(t => (
                <TrackerCard
                  key={t.id}
                  tracker={t}
                  selected={selectedTracker?.id === t.id}
                  onSelect={() => setSelectedTracker(prev => prev?.id === t.id ? null : t)}
                  onDelete={() => handleDelete(t.id)}
                />
              ))}
            </div>
          </div>

          {/* Detail panel */}
          {selectedTracker && (
            <div className="flex-1 min-w-0 glass-card rounded-2xl border border-white/5 bg-[#0A0A0B]/40 overflow-hidden flex flex-col">
              <PriceHistoryPanel
                tracker={selectedTracker}
                onClose={() => setSelectedTracker(null)}
              />
            </div>
          )}
        </div>
      )}

      <CreateScheduleDialog
        open={isCreateOpen}
        setOpen={setIsCreateOpen}
        onScheduleCreated={refresh}
        onCreateSchedule={handleScheduleCreation}
        preselectedTool="price-tracker"
      />
    </div>
  );
};

export default PriceTrackerPage;
