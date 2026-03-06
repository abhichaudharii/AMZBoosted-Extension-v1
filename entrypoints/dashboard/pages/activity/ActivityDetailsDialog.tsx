import React from "react";
import { Wrench, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Task } from "@/lib/db/schema";
import { getFlagByMarketplace, getSourceBadge, getStatusConfig } from "./utils";

interface ActivityDetailsDialogProps {
  selectedTask: Task | null;
  onClose: () => void;
}

export const ActivityDetailsDialog: React.FC<ActivityDetailsDialogProps> = ({
  selectedTask,
  onClose,
}) => {
  return (
    <Dialog open={!!selectedTask} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-muted-foreground" />
            {selectedTask?.toolName}
          </DialogTitle>
          <DialogDescription>Execution details and results</DialogDescription>
        </DialogHeader>

        {selectedTask && (
          <div className="space-y-4">
            {/* Status & Source */}
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusConfig(selectedTask.status).badge}
              {getSourceBadge(selectedTask)}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5" />
                  Tool
                </p>
                <p className="font-medium">
                  {selectedTask.toolId
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </p>
              </div>
              {/* Marketplace */}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Marketplace</p>

                {(() => {
                  const FlagDialogComponent = getFlagByMarketplace(
                    selectedTask.marketplace
                  );
                  return (
                    <p className="font-medium flex items-center gap-2">
                      {FlagDialogComponent ? (
                        <FlagDialogComponent className="w-4 h-4" />
                      ) : null}
                      {selectedTask.marketplace || "N/A"}
                    </p>
                  );
                })()}
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Started At</p>
                <p className="font-medium text-sm">
                  {format(
                    new Date(selectedTask.createdAt),
                    "MMM dd, yyyy HH:mm:ss"
                  )}
                </p>
              </div>
              {selectedTask.completedAt && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Completed At</p>
                  <p className="font-medium text-sm">
                    {format(
                      new Date(selectedTask.completedAt),
                      "MMM dd, yyyy HH:mm:ss"
                    )}
                  </p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Credits Used</p>
                <p className="font-medium text-amber-600 dark:text-amber-500">
                  {selectedTask.creditsUsed}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total URLs</p>
                <p className="font-medium">{selectedTask.urlCount || 0}</p>
              </div>
            </div>

            {/* Status Message (e.g. No data found) */}
            {selectedTask.outputData?.summary?.message && (
              <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-400 font-medium flex items-center gap-2">
                  {selectedTask.outputData.summary.message}
                </p>
              </div>
            )}

            {/* Results */}
            {selectedTask.outputData && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Results</p>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2 border border-border">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Successful:
                    </span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {selectedTask.outputData.successful}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Failed:
                    </span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {selectedTask.outputData.failed}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Task-level Error */}
            {selectedTask.error && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Task Error</p>
                <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-400 font-mono">
                    {selectedTask.error}
                  </p>
                </div>
              </div>
            )}

            {/* Failed URLs Details */}
            {selectedTask.outputData?.errors &&
              selectedTask.outputData.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    Failed URLs ({selectedTask.outputData.errors.length})
                  </p>
                  <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg max-h-60 overflow-y-auto">
                    <div className="divide-y divide-red-200 dark:divide-red-800">
                      {selectedTask.outputData.errors.map(
                        (error: string, index: number) => (
                          <div key={index} className="p-3">
                            <p className="text-xs text-red-700 dark:text-red-400 font-mono break-all">
                              {error}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
