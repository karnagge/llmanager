"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { QuotaLimit } from "@/services/quotas/quota-service";

const quotaLimitSchema = z.object({
  type: z.enum(["TOKENS", "REQUESTS"] as const),
  limit: z.number().min(1, "O limite deve ser maior que zero"),
  period: z.enum(["DAILY", "MONTHLY", "YEARLY"] as const),
});

type QuotaLimitFormData = z.infer<typeof quotaLimitSchema>;

interface QuotaLimitFormProps {
  initialData?: QuotaLimit;
  onSubmit: (data: QuotaLimitFormData) => Promise<void>;
  onCancel: () => void;
}

export function QuotaLimitForm({
  initialData,
  onSubmit,
  onCancel,
}: QuotaLimitFormProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<QuotaLimitFormData>({
    resolver: zodResolver(quotaLimitSchema),
    defaultValues: initialData
      ? {
          type: initialData.type,
          limit: initialData.limit,
          period: initialData.period,
        }
      : undefined,
  });

  const onSubmitForm = async (data: QuotaLimitFormData) => {
    try {
      setError(null);
      await onSubmit(data);
    } catch {
      setError("Ocorreu um erro ao salvar o limite de quota.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Tipo de Quota</label>
        <select
          {...register("type")}
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          <option value="TOKENS">Tokens</option>
          <option value="REQUESTS">Requisições</option>
        </select>
        {errors.type && (
          <p className="text-sm text-red-500">{errors.type.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Input
          type="number"
          label="Limite"
          {...register("limit", { valueAsNumber: true })}
          error={!!errors.limit}
          helperText={errors.limit?.message}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Período</label>
        <select
          {...register("period")}
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          <option value="DAILY">Diário</option>
          <option value="MONTHLY">Mensal</option>
          <option value="YEARLY">Anual</option>
        </select>
        {errors.period && (
          <p className="text-sm text-red-500">{errors.period.message}</p>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar"
          )}
        </Button>
      </div>
    </form>
  );
}