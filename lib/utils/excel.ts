import * as XLSX from 'xlsx';

/**
 * Generate Excel file from data (Generic)
 */
export const generateExcel = (data: any[], sheetName: string = "Data"): { content: any, mimeType: string, extension: string } => {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Auto-width columns (basic approximation)
    const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(key.length, 15) // Min width 15 chars
    }));
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate binary output
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    return {
        content: wbout,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'xlsx'
    };
};
