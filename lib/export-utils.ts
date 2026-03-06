import { format } from 'date-fns';

/**
 * Export data to CSV format
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Determine columns
  const cols = columns || Object.keys(data[0]).map((key) => ({ key, label: key }));

  // Create CSV headers
  const headers = cols.map((col) => escapeCSV(col.label)).join(',');

  // Create CSV rows
  const rows = data.map((row) =>
    cols.map((col) => escapeCSV(formatValue(row[col.key]))).join(',')
  );

  // Combine headers and rows
  const csv = [headers, ...rows].join('\n');

  // Download file
  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export data to Excel-compatible CSV format
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  // Excel CSV format with BOM for proper encoding
  const cols = columns || Object.keys(data[0]).map((key) => ({ key, label: key }));
  const headers = cols.map((col) => escapeCSV(col.label)).join(',');
  const rows = data.map((row) =>
    cols.map((col) => escapeCSV(formatValue(row[col.key]))).join(',')
  );

  const csv = '\uFEFF' + [headers, ...rows].join('\n'); // BOM for Excel UTF-8

  downloadFile(csv, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export data to JSON format
 */
export function exportToJSON<T>(data: T[], filename: string, prettify = true): void {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  const json = prettify ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  downloadFile(json, filename, 'application/json;charset=utf-8;');
}

/**
 * Export table to printable HTML
 */
export function printTable<T extends Record<string, any>>(
  data: T[],
  title: string,
  columns?: { key: keyof T; label: string }[]
): void {
  if (data.length === 0) {
    throw new Error('No data to print');
  }

  const cols = columns || Object.keys(data[0]).map((key) => ({ key, label: key }));

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            padding: 20px;
            color: #333;
          }
          h1 {
            color: #FF6B00;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background: #f5f5f5;
            padding: 12px;
            text-align: left;
            border-bottom: 2px solid #ddd;
            font-weight: 600;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #eee;
          }
          tr:hover {
            background: #f9f9f9;
          }
          .meta {
            color: #666;
            font-size: 14px;
            margin-bottom: 10px;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">
          Generated on ${format(new Date(), 'PPpp')} | ${data.length} records
        </div>
        <table>
          <thead>
            <tr>
              ${cols.map((col) => `<th>${col.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (row) => `
              <tr>
                ${cols.map((col) => `<td>${formatValue(row[col.key])}</td>`).join('')}
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        <script>
          window.onload = () => {
            window.print();
            window.onafterprint = () => window.close();
          };
        </script>
      </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

/**
 * Copy table data to clipboard
 */
export async function copyToClipboard<T extends Record<string, any>>(
  data: T[],
  columns?: { key: keyof T; label: string }[]
): Promise<void> {
  if (data.length === 0) {
    throw new Error('No data to copy');
  }

  const cols = columns || Object.keys(data[0]).map((key) => ({ key, label: key }));

  // Create tab-separated format (works well with Excel)
  const headers = cols.map((col) => col.label).join('\t');
  const rows = data.map((row) => cols.map((col) => formatValue(row[col.key])).join('\t'));

  const text = [headers, ...rows].join('\n');

  await navigator.clipboard.writeText(text);
}

/**
 * Helper: Escape CSV values
 */
function escapeCSV(value: string): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Helper: Format value for export
 */
function formatValue(value: any): string {
  if (value == null) return '';
  if (value instanceof Date) return format(value, 'yyyy-MM-dd HH:mm:ss');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Helper: Download file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get export columns from table column definitions
 */
export function getExportColumns<T>(
  columns: any[],
  excludeColumns: string[] = ['select', 'actions']
): { key: keyof T; label: string }[] {
  return columns
    .filter((col) => col.accessorKey && !excludeColumns.includes(col.id))
    .map((col) => ({
      key: col.accessorKey,
      label: typeof col.header === 'string' ? col.header : col.accessorKey,
    }));
}
