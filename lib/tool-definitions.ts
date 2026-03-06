import { lazy } from 'react';

// Services
import { sqpUniversalService } from '@/lib/services/tools/sqp-universal.service';
import { topTermsService } from '@/lib/services/tools/top-terms.service';
import { categoryInsightsService } from '@/lib/services/tools/category-insights.service';
import { asinExplorerService } from '@/lib/services/tools/asin-x.service';
import { productNicheMetricsService } from '@/lib/services/tools/product-niche-metrics.service';
import { nicheXService } from '@/lib/services/tools/niche-x.service';
import { nicheQueryPulseService } from '@/lib/services/tools/niche-query-pulse.service';
import { salesTrafficDrilldownService } from '@/lib/services/tools/sales-traffic-drilldown.service';
import { priceTrackerService } from '@/lib/services/tools/price-tracker.service';
import { rufusQAService } from '@/lib/services/tools/rufus-qa.service';

export interface ToolDefinition {
    id: string;
    name: string;
    description?: string;
    iconName?: string; // Lucide icon name
    category?: string;

    // Execution
    execute?: (options: any, onProgress: any) => Promise<any>;
    filenamePrefix?: string;
    progressMapper?: (progress: any) => any;

    // Legacy Service Logic (deprecated in favor of execute)
    service?: any;
    backgroundToolId?: string; // If it maps to a different tool ID in background service (like 'sqr-simple' -> 'sqr-simple')

    // UI
    component: React.LazyExoticComponent<React.ComponentType<any>> | React.ComponentType<any>;

    // Routing
    routePath?: string; // Defaults to /tools/:id

    // Capability Flags
    isBackground?: boolean;

    /**
     * Configuration for Input Validation & UI
     */
    validation?: {
        type: 'asinList' | 'urlList' | 'keywordList' | 'mixed' | 'none';
        requireInput?: boolean; // Defaults to true
        message?: string; // Custom error message
    };

    /**
     * Configuration for Export Settings
     */
    exportParams?: {
        supportsExportSettings?: boolean; // Shows "Export Settings" menu item
        stateBinding?: 'asin' | 'category' | 'salesTraffic' | 'sqp'; // Which state variable to map to
    };
    /**
     * Configuration for Scheduler Inputs (Optional)
     */
    inputConfig?: {
        inputs: {
            key: string;
            label: string;
            type: 'text' | 'textarea' | 'number';
            placeholder?: string;
            required?: boolean;
            description?: string;
        }[];
    };
}

// Lazy load components to avoid bundling React in background script or heavy bundles
const SQPSnapshotTool = lazy(() => import('@/entrypoints/sidepanel/tools/SQPSnapshotTool').then(m => ({ default: m.SQPSnapshotTool })));
const TopTermsTool = lazy(() => import('@/entrypoints/sidepanel/tools/TopTermsTool').then(m => ({ default: m.TopTermsTool })));
const CategoryInsightsTool = lazy(() => import('@/entrypoints/sidepanel/tools/CategoryInsightsTool').then(m => ({ default: m.CategoryInsightsTool })));
const AsinExplorerTool = lazy(() => import('@/entrypoints/sidepanel/tools/AsinExplorerTool').then(m => ({ default: m.AsinExplorerTool })));
const ProductNicheMetrics = lazy(() => import('@/entrypoints/sidepanel/tools/ProductNicheMetrics').then(m => ({ default: m.ProductNicheMetrics })));
const NicheX = lazy(() => import('@/entrypoints/sidepanel/tools/NicheX').then(m => ({ default: m.NicheX })));
const SalesTrafficDrilldown = lazy(() => import('@/entrypoints/sidepanel/tools/SalesTrafficDrilldown').then(m => ({ default: m.SalesTrafficDrilldown })));
const PriceTrackerTool = lazy(() => import('@/entrypoints/sidepanel/tools/PriceTrackerTool').then(m => ({ default: m.PriceTrackerTool })));
const RufusQA = lazy(() => import('@/entrypoints/sidepanel/tools/RufusQA').then(m => ({ default: m.RufusQA })));


// SQP Progress Mapper
const sqpProgressMapper = (progress: any) => ({
    ...progress,
    total: progress.total || 0,
    completed: progress.completed || 0,
    failed: 0,
    currentUrl: progress.currentUrl,
    statusMessage: progress.statusMessage
});

export const toolDefinitions: ToolDefinition[] = [
    {
        id: 'sqr-simple',
        name: 'SQP Snapshot',
        description: 'Quickly capture Search Query Performance data.',
        iconName: 'Zap',
        category: 'Market Intelligence',
        service: sqpUniversalService,
        execute: (opts, cb) => sqpUniversalService.executeSnapshot(opts, cb),
        filenamePrefix: 'SQPSnapshot',
        progressMapper: sqpProgressMapper,
        component: SQPSnapshotTool,
        isBackground: true,
        validation: { type: 'asinList', requireInput: true },
        exportParams: { supportsExportSettings: true, stateBinding: 'sqp' }
    },
    {
        id: 'sqr-detail',
        name: 'SQP Deep Dive',
        description: 'In-depth analysis of Search Query Performance.',
        iconName: 'Search',
        category: 'Market Intelligence',
        service: sqpUniversalService,
        execute: (opts, cb) => sqpUniversalService.executeDeepDive(opts, cb),
        filenamePrefix: 'SQPDeepDive',
        progressMapper: sqpProgressMapper,
        component: SQPSnapshotTool,
        isBackground: true,
        validation: { type: 'asinList', requireInput: true },
        exportParams: { supportsExportSettings: true, stateBinding: 'sqp' }
    },
    {
        id: 'top-terms',
        name: 'Top Search Terms',
        description: 'Discover high-performing search terms.',
        iconName: 'TrendingUp',
        category: 'Keyword Research',
        service: topTermsService,
        execute: (opts, cb) => topTermsService.execute(null, opts, cb),
        filenamePrefix: 'TopTerms',
        component: TopTermsTool,
        isBackground: true,
        validation: { type: 'mixed', requireInput: true },  // Uses ASINs OR Search Terms
        exportParams: { supportsExportSettings: true, stateBinding: 'sqp' }
    },
    {
        id: 'category-insights',
        name: 'Category Insights',
        description: 'Analyze category trends and performance.',
        iconName: 'BarChart',
        category: 'Market Research',
        service: categoryInsightsService,
        execute: (opts, cb) => categoryInsightsService.execute(null, opts, cb),
        filenamePrefix: 'CategoryInsights',
        component: CategoryInsightsTool,
        isBackground: true,
        validation: { type: 'keywordList', requireInput: true },
        exportParams: { supportsExportSettings: true, stateBinding: 'category' }
    },
    {
        id: 'asin-x',
        name: 'ASIN Explorer',
        description: 'Deep dive into ASIN metrics and details.',
        iconName: 'Package',
        category: 'Product Analysis',
        service: asinExplorerService,
        execute: (opts, cb) => asinExplorerService.execute(null, opts, cb),
        filenamePrefix: 'AsinExplorer',
        component: AsinExplorerTool,
        isBackground: true,
        validation: { type: 'asinList', requireInput: true },
        exportParams: { supportsExportSettings: true, stateBinding: 'asin' }
    },
    {
        id: 'product-niche-metrics',
        name: 'Product Niche Metrics',
        description: 'Evaluate niche profitability and metrics.',
        iconName: 'PieChart',
        category: 'Market Research',
        service: productNicheMetricsService,
        execute: (opts, cb) => productNicheMetricsService.execute(null, opts, cb),
        filenamePrefix: 'ProductNicheMetrics',
        component: ProductNicheMetrics,
        isBackground: true,
        validation: { type: 'asinList', requireInput: true },
        exportParams: { supportsExportSettings: true, stateBinding: 'asin' }
    },
    {
        id: 'niche-x',
        name: 'Niche Explorer',
        description: 'Explore new niches and opportunities.',
        iconName: 'Compass',
        category: 'Market Research',
        service: nicheXService,
        execute: (opts, cb) => nicheXService.execute(null, opts, cb),
        filenamePrefix: 'NicheExplorer',
        component: NicheX,
        isBackground: true,
        validation: { type: 'asinList', requireInput: true },
        exportParams: { supportsExportSettings: true, stateBinding: 'asin' }
    },
    {
        id: 'niche-query-pulse',
        name: 'Niche Query Pulse',
        description: 'Track query performance within a niche.',
        iconName: 'Activity',
        category: 'Keyword Research',
        service: nicheQueryPulseService,
        execute: (opts, cb) => nicheQueryPulseService.execute(null, opts, cb), // Reuses ProductNicheMetrics component in original code
        filenamePrefix: 'NicheQueryPulse',
        component: ProductNicheMetrics,
        isBackground: true,
        validation: { type: 'asinList', requireInput: true },
        exportParams: { supportsExportSettings: true, stateBinding: 'asin' }
    },
    {
        id: 'sales-traffic-drilldown',
        name: 'Sales & Traffic Drilldown',
        description: 'Detailed analysis of sales and traffic reports.',
        iconName: 'TrendingDown',
        category: 'Performance Reports',
        service: salesTrafficDrilldownService,
        execute: (opts, cb) => salesTrafficDrilldownService.execute(null, opts, cb),
        filenamePrefix: 'SalesTrafficDrilldown',
        component: SalesTrafficDrilldown,
        isBackground: true,
        validation: { type: 'asinList', requireInput: false }, // Can run with just date range (all items)
        exportParams: { supportsExportSettings: true, stateBinding: 'salesTraffic' }
    },
    {
        id: 'price-tracker',
        name: 'Price Tracker',
        description: 'Monitor product price changes over time.',
        iconName: 'DollarSign',
        category: 'Performance Reports',
        service: priceTrackerService,
        execute: (opts, cb) => priceTrackerService.execute(null, opts, cb),
        filenamePrefix: 'PriceTracker',
        component: PriceTrackerTool,
        isBackground: true,
        validation: { type: 'asinList', requireInput: true },
        exportParams: { supportsExportSettings: true, stateBinding: 'asin' }
    },
    {
        id: 'rufus-qa',
        name: 'Rufus Q&A',
        description: 'Extract top related questions and answers using Rufus AI.',
        iconName: 'MessageSquare',
        category: 'Customer Intelligence',
        service: rufusQAService,
        execute: (opts, cb) => rufusQAService.execute(null, opts, cb),
        filenamePrefix: 'RufusQA',
        component: RufusQA,
        isBackground: true,
        validation: { type: 'asinList', requireInput: true },
        exportParams: { supportsExportSettings: true, stateBinding: 'asin' }
    },
    // Alias for potential ID mismatch
    {
        id: 'rufus_qa',
        name: 'Rufus Q&A',
        description: 'Extract top related questions and answers using Rufus AI.',
        iconName: 'MessageSquare',
        category: 'Customer Intelligence',
        service: rufusQAService,
        execute: (opts, cb) => rufusQAService.execute(null, opts, cb),
        filenamePrefix: 'RufusQA',
        component: RufusQA,
        isBackground: true,
        validation: { type: 'asinList', requireInput: true },
        exportParams: { supportsExportSettings: true, stateBinding: 'asin' }
    },
    {
        id: 'rufus-qna',
        name: 'Rufus Q&A',
        description: 'Extract top related questions and answers using Rufus AI.',
        iconName: 'MessageSquare',
        category: 'Customer Intelligence',
        service: rufusQAService,
        execute: (opts, cb) => rufusQAService.execute(null, opts, cb),
        filenamePrefix: 'RufusQA',
        component: RufusQA,
        isBackground: true,
        validation: { type: 'asinList', requireInput: true },
        exportParams: { supportsExportSettings: true, stateBinding: 'asin' }
    }
];

export const getToolDefinition = (id: string, name?: string) => toolDefinitions.find(t => t.id === id) || (name ? toolDefinitions.find(t => t.name === name) : undefined);
