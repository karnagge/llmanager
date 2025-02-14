"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { QuotaAlertForm } from "./quota-alert-form";
import { useQuotaLimits, useCreateQuotaAlert } from "@/hooks/api/use-quotas";

interface QuotaAlertDialogProps {
  trigger: React.ReactNode;
}

export function QuotaAlertDialog({ trigger }: QuotaAlertDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: quotas } = useQuotaLimits();
  const createAlert = useCreateQuotaAlert();

  const handleSubmit = async (data: {
    quotaId: string;
    threshold: number;
  }) => {
    try {
      await createAlert.mutateAsync(data);
      setIsOpen(false);
    } catch (error) {
      console.error("Erro ao criar alerta:", error);
      throw error;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Alerta de Quota</DialogTitle>
        </DialogHeader>
        <QuotaAlertForm
          quotas={quotas ?? []}
          onSubmit={handleSubmit}
          onCancel={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}