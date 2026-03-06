import React, { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MarketplaceSelector } from '../components/MarketplaceSelector';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Search, X } from 'lucide-react';

interface CategoryInsightsToolProps {
    onDataChange: (data: any) => void;
    initialData?: any;
    toolId?: string;
}

export const CategoryInsightsTool: React.FC<CategoryInsightsToolProps> = ({
    onDataChange,
    initialData,
    toolId: _toolId
}) => {
    const [keywords, setKeywords] = useState(initialData?.keywords || '');
    const [marketplace, setMarketplace] = useState(initialData?.marketplace || 'us');
    const [reportType, setReportType] = useState<string>(initialData?.reportType || 'mly');

    useEffect(() => {
        onDataChange({
            keywords,
            marketplace,
            reportType
        });
    }, [keywords, marketplace, reportType, onDataChange]);

    const handleClearKeywords = () => {
        setKeywords('');
    };

    const keywordCount = keywords.split('\n').filter((k: string) => k.trim()).length;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Marketplace Selector */}
            <div className="space-y-2">
                <MarketplaceSelector
                    value={marketplace}
                    onChange={setMarketplace}
                />
            </div>

            {/* Report Type Selector */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <Label className="text-sm font-medium">Report Type</Label>
                </div>
                
                <Tabs value={reportType} onValueChange={setReportType} className="w-full space-y-2">
                    {/* Range Selection (Top Row) */}
                    <TabsList className="grid w-full grid-cols-4 h-9 p-1 gap-1 bg-muted/50">
                        <TabsTrigger value="l7d" className="text-xs h-7 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">7 Days</TabsTrigger>
                        <TabsTrigger value="l30d" className="text-xs h-7 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">30 Days</TabsTrigger>
                        <TabsTrigger value="l90d" className="text-xs h-7 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">90 Days</TabsTrigger>
                        <TabsTrigger value="l12m" className="text-xs h-7 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">12 Months</TabsTrigger>
                    </TabsList>

                    {/* Frequency Selection (Bottom Row) */}
                    {/* <TabsList className="grid w-full grid-cols-3 h-9 p-1 gap-1 bg-muted/50">
                        <TabsTrigger value="dly" className="text-xs h-7 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Daily</TabsTrigger>
                        <TabsTrigger value="wly" className="text-xs h-7 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Weekly</TabsTrigger>
                        <TabsTrigger value="mly" className="text-xs h-7 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">Monthly</TabsTrigger>
                    </TabsList> */}
                </Tabs>
            </div>

            {/* Keywords Input */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                        <Search className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <Label className="text-sm font-medium">Enter Keywords</Label>
                </div>
                <div className="relative group rounded-lg border border-input bg-background focus-within:ring-1 focus-within:ring-ring transition-all">
                    <Textarea
                        placeholder="headphones&#10;wireless mouse&#10;gaming chair"
                        className="min-h-[150px] font-mono text-xs resize-none border-none shadow-none focus-visible:ring-0 bg-transparent p-3 placeholder:text-muted-foreground/50"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                    />
                    
                    {/* Floating Controls */}
                    {keywordCount > 0 && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                {keywordCount} {keywordCount === 1 ? 'Keyword' : 'Keywords'}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleClearKeywords}
                                className="h-5 w-5 text-muted-foreground hover:text-destructive"
                                title="Clear All"
                            >
                                <span className="sr-only">Clear</span>
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                </div>
                <p className="text-[10px] text-muted-foreground pl-1">
                    Enter one keyword per line.
                </p>
            </div>
        </div>
    );
};
