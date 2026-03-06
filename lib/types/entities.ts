/**
 * Entity Types
 * Type definitions for application entities
 */

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: 'starter' | 'professional' | 'business' | 'enterprise';
  trialEndsAt: Date | null;
  createdAt: Date;
}

export interface ToolUsage {
  date: string;
  runs: number;
  success: number;
  failed: number;
}

export interface MarketplaceData {
  marketplace: string;
  count: number;
}

export interface ProcessedURL {
  id: string;
  url: string;
  tool: string;
  marketplace: string;
  status: 'completed' | 'failed' | 'processing';
  processedAt: Date;
  duration: number;
}

export interface Report {
  id: string;
  name: string;
  tool: string;
  createdAt: Date;
  marketplace: string;
  urlCount: number;
  status: 'ready' | 'generating' | 'failed';
  format: 'csv' | 'json';
  size: string;
}

export interface Export {
  id: string;
  name: string;
  tool: string;
  type: 'csv' | 'json' | 'xlsx';
  createdAt: Date;
  marketplace: string;
  urlCount: number;
  size: string;
}

export interface Schedule {
  id: string;
  name: string;
  tool: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  nextRun: Date;
  status: 'active' | 'paused';
  marketplace: string;
  urlCount: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category: 'report' | 'export' | 'schedule' | 'integration' | 'system';
}

export interface DashboardStats {
  totalRuns: number;
  reviewsToday: number;
  scheduledTasks: number;
  completedExtractions: number;
  apiCredits: number;
  successRate: number;
}

export interface Integration {
  id: string;
  name: string;
  connected: boolean;
  lastSync?: Date;
}
