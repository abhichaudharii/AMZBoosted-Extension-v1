/**
 * Logging Service
 * Handles structured logging for tasks and debugging
 */

export class TaskLogger {
    private prefix: string;

    constructor(taskId: string) {
        this.prefix = `[Task ${taskId.substring(0, 8)}]`;
    }

    info(message: string, data?: any) {
        if (data) {
            console.log(`${this.prefix} ℹ️ ${message}`, data);
        } else {
            console.log(`${this.prefix} ℹ️ ${message}`);
        }
    }

    warn(message: string, data?: any) {
        if (data) {
            console.warn(`${this.prefix} ⚠️ ${message}`, data);
        } else {
            console.warn(`${this.prefix} ⚠️ ${message}`);
        }
    }

    error(message: string, data?: any) {
        if (data) {
            console.error(`${this.prefix} ❌ ${message}`, data);
        } else {
            console.error(`${this.prefix} ❌ ${message}`);
        }
    }
}
