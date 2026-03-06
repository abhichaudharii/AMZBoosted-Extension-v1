import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search } from 'lucide-react';
import { MarketplaceSelector } from '../components/MarketplaceSelector';

interface ProductNicheMetricsProps {
    onDataChange: (data: any) => void;
    initialData?: any;
    marketplace: string;
    setMarketplace: (value: string) => void;
    // Legacy props suppression (passed by ToolRenderer but unused if we switch to local state for inputs)
    urls?: string;
    setUrls?: (value: string) => void;
}

export const ProductNicheMetrics: React.FC<ProductNicheMetricsProps> = ({
    onDataChange,
    initialData,
    marketplace,
    setMarketplace,
}) => {
    const [inputs, setInputs] = React.useState<string>(initialData?.asinList ? (Array.isArray(initialData.asinList) ? initialData.asinList.join('\n') : initialData.asinList) : '');

    // Update parent when local state changes
    React.useEffect(() => {
        const asinList = inputs.split('\n').filter(line => line.trim().length > 0);
        
        onDataChange({
            marketplace,
            asinList,
            asins: asinList
        });
    }, [marketplace, inputs, onDataChange]);
    return (
        <div className="space-y-6">
            {/* Marketplace Selector */}
            <MarketplaceSelector
                value={marketplace}
                onChange={setMarketplace}
            />

            {/* ASIN/Keyword Input */}
            <div className="space-y-3">
                <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Search className="w-4 h-4 text-primary" />
                    Enter ASINs or Keywords
                </Label>

                <Textarea
                    placeholder={`B0...\niphone case\n...`}
                    className="min-h-[150px] font-mono text-sm resize-none focus-visible:ring-primary"
                    value={inputs}
                    onChange={(e) => setInputs(e.target.value)}
                />

                <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
                    <span>One entry per line</span>
                    <span>{inputs.split('\n').filter(l => l.trim()).length} entries</span>
                </div>
            </div>
        </div>
    );
};
