import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecentExportsProps {
  exports: any[];
}

export const RecentExports: React.FC<RecentExportsProps> = ({ exports }) => {
  const navigate = useNavigate();

  const handleDownloadExport = async (exportItem: any) => {
    try {
      if (exportItem.downloadUrl) {
        window.open(exportItem.downloadUrl, '_blank');
      } else {
        navigate(`/exports/${exportItem.id}`);
      }
    } catch (error) {
      console.error('[DashboardHome] Failed to download export:', error);
    }
  };

  const recentExports = exports.slice(0, 5).map((exp) => ({
    id: exp.id,
    tool: exp.toolName || 'Unknown',
    type: exp.format,
    size: 'N/A',
    downloadUrl: exp.downloadPath,
    createdAt: new Date(exp.createdAt),
  }));

  return (
    <div className="bg-[#0A0A0B]/60 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden transition-all hover:border-white/10 group flex flex-col relative">
       {/* Ambient Glow */}
       <div className="absolute -bottom-12 -left-12 h-24 w-24 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_-5px_rgba(255,107,0,0.3)]">
            <FileText className="h-4 w-4" />
          </div>
          <h3 className="text-lg font-black text-white tracking-tight">Recent Exports</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/exports')}
          className="text-xs h-8 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl font-bold px-4"
        >
          View All
        </Button>
      </div>
      
      <div className="flex-1 overflow-hidden relative z-10">
        {recentExports.length > 0 ? (
          <div className="divide-y divide-white/5">
            {recentExports.map((exp) => {
              const formatColors: Record<string, string> = {
                csv: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
                json: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
                xlsx: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
              };

              return (
                <div
                  key={exp.id}
                  className="px-6 py-4 hover:bg-white/[0.03] transition-all group/item relative overflow-hidden"
                >
                  {/* Hover Highlight Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-l from-primary/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />

                  <div className="flex items-center justify-between gap-4 relative z-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover/item:border-primary/30 transition-all duration-300">
                           <FileText className="h-5 w-5 text-slate-500 group-hover/item:text-primary transition-colors" />
                        </div>
                        <p className="text-[14px] font-bold text-white truncate group-hover/item:text-primary transition-colors duration-300 tracking-tight">
                            {exp.tool}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mt-2 pl-[48px]">
                        <Badge
                          variant="outline"
                          className={cn(
                              "text-[9px] h-5 px-2 border font-black tracking-widest rounded-lg transition-all",
                              formatColors[exp.type] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                          )}
                        >
                          {exp.type.toUpperCase()}
                        </Badge>
                        <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 uppercase tracking-tighter">
                          {format(exp.createdAt, 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-2xl opacity-0 group-hover/item:opacity-100 transition-all duration-300 text-slate-400 hover:text-primary hover:bg-primary/20 bg-white/5 border border-transparent hover:border-primary/30"
                      onClick={() => handleDownloadExport(exp)}
                      title="Download export"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-72 text-center p-8 relative z-10">
            <div className="h-16 w-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
               <FileText className="h-8 w-8 text-slate-700" />
            </div>
            <p className="text-base font-bold text-slate-400">No data exports available</p>
            <p className="text-xs text-slate-500 mt-2 max-w-[200px]">Generated reports will appear here for quick access.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-6 border-white/10 bg-white/5 hover:bg-primary/20 hover:text-primary hover:border-primary/40 text-white rounded-xl px-6 h-9 transition-all"
              onClick={() => navigate('/tools')}
            >
              Start Scan
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
