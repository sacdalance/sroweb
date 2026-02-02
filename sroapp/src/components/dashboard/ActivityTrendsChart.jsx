import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ActivityTrendsChart = ({ activities = [], className }) => {
    // Process data: get last 6 months of counts
    const chartData = useMemo(() => {
        const today = new Date();
        const last6Months = [];

        // Generate last 6 month keys
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('en-US', { month: 'short' });
            last6Months.push({ key, label, count: 0 });
        }

        // Count activities
        activities.forEach(activity => {
            if (!activity.created_at) return;

            const date = new Date(activity.created_at);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            const monthData = last6Months.find(m => m.key === key);
            if (monthData) {
                monthData.count++;
            }
        });

        // Find max for scaling
        const maxCount = Math.max(...last6Months.map(m => m.count), 5); // Minimum scale of 5

        return { data: last6Months, max: maxCount };
    }, [activities]);

    const { data, max } = chartData;

    return (
        <Card className={cn("flex flex-col h-full shadow-sm border border-gray-200", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-sro-primary flex items-center gap-2">
                    Submissions Trends
                </CardTitle>
                <p className="text-xs text-muted-foreground">Activity request volume (Last 6 Mos)</p>
            </CardHeader>
            <CardContent className="flex-1 min-h-[180px] p-4 pt-0">
                <div className="flex h-full items-end gap-2 sm:gap-4 mt-4">
                    {data.map((item) => {
                        // Calculate height percentage (min 2px for visibility)
                        const heightPercent = Math.max((item.count / max) * 100, 2);

                        return (
                            <div key={item.key} className="flex-1 flex flex-col items-center group relative z-0 hover:z-20">
                                <div className="relative w-full flex items-end justify-center h-[120px] bg-gray-50 rounded-t-sm overflow-visible">
                                    {/* Bar */}
                                    <div
                                        className="w-[60%] sm:w-[70%] bg-sro-primary group-hover:bg-sro-primary/80 transition-all duration-300 rounded-t-md relative"
                                        style={{ height: `${heightPercent}%` }}
                                    >
                                        {/* Tooltip on hover */}
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1.5 px-3 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                            <span className="font-bold">{item.count}</span> Submissions
                                            {/* Arrow */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                        </div>
                                    </div>
                                </div>
                                {/* X-Axis Label */}
                                <span className="text-[10px] sm:text-xs text-gray-500 font-medium mt-2">{item.label}</span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

export default ActivityTrendsChart;
