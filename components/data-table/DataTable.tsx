import React from 'react';
import { createPortal } from 'react-dom';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal, 
  Search, 
  Columns,
  X 
} from 'lucide-react';

type TableDensity = 'compact' | 'comfortable' | 'spacious';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];

  searchPlaceholder?: string;
  showColumnVisibility?: boolean;
  showPagination?: boolean;
  showDensityToggle?: boolean;
  showGlobalFilter?: boolean;
  pageSize?: number;
  onSelectionChange?: (selectedRows: TData[]) => void;
  bulkActions?: (selectedRows: TData[], clearSelection: () => void) => React.ReactNode;
  getRowId?: (row: TData) => string;
  getRowClassName?: (row: TData) => string;

  // Controlled column visibility
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;

  // New Props
  floatingBar?: boolean;
  selectOnRowClick?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,

  searchPlaceholder = 'Search...',
  showColumnVisibility = true,
  showPagination = true,
  showDensityToggle = false,
  showGlobalFilter = false,
  pageSize = 10,
  onSelectionChange,
  bulkActions,
  getRowId,
  getRowClassName,

  columnVisibility: controlledColumnVisibility,
  onColumnVisibilityChange,
  
  floatingBar = false,
  selectOnRowClick = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [internalColumnVisibility, setInternalColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [density, setDensity] = React.useState<TableDensity>('comfortable');
  const [globalFilter, setGlobalFilter] = React.useState('');

  // Use controlled state if provided, otherwise internal state
  const columnVisibility = controlledColumnVisibility ?? internalColumnVisibility;
  const setColumnVisibility = onColumnVisibilityChange 
    ? (updaterOrValue: VisibilityState | ((old: VisibilityState) => VisibilityState)) => {
        if (typeof updaterOrValue === 'function') {
          onColumnVisibilityChange(updaterOrValue(columnVisibility));
        } else {
          onColumnVisibilityChange(updaterOrValue);
        }
      }
    : setInternalColumnVisibility;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  // Notify parent of selection changes
  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
      onSelectionChange(selectedRows);
    }
  }, [rowSelection, onSelectionChange, table]);

  const selectedRowsData = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
  const hasSelection = selectedRowsData.length > 0;

  // Density styling configuration
  const densityClasses = {
    compact: 'text-xs [&_td]:py-1.5 [&_th]:py-2',
    comfortable: 'text-sm [&_td]:py-3 [&_th]:py-3',
    spacious: 'text-base [&_td]:py-5 [&_th]:py-5',
  };

  return (
    <div className="w-full">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        {showGlobalFilter && (
          <div className="relative w-full max-w-xs group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 h-9 text-sm bg-muted/20 border-border/50 focus-visible:ring-primary/20 transition-all focus-visible:border-primary/50 rounded-lg"
            />
          </div>
        )}

        {/* View Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {showDensityToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 px-3 bg-muted/20 border-border/50 text-muted-foreground hover:text-foreground">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel className="text-xs">Row Density</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={density === 'compact'} onCheckedChange={() => setDensity('compact')}>
                  Compact
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={density === 'comfortable'} onCheckedChange={() => setDensity('comfortable')}>
                  Comfortable
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={density === 'spacious'} onCheckedChange={() => setDensity('spacious')}>
                  Spacious
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {showColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 bg-muted/20 border-border/50 text-muted-foreground hover:text-foreground">
                  <Columns className="h-4 w-4" />
                  <span className="hidden sm:inline">View</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 max-h-64 overflow-auto">
                <DropdownMenuLabel className="text-xs">Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize text-xs"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* 2. Bulk Actions Banner OR Floating Bar */}
      {hasSelection && bulkActions && (
        floatingBar ? (
          typeof document !== 'undefined' ? (
              // Use Portal to escape any parent stacking contexts (overflow, backdrop-filter, etc.)
              // This is critical for SchedulesPage where the table is inside a backdrop-blur container
              createPortal(
                  <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] max-w-2xl bg-[#0A0A0B] border border-[#FF6B00]/30 shadow-2xl shadow-orange-900/20 rounded-2xl p-4 flex items-center justify-between z-[9999] animate-in slide-in-from-bottom-5">
                      <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#FF6B00]/20 text-[#FF6B00] font-bold text-sm">
                              {selectedRowsData.length}
                          </div>
                          <span className="text-white font-medium">Selected</span>
                      </div>

                      <div className="flex items-center gap-2">
                          <Button
                              variant="ghost" 
                              size="sm"
                              onClick={() => table.resetRowSelection()}
                              className="text-gray-400 hover:text-white h-7 text-xs"
                          >
                              Cancel
                          </Button>
                          <div className="h-6 w-px bg-white/10 mx-2" />
                          {bulkActions(selectedRowsData, () => table.resetRowSelection())}
                      </div>
                  </div>,
                  document.body
              )
          ) : null
        ) : (
          <div className="flex items-center justify-between p-2 pl-3 rounded-lg bg-primary/10 border border-primary/20 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {selectedRowsData.length}
              </span>
              <span className="text-xs font-medium text-primary">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              {bulkActions(selectedRowsData, () => table.resetRowSelection())}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => table.resetRowSelection()}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      )}

      {/* 3. The Table */}
      <div className="rounded-xl border border-border/40 overflow-hidden bg-card/40 backdrop-blur-sm shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <Table className={`${densityClasses[density]} relative`}>
            <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-md">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-border/40">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    id={getRowId ? getRowId(row.original) : undefined}
                    data-state={row.getIsSelected() && 'selected'}
                    onClick={() => {
                        if (selectOnRowClick && row.getCanSelect()) {
                            row.toggleSelected(!row.getIsSelected());
                        }
                    }}
                    className={`border-border/40 transition-colors hover:bg-muted/40 data-[state=selected]:bg-primary/5 data-[state=selected]:hover:bg-primary/10 ${selectOnRowClick ? 'cursor-pointer' : ''} ${getRowClassName ? getRowClassName(row.original) : ''}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-1">
                      <p className="text-sm">No results found</p>
                      <p className="text-xs opacity-50">Try adjusting your search filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 4. Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
             <span className="hidden sm:inline">Showing</span>
             <span className="font-medium text-foreground">{table.getFilteredRowModel().rows.length}</span>
             <span>results</span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">Rows per page</span>
              <Select
                value={String(table.getState().pagination.pageSize)}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="h-7 w-[60px] text-xs bg-transparent border-border/40">
                  <SelectValue placeholder={String(table.getState().pagination.pageSize)} />
                </SelectTrigger>
                <SelectContent side="top" align="end">
                  {[10, 25, 50, 100].map((pageSizeOption) => (
                    <SelectItem key={pageSizeOption} value={String(pageSizeOption)} className="text-xs">
                      {pageSizeOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 border-border/40 bg-transparent"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs font-medium min-w-[2.5rem] text-center">
                 {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 border-border/40 bg-transparent"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}