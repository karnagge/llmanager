"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QuotaLimit } from "@/services/quotas/quota-service";
import { QuotaLimitForm } from "./quota-limit-form";
import { useState } from "react";
import { useCreateQuotaLimit, useUpdateQuotaLimit } from "@/hooks/api/use-quotas";

interface QuotaLimitDialogProps {
  trigger: React.ReactNode;
  quota?: QuotaLimit;
}

export function QuotaLimitDialog({ trigger, quota }: QuotaLimitDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const createQuota = useCreateQuotaLimit();
  const updateQuota = useUpdateQuotaLimit();

  const handleSubmit = async (data: {
    type: "TOKENS" | "REQUESTS";
    limit: number;
    period: "DAILY" | "MONTHLY" | "YEARLY";
  }) => {
    try {
      if (quota) {
        await updateQuota.mutateAsync({
          limitId: quota.id,
          data,
        });
      } else {
        await createQuota.mutateAsync(data);
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Erro ao salvar quota:", error);
      throw error;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {quota ? "Editar Limite de Quota" : "Novo Limite de Quota"}
          </DialogTitle>
        </DialogHeader>
        <QuotaLimitForm
          initialData={quota}
          onSubmit={handleSubmit}
          onCancel={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}