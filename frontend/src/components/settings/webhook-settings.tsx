"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useWebhooks } from "@/hooks/settings/use-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import type { CreateWebhookDto, UpdateWebhookDto } from "@/services/settings-service";

const WEBHOOK_EVENTS = [
  { id: "user.created", label: "Usuário Criado" },
  { id: "user.updated", label: "Usuário Atualizado" },
  { id: "group.created", label: "Grupo Criado" },
  { id: "group.updated", label: "Grupo Atualizado" },
  { id: "quota.exceeded", label: "Quota Excedida" },
  { id: "token.usage", label: "Uso de Tokens" },
  { id: "system.alert", label: "Alerta do Sistema" },
] as const;

const createWebhookSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  url: z.string().url("URL inválida"),
  events: z.array(z.string()).min(1, "Selecione pelo menos um evento"),
  secret: z.string().optional(),
});

type CreateWebhookFormValues = z.infer<typeof createWebhookSchema>;

export function WebhookSettings() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: webhooks = [], isLoading, createWebhook, updateWebhook, deleteWebhook } = useWebhooks();

  const form = useForm<CreateWebhookFormValues>({
    resolver: zodResolver(createWebhookSchema),
    defaultValues: {
      events: [],
    },
  });

  const onSubmit = async (values: CreateWebhookFormValues) => {
    try {
      await createWebhook({
        ...values,
        active: true, // Default to active when created
      });
      setCreateDialogOpen(false);
      form.reset();
      toast.success("Webhook criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar webhook:", error);
      toast.error("Erro ao criar webhook");
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await updateWebhook({
        id,
        data: { active } satisfies UpdateWebhookDto,
      });
      toast.success(active ? "Webhook ativado" : "Webhook desativado");
    } catch (error) {
      console.error("Erro ao atualizar webhook:", error);
      toast.error("Erro ao atualizar webhook");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este webhook?")) {
      return;
    }

    try {
      await deleteWebhook(id);
      toast.success("Webhook excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir webhook:", error);
      toast.error("Erro ao excluir webhook");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>
                Configure webhooks para receber notificações de eventos do sistema
              </CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : webhooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-muted-foreground">
                Nenhum webhook configurado
              </div>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setCreateDialogOpen(true)}
              >
                Criar primeiro webhook
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Eventos</TableHead>
                    <TableHead>Último Disparo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Ativo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhooks.map((webhook) => (
                    <TableRow key={webhook.id}>
                      <TableCell>{webhook.name}</TableCell>
                      <TableCell className="font-mono text-sm">{webhook.url}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {webhook.events.map((event) => (
                            <span
                              key={event}
                              className="rounded-full bg-primary/10 px-2 py-1 text-xs"
                            >
                              {WEBHOOK_EVENTS.find((e) => e.id === event)?.label || event}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {webhook.lastTriggered
                          ? format(new Date(webhook.lastTriggered), "dd/MM/yyyy HH:mm")
                          : "Nunca"}
                      </TableCell>
                      <TableCell>
                        {webhook.failureCount > 0 ? (
                          <span className="text-destructive">
                            {webhook.failureCount} falhas
                          </span>
                        ) : (
                          <span className="text-success">Operacional</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={webhook.active}
                          onCheckedChange={(checked: boolean) =>
                            handleToggleActive(webhook.id, checked)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Webhook</DialogTitle>
            <DialogDescription>
              Configure um novo endpoint para receber eventos do sistema.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Meu Webhook" {...field} />
                    </FormControl>
                    <FormDescription>
                      Um nome para identificar este webhook
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://api.exemplo.com/webhook"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      O endpoint que receberá as requisições
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Webhook secret"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Uma chave secreta para validar as requisições
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="events"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Eventos</FormLabel>
                    <div className="grid gap-2">
                      {WEBHOOK_EVENTS.map((event) => (
                        <label
                          key={event.id}
                          className="flex items-center gap-2 rounded-lg border p-4"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            value={event.id}
                            checked={field.value.includes(event.id)}
                            onChange={(e) => {
                              const value = e.target.value;
                              const values = e.target.checked
                                ? [...field.value, value]
                                : field.value.filter((v: string) => v !== value);
                              field.onChange(values);
                            }}
                          />
                          <span>{event.label}</span>
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}