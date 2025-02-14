"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSystemPreferences } from "@/hooks/settings/use-settings";
import { type SystemPreferences } from "@/services/settings-service";

const preferencesSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  defaultQuota: z.number().min(0, "Quota deve ser maior que 0"),
  maxTokensPerRequest: z.number().min(0, "Limite deve ser maior que 0"),
  allowNewRegistrations: z.boolean(),
  requireEmailVerification: z.boolean(),
  theme: z.enum(["light", "dark", "system"]),
  dateFormat: z.string().min(1, "Formato de data é obrigatório"),
  timeZone: z.string().min(1, "Fuso horário é obrigatório"),
});

const THEMES = [
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
  { value: "system", label: "Sistema" },
] as const;

const DATE_FORMATS = [
  { value: "dd/MM/yyyy", label: "DD/MM/YYYY" },
  { value: "MM/dd/yyyy", label: "MM/DD/YYYY" },
  { value: "yyyy-MM-dd", label: "YYYY-MM-DD" },
] as const;

export function SystemPreferences() {
  const { data: preferences, isLoading, updatePreferences } = useSystemPreferences();

  const form = useForm<SystemPreferences>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      name: "",
      description: "",
      defaultQuota: 1000,
      maxTokensPerRequest: 1000,
      allowNewRegistrations: true,
      requireEmailVerification: true,
      theme: "system",
      dateFormat: "dd/MM/yyyy",
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    values: preferences,
  });

  const onSubmit = async (data: SystemPreferences) => {
    try {
      await updatePreferences(data);
    } catch (error) {
      console.error("Erro ao atualizar preferências:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Configure as informações básicas do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Sistema</FormLabel>
                  <FormControl>
                    <Input placeholder="LLM Manager" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nome exibido no cabeçalho e título da página
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Gerenciador de LLMs" {...field} />
                  </FormControl>
                  <FormDescription>Uma breve descrição do sistema</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Limites e Quotas</CardTitle>
            <CardDescription>
              Configure os limites padrão do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="defaultQuota"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quota Padrão</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1000"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Número de tokens padrão para novos usuários
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxTokensPerRequest"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Limite por Requisição</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="1000"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Número máximo de tokens por requisição
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações de Registro</CardTitle>
            <CardDescription>
              Configure as opções de registro de novos usuários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="allowNewRegistrations"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Permitir Novos Registros</FormLabel>
                    <FormDescription>
                      Permite que novos usuários se registrem no sistema
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
              name="requireEmailVerification"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Verificação de Email</FormLabel>
                    <FormDescription>
                      Requer verificação de email para novos usuários
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aparência e Localização</CardTitle>
            <CardDescription>
              Configure o tema e formato de datas do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tema</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um tema" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {THEMES.map((theme) => (
                        <SelectItem key={theme.value} value={theme.value}>
                          {theme.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Tema padrão do sistema
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateFormat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Formato de Data</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um formato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DATE_FORMATS.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Formato padrão para exibição de datas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timeZone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fuso Horário</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um fuso horário" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Intl.supportedValuesOf('timeZone').map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Fuso horário padrão do sistema
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg">
            Salvar Alterações
          </Button>
        </div>
      </form>
    </Form>
  );
}