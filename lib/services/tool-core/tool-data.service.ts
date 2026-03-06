import { downloadService } from '../download.service';

export class ToolDataService {
    /**
     * Calcualte summary stats from results
     */
    calculateSummary(results: any[]) {
        if (!results || results.length === 0) return {};

        // Basic summary
        const summary: any = {
            count: results.length
        };

        // Try to find numeric fields to average/sum
        if (results.length > 0) {
            const first = results[0];
            Object.keys(first).forEach(key => {
                const val = first[key];
                if (typeof val === 'number') {
                    // It's a number, calculate average
                    const sum = results.reduce((acc, curr) => acc + (typeof curr[key] === 'number' ? curr[key] : 0), 0);
                    summary[`avg${key.charAt(0).toUpperCase() + key.slice(1)}`] = sum / results.length;
                }
            });
        }

        return summary;
    }

    /**
     * Generate export content based on format
     */
    generateExport(data: any[], format: 'csv' | 'json' = 'csv'): { content: string, mimeType: string, extension: string } {
        if (format === 'json') {
            return {
                content: downloadService.convertToJSON(data),
                mimeType: 'application/json',
                extension: 'json'
            };
        } else {
            return {
                content: downloadService.convertToCSV(data),
                mimeType: 'text/csv',
                extension: 'csv'
            };
        }
    }

    /**
     * Utility: Delay execution
     */
    delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export const toolDataService = new ToolDataService();
