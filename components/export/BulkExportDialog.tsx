import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Download, FileSpreadsheet, FileJson, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface BulkExportDialogProps {
  data: any[];
  columns: { id: string; label: string }[];
  filename?: string;
  trigger?: React.ReactNode;
}

export function BulkExportDialog({ data, columns, filename = 'export', trigger }: BulkExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columns.map(col => col.id)
  );
  const [format, setFormat] = useState<'csv' | 'excel' | 'json'>('csv');

  const toggleColumn = (columnId: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const toggleAll = () => {
    if (selectedColumns.length === columns.length) {
      setSelectedColumns([]);
    } else {
      setSelectedColumns(columns.map(col => col.id));
    }
  };

  const handleExport = async () => {
    try {
        const { allowed, reason } = await import('@/lib/services/credits.service').then(m => m.creditsService.canPerformAction('export'));
        if (!allowed) {
            toast.error(reason || 'Export limit reached');
            return;
        }
    } catch (e) {
        console.error('Failed to check export limits', e);
        // Fail open or closed? Closed is safer to prevent abuse.
        toast.error('Unable to verify export limits');
        return;
    }

    if (selectedColumns.length === 0) {
      toast.error('Please select at least one column');
      return;
    }

    // Filter data to only include selected columns
    const filteredData = data.map(row => {
      const filtered: any = {};
      selectedColumns.forEach(colId => {
        if (row[colId] !== undefined) {
          filtered[colId] = row[colId];
        }
      });
      return filtered;
    });

    // Export based on format
    if (format === 'csv') {
      exportToCSV(filteredData, selectedColumns, filename);
    } else if (format === 'excel') {
      exportToExcel(filteredData, selectedColumns, filename);
    } else if (format === 'json') {
      exportToJSON(filteredData, filename);
    }

    toast.success(`Exported ${data.length} rows as ${format.toUpperCase()}`, {
      description: `${selectedColumns.length} columns included`,
    });

    setOpen(false);
  };

  const exportToCSV = (data: any[], columns: string[], filename: string) => {
    const csvContent = [
      columns.join(','),
      ...data.map(row => columns.map(col => JSON.stringify(row[col] || '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToExcel = (data: any[], columns: string[], filename: string) => {
    // Simplified Excel export (would use a library like xlsx in production)
    exportToCSV(data, columns, filename + '_excel');
    toast.info('Excel export coming soon - exported as CSV instead');
  };

  const exportToJSON = (data: any[], filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Selected
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Selected Rows</DialogTitle>
          <DialogDescription>
            Choose columns and format for your export ({data.length} rows)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={format === 'csv' ? 'default' : 'outline'}
                className="justify-start"
                onClick={() => setFormat('csv')}
              >
                <FileText className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant={format === 'excel' ? 'default' : 'outline'}
                className="justify-start"
                onClick={() => setFormat('excel')}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button
                variant={format === 'json' ? 'default' : 'outline'}
                className="justify-start"
                onClick={() => setFormat('json')}
              >
                <FileJson className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>

          <Separator />

          {/* Column Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Columns ({selectedColumns.length}/{columns.length})</Label>
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {selectedColumns.length === columns.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 p-4 border rounded-lg">
              {columns.map(column => (
                <div key={column.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={column.id}
                    checked={selectedColumns.includes(column.id)}
                    onCheckedChange={() => toggleColumn(column.id)}
                  />
                  <label
                    htmlFor={column.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {column.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={selectedColumns.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export {format.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
