"use client";

import { useNotificationSettings } from "@/hooks/settings/use-settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import type { NotificationSettings as NotificationSettingsType } from "@/services/settings-service";

const notificationSchema = z.object({
  email: z.object({
    enabled: z.boolean(),
    recipients: z.array(z.string().email("Email inválido")),
    quotaAlerts: z.boolean(),
    systemAlerts: z.boolean(),
    weeklyReports: z.boolean(),
  }),
  slack: z.object({
    enabled: z.boolean(),
    webhookUrl: z.string().url("URL inválida").optional().or(z.literal("")),
    channel: z.string().optional(),
    quotaAlerts: z.boolean(),
    systemAlerts: z.boolean(),
  }),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

export function NotificationSettings() {
  const { data: settings, isLoading, updateSettings } = useNotificationSettings();

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      email: {
        enabled: false,
        recipients: [],
        quotaAlerts: true,
        systemAlerts: true,
        weeklyReports: true,
      },
      slack: {
        enabled: false,
        webhookUrl: "",
        channel: "",
        quotaAlerts: true,
        systemAlerts: true,
      },
    },
    values: settings,
  });

  const onSubmit = async (values: NotificationFormValues) => {
    try {
      await updateSettings(values);
      toast.success("Configurações de notificação atualizadas!");
    } catch (error) {
      console.error("Erro ao atualizar configurações:", error);
      toast.error("Erro ao atualizar configurações");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notificações por Email</CardTitle>
            <CardDescription>
              Configure as notificações por email do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="email.enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Ativar notificações por email</FormLabel>
                    <FormDescription>
                      Receba notificações importantes por email
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch("email.enabled") && (
              <>
                <FormField
                  control={form.control}
                  name="email.recipients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destinatários</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="email1@exemplo.com, email2@exemplo.com"
                          value={field.value.join(", ")}
                          onChange={(e) => {
                            const emails = e.target.value
                              .split(",")
                              .map((email) => email.trim())
                              .filter(Boolean);
                            field.onChange(emails);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Separe múltiplos emails com vírgulas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="email.quotaAlerts"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Alertas de Quota</FormLabel>
                          <FormDescription>
                            Notificações quando a quota estiver próxima do limite
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email.systemAlerts"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Alertas do Sistema</FormLabel>
                          <FormDescription>
                            Notificações sobre eventos importantes do sistema
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email.weeklyReports"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Relatórios Semanais</FormLabel>
                          <FormDescription>
                            Receba um resumo semanal das atividades
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Slack Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notificações no Slack</CardTitle>
            <CardDescription>
              Configure as notificações no Slack do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="slack.enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Ativar notificações no Slack</FormLabel>
                    <FormDescription>
                      Receba notificações importantes no Slack
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch("slack.enabled") && (
              <>
                <FormField
                  control={form.control}
                  name="slack.webhookUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Webhook URL</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://hooks.slack.com/services/..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        URL do webhook do Slack para envio das notificações
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slack.channel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Canal (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="#notifications" {...field} />
                      </FormControl>
                      <FormDescription>
                        Canal específico para envio das notificações
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="slack.quotaAlerts"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Alertas de Quota</FormLabel>
                          <FormDescription>
                            Notificações quando a quota estiver próxima do limite
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slack.systemAlerts"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Alertas do Sistema</FormLabel>
                          <FormDescription>
                            Notificações sobre eventos importantes do sistema
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Salvar Alterações</Button>
        </div>
      </form>
    </Form>
  );
}