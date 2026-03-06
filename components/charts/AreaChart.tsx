import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export interface AreaChartProps {
  data: Array<Record<string, any>>;
  xAxisKey: string;
  areas: Array<{
    dataKey: string;
    fill?: string;
    stroke?: string;
    name?: string;
  }>;
  height?: number;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  xAxisKey,
  areas,
  height = 300,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          {areas.map((area, index) => (
            <linearGradient
              key={`gradient-${area.dataKey}`}
              id={`color-${area.dataKey}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor={area.fill || `hsl(var(--chart-${(index % 5) + 1}))`}
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor={area.fill || `hsl(var(--chart-${(index % 5) + 1}))`}
                stopOpacity={0}
              />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey={xAxisKey}
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
          labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
        />
        <Legend />
        {areas.map((area, index) => (
          <Area
            key={area.dataKey}
            type="monotone"
            dataKey={area.dataKey}
            stroke={area.stroke || `hsl(var(--chart-${(index % 5) + 1}))`}
            fillOpacity={1}
            fill={`url(#color-${area.dataKey})`}
            name={area.name || area.dataKey}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
};
