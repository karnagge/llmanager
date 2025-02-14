"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Card as TremorCard } from "@tremor/react";

interface DataPoint {
  date: string;
  [key: string]: string | number;
}

interface LineChartProps {
  title: string;
  description?: string;
  data: DataPoint[];
  categories: string[];
  index: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  isLoading?: boolean;
  className?: string;
  height?: string;
}

export function LineChart({
  title,
  description,
  data,
  categories,
  index,
  colors = ["emerald", "gray"],
  valueFormatter = (value) => value.toString(),
  isLoading = false,
  className,
  height = "h-72",
}: LineChartProps) {
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
        <CardContent>
          <Skeleton className={height} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <TremorCard className="p-0">
          <AreaChart
            className={height}
            data={data}
            index={index}
            categories={categories}
            colors={colors}
            valueFormatter={valueFormatter}
            showLegend
            showGridLines
            showTooltip
            showXAxis
            showYAxis
          />
        </TremorCard>
      </CardContent>
    </Card>
  );
}