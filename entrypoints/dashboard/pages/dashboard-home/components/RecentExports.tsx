import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download } from 'lucide-react';

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
    <div className="bg-[#1A1A1C]/50 backdrop-blur-md rounded-xl border border-white/5 overflow-hidden transition-all hover:border-white/10 group flex flex-col h-full">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div>
           <div className="flex items-center gap-2 text-lg font-bold text-white">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
              Recent Exports
            </div>
            <p className="text-sm text-gray-400 mt-1">Latest file downloads</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/exports')}
          className="text-gray-400 hover:text-white hover:bg-white/5"
        >
          View All
        </Button>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {recentExports.length > 0 ? (
          <div className="divide-y divide-white/5">
            {recentExports.map((exp) => {
              const formatColors: Record<string, string> = {
                csv: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                json: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                xlsx: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
              };

              return (
                <div
                  key={exp.id}
                  className="p-4 hover:bg-white/5 transition-colors group/item"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500 shrink-0" />
                        <p className="text-sm font-bold text-white truncate group-hover/item:text-blue-400 transition-colors">{exp.tool}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] h-5 px-2 border ${formatColors[exp.type] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}
                        >
                          {exp.type.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {format(exp.createdAt, 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity text-gray-400 hover:text-white hover:bg-white/10"
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
          <div className="flex flex-col items-center justify-center h-64 text-center p-6">
            <FileText className="h-12 w-12 text-gray-700 mb-3" />
            <p className="text-sm font-medium text-gray-500">No exports yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-white/10 bg-white/5 hover:bg-white/10 text-white"
              onClick={() => navigate('/tools')}
            >
              Run a Tool
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
