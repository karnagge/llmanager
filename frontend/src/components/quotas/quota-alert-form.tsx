"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { QuotaLimit } from "@/services/quotas/quota-service";

const alertFormSchema = z.object({
  quotaId: z.string().min(1, "Selecione uma quota"),
  threshold: z
    .number()
    .min(1, "O limite deve ser maior que 0")
    .max(100, "O limite deve ser menor que 100"),
});

type AlertFormData = z.infer<typeof alertFormSchema>;

interface QuotaAlertFormProps {
  quotas: QuotaLimit[];
  onSubmit: (data: AlertFormData) => Promise<void>;
  onCancel: () => void;
}

export function QuotaAlertForm({
  quotas,
  onSubmit,
  onCancel,
}: QuotaAlertFormProps) {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AlertFormData>({
    resolver: zodResolver(alertFormSchema),
  });

  const onSubmitForm = async (data: AlertFormData) => {
    try {
      setError(null);
      await onSubmit(data);
    } catch {
      setError("Ocorreu um erro ao salvar o alerta.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Quota</label>
        <select
          {...register("quotaId")}
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
        >
          <option value="">Selecione uma quota</option>
          {quotas.map((quota) => (
            <option key={quota.id} value={quota.id}>
              {quota.type === "TOKENS" ? "Tokens" : "Requisições"} -{" "}
              {["Diário", "Mensal", "Anual"][
                ["DAILY", "MONTHLY", "YEARLY"].indexOf(quota.period)
              ]}
            </option>
          ))}
        </select>
        {errors.quotaId && (
          <p className="text-sm text-red-500">{errors.quotaId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Input
          type="number"
          label="Limite Percentual (%)"
          {...register("threshold", { valueAsNumber: true })}
          error={!!errors.threshold}
          helperText={errors.threshold?.message}
        />
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