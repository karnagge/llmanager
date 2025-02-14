"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DonutChart as TremorDonutChart, Card as TremorCard } from "@tremor/react";

interface DataPoint {
  name: string;
  value: number;
}

interface PieChartProps {
  title: string;
  description?: string;
  data: DataPoint[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  isLoading?: boolean;
  className?: string;
  variant?: "pie" | "donut";
  showLabel?: boolean;
  showAnimation?: boolean;
}

export function PieChart({
  title,
  description,
  data,
  colors = ["slate", "violet", "indigo", "rose", "cyan", "amber"],
  valueFormatter = (value) => value.toString(),
  isLoading = false,
  className,
  variant = "donut",
  showLabel = true,
  showAnimation = true,
}: PieChartProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-[250px]" />
          </CardTitle>
          {description && (
            <CardDescription>
              <Skeleton className="h-4 w-[400px]" />
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex justify-center">
          <Skeleton className="h-[300px] w-[300px] rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const formattedData = data.map((item) => ({
    ...item,
    percentage: ((item.value / total) * 100).toFixed(1) + "%",
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <TremorCard className="p-0">
          <div className="flex justify-center">
            <TremorDonutChart
              data={formattedData}
              category="value"
              index="name"
              colors={colors}
              valueFormatter={valueFormatter}
              variant={variant}
              showLabel={showLabel}
              showAnimation={showAnimation}
              label={`Total: ${valueFormatter(total)}`}
            />
          </div>
          {showLabel && (
            <div className="mt-4 grid grid-cols-2 gap-2 px-4 sm:grid-cols-3">
              {formattedData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: `var(--tremor-${
                        colors[formattedData.indexOf(item) % colors.length]
                      }-500)`,
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-zinc-500">
                      {item.percentage} ({valueFormatter(item.value)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TremorCard>
      </CardContent>
    </Card>
  );
}