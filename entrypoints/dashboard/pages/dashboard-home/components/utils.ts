// Helper to format compact numbers (e.g. 1.2k)
export const formatCompactNumber = (num: number): string => {
    return Intl.NumberFormat('en-US', {
        notation: "compact",
        maximumFractionDigits: 1
    }).format(num);
};
