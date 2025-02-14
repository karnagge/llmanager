"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/utils/format";
import { QuotaAlert as QuotaAlertType } from "@/services/quotas/quota-service";

interface QuotaAlertProps {
  alert: QuotaAlertType;
  onDismiss?: (alertId: string) => void;
  className?: string;
}

export function QuotaAlert({ alert, onDismiss, className }: QuotaAlertProps) {
  const percentage = alert.threshold;
  const severityClass =
    percentage >= 90
      ? "border-red-500 bg-red-50 dark:bg-red-950"
      : percentage >= 75
      ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
      : "border-blue-500 bg-blue-50 dark:bg-blue-950";

  const textClass =
    percentage >= 90
      ? "text-red-700 dark:text-red-300"
      : percentage >= 75
      ? "text-yellow-700 dark:text-yellow-300"
      : "text-blue-700 dark:text-blue-300";

  const iconClass =
    percentage >= 90
      ? "text-red-500"
      : percentage >= 75
      ? "text-yellow-500"
      : "text-blue-500";

  return (
    <Card
      className={cn(
        "border-l-4 transition-colors duration-200",
        severityClass,
        className
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-base">
          <AlertTriangle className={cn("mr-2 h-5 w-5", iconClass)} />
          <span className={textClass}>Alerta de Quota</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("mb-4 text-sm", textClass)}>
          O uso atual atingiu {formatNumber(percentage)}% do limite estabelecido.
          Considere ajustar seus limites ou reduzir o consumo.
        </p>
        {onDismiss && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDismiss(alert.id)}
              className={cn(
                "border-current hover:bg-current/10",
                textClass
              )}
            >
              Dispensar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}