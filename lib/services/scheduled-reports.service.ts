/**
 * Scheduled Reports Service
 * Manages automated email reports
 */

import { secureStorage } from '@/lib/storage/secure-storage';

export interface ScheduledReport {
    id: string;
    name: string;
    description?: string;
    reportType: 'tool-summary' | 'analytics' | 'performance' | 'custom';
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number; // 0-6 for weekly reports
    dayOfMonth?: number; // 1-31 for monthly reports
    time: string; // HH:MM format
    recipients: string[]; // Email addresses
    format: 'pdf' | 'csv' | 'html';
    filters?: Record<string, any>;
    enabled: boolean;
    lastRun?: string;
    nextRun?: string;
    createdAt: string;
    updatedAt: string;
}

class ScheduledReportsService {
    private reports: ScheduledReport[] = [];
    private listeners: Set<(reports: ScheduledReport[]) => void> = new Set();
    private checkInterval: NodeJS.Timeout | null = null;

    /**
     * Initialize scheduled reports
     */
    async initialize(): Promise<void> {
        const result = await secureStorage.get('scheduledReports');
        this.reports = result.scheduledReports || [];

        // Start checking for due reports every minute
        this.startChecking();
    }

    /**
     * Start checking for due reports
     */
    private startChecking(): void {
        this.checkInterval = setInterval(() => {
            this.checkDueReports();
        }, 60000); // Check every minute
    }

    /**
     * Check for due reports and send them
     */
    private async checkDueReports(): Promise<void> {
        const now = new Date();

        for (const report of this.reports) {
            if (!report.enabled) continue;

            const nextRun = report.nextRun ? new Date(report.nextRun) : null;

            if (nextRun && now >= nextRun) {
                await this.sendReport(report.id);
            }
        }
    }

    /**
     * Get all scheduled reports
     */
    getReports(): ScheduledReport[] {
        return this.reports;
    }

    /**
     * Get report by ID
     */
    getReport(id: string): ScheduledReport | undefined {
        return this.reports.find((r) => r.id === id);
    }

    /**
     * Create scheduled report
     */
    async createReport(
        name: string,
        description: string | undefined,
        reportType: ScheduledReport['reportType'],
        frequency: ScheduledReport['frequency'],
        time: string,
        recipients: string[],
        format: ScheduledReport['format'],
        options?: {
            dayOfWeek?: number;
            dayOfMonth?: number;
            filters?: Record<string, any>;
        }
    ): Promise<ScheduledReport> {
        const report: ScheduledReport = {
            id: this.generateId(),
            name,
            description,
            reportType,
            frequency,
            dayOfWeek: options?.dayOfWeek,
            dayOfMonth: options?.dayOfMonth,
            time,
            recipients,
            format,
            filters: options?.filters,
            enabled: true,
            nextRun: this.calculateNextRun(frequency, time, options?.dayOfWeek, options?.dayOfMonth),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        this.reports.push(report);
        await this.saveReports();
        this.notifyListeners();

        return report;
    }

    /**
     * Update scheduled report
     */
    async updateReport(
        id: string,
        updates: Partial<Omit<ScheduledReport, 'id' | 'createdAt'>>
    ): Promise<ScheduledReport | undefined> {
        const index = this.reports.findIndex((r) => r.id === id);
        if (index === -1) return undefined;

        const report = this.reports[index];

        this.reports[index] = {
            ...report,
            ...updates,
            updatedAt: new Date().toISOString(),
            nextRun: this.calculateNextRun(
                updates.frequency || report.frequency,
                updates.time || report.time,
                updates.dayOfWeek || report.dayOfWeek,
                updates.dayOfMonth || report.dayOfMonth
            ),
        };

        await this.saveReports();
        this.notifyListeners();

        return this.reports[index];
    }

    /**
     * Delete scheduled report
     */
    async deleteReport(id: string): Promise<boolean> {
        const index = this.reports.findIndex((r) => r.id === id);
        if (index === -1) return false;

        this.reports.splice(index, 1);
        await this.saveReports();
        this.notifyListeners();

        return true;
    }

    /**
     * Enable/disable report
     */
    async setEnabled(id: string, enabled: boolean): Promise<boolean> {
        const report = this.reports.find((r) => r.id === id);
        if (!report) return false;

        report.enabled = enabled;
        report.updatedAt = new Date().toISOString();

        await this.saveReports();
        this.notifyListeners();

        return true;
    }

    /**
     * Send report now
     */
    async sendReport(id: string): Promise<void> {
        const report = this.reports.find((r) => r.id === id);
        if (!report) throw new Error('Report not found');

        // Generate report data
        const reportData = await this.generateReportData(report);

        // Send to backend
        await this.sendToBackend(report, reportData);

        // Update last run and calculate next run
        report.lastRun = new Date().toISOString();
        report.nextRun = this.calculateNextRun(
            report.frequency,
            report.time,
            report.dayOfWeek,
            report.dayOfMonth
        );

        await this.saveReports();
        this.notifyListeners();
    }

    /**
     * Generate report data
     */
    private async generateReportData(report: ScheduledReport): Promise<any> {
        // This would collect the actual report data
        // For now, return placeholder
        return {
            type: report.reportType,
            generatedAt: new Date().toISOString(),
            data: {
                // Report-specific data would go here
            },
        };
    }

    /**
     * Send report to backend for email delivery
     */
    private async sendToBackend(report: ScheduledReport, data: any): Promise<void> {
        const accessToken = await this.getAccessToken();

        const response = await fetch(
            `${import.meta.env.VITE_API_URL || 'https://amzboosted.com/api'} /reports/send`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken} `,
                },
                body: JSON.stringify({
                    reportId: report.id,
                    recipients: report.recipients,
                    format: report.format,
                    data,
                }),
            }
        );

        if (!response.ok) {
            throw new Error('Failed to send report');
        }
    }

    /**
     * Calculate next run time
     */
    private calculateNextRun(
        frequency: ScheduledReport['frequency'],
        time: string,
        dayOfWeek?: number,
        dayOfMonth?: number
    ): string {
        const [hours, minutes] = time.split(':').map(Number);
        const now = new Date();
        let nextRun = new Date();

        nextRun.setHours(hours, minutes, 0, 0);

        if (frequency === 'daily') {
            // If time has passed today, schedule for tomorrow
            if (nextRun <= now) {
                nextRun.setDate(nextRun.getDate() + 1);
            }
        } else if (frequency === 'weekly') {
            // Schedule for next occurrence of dayOfWeek
            if (dayOfWeek !== undefined) {
                const currentDay = nextRun.getDay();
                let daysUntilNext = dayOfWeek - currentDay;

                if (daysUntilNext <= 0 || (daysUntilNext === 0 && nextRun <= now)) {
                    daysUntilNext += 7;
                }

                nextRun.setDate(nextRun.getDate() + daysUntilNext);
            }
        } else if (frequency === 'monthly') {
            // Schedule for next occurrence of dayOfMonth
            if (dayOfMonth !== undefined) {
                nextRun.setDate(dayOfMonth);

                // If that day has passed this month, schedule for next month
                if (nextRun <= now) {
                    nextRun.setMonth(nextRun.getMonth() + 1);
                }
            }
        }

        return nextRun.toISOString();
    }

    /**
     * Subscribe to report updates
     */
    subscribe(listener: (reports: ScheduledReport[]) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Persist to storage
     */
    private async saveReports(): Promise<void> {
        await secureStorage.set({ scheduledReports: this.reports });

        // Also sync to server if user is logged in
        // ...
    }

    /**
     * Notify listeners
     */
    private notifyListeners(): void {
        this.listeners.forEach((listener) => listener(this.reports));
    }

    /**
     * Get access token
     */
    private async getAccessToken(): Promise<string | null> {
        const result = await secureStorage.get('accessToken');
        return result.accessToken || null;
    }

    /**
     * Generate ID
     */
    private generateId(): string {
        return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)} `;
    }

    /**
     * Clean up
     */
    destroy(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        this.listeners.clear();
    }
}

export const scheduledReportsService = new ScheduledReportsService();
