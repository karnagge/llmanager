"use client";

import { useState } from "react";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { useMetricsDownload } from "@/hooks/metrics/use-metrics-export";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MetricType = {
  id: string;
  label: string;
};

type TimeRangeType = {
  value: string;
  label: string;
};

const AVAILABLE_METRICS: MetricType[] = [
  { id: "api_requests", label: "Requisições da API" },
  { id: "error_rate", label: "Taxa de Erro" },
  { id: "token_usage", label: "Uso de Tokens" },
  { id: "response_time", label: "Tempo de Resposta" },
  { id: "cache_hits", label: "Cache Hits" },
];

const TIME_RANGES: TimeRangeType[] = [
  { value: "24h", label: "Últimas 24 horas" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "custom", label: "Personalizado" },
];

interface FormValues {
  format: "csv" | "json";
  timeRange: string;
  metrics: string[];
  startDate?: string;
  endDate?: string;
}

type FieldProps = ControllerRenderProps<FormValues>;

export function MetricsExportDialog() {
  const [open, setOpen] = useState(false);
  const form = useForm<FormValues>({
    defaultValues: {
      format: "csv",
      timeRange: "24h",
      metrics: [],
    },
  });

  const { downloadMetrics, isLoading } = useMetricsDownload();

  const onSubmit = async (data: FormValues) => {
    let from: string;
    let to: string;

    if (data.timeRange === "custom" && data.startDate && data.endDate) {
      from = data.startDate;
      to = data.endDate;
    } else {
      const now = new Date();
      to = now.toISOString();
      
      switch (data.timeRange) {
        case "24h":
          from = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
          break;
        case "7d":
          from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case "30d":
          from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        default:
          from = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      }
    }

    await downloadMetrics({
      format: data.format,
      from,
      to,
      metrics: data.metrics,
    });

    setOpen(false);
  };

  const showCustomDateRange = form.watch("timeRange") === "custom";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Calendar className="mr-2 h-4 w-4" />
          Exportar Métricas
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Exportar Métricas</DialogTitle>
          <DialogDescription>
            Selecione as métricas e o período que deseja exportar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="format"
              render={({ field }: { field: FieldProps }) => (
                <FormItem>
                  <FormLabel>Formato</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value as string}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o formato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timeRange"
              render={({ field }: { field: FieldProps }) => (
                <FormItem>
                  <FormLabel>Período</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value as string}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o período" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIME_RANGES.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showCustomDateRange && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }: { field: FieldProps }) => (
                    <FormItem>
                      <FormLabel>Data Inicial</FormLabel>
                      <FormControl>
                        <input
                          type="date"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }: { field: FieldProps }) => (
                    <FormItem>
                      <FormLabel>Data Final</FormLabel>
                      <FormControl>
                        <input
                          type="date"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="metrics"
              render={({ field }: { field: FieldProps }) => (
                <FormItem>
                  <FormLabel>Métricas</FormLabel>
                  <Select
                    onValueChange={(value: string) => field.onChange([...(field.value as string[]), value])}
                    value=""
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione as métricas" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AVAILABLE_METRICS.map((metric) => (
                        <SelectItem key={metric.id} value={metric.id}>
                          {metric.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(field.value as string[]).map((metricId: string) => {
                      const metric = AVAILABLE_METRICS.find((m) => m.id === metricId);
                      return (
                        <div
                          key={metricId}
                          className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm"
                        >
                          {metric?.label}
                          <button
                            type="button"
                            onClick={() =>
                              field.onChange((field.value as string[]).filter((id) => id !== metricId))
                            }
                            className="ml-1 text-muted-foreground hover:text-foreground"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Exportando..." : "Exportar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}