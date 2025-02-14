"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Copy, Plus, Trash2 } from "lucide-react";
import { useApiKeys } from "@/hooks/settings/use-settings";
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
import type { ApiKey } from "@/services/settings-service";

const createApiKeySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  expiresAt: z.string().optional(),
  scopes: z.array(z.string()).default([]),
});

type CreateApiKeyFormValues = z.infer<typeof createApiKeySchema>;

export function ApiKeys() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: keys = [], isLoading, createApiKey, deleteApiKey } = useApiKeys();

  const form = useForm<CreateApiKeyFormValues>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      name: "",
      scopes: [],
    },
  });

  const onSubmit = async (values: CreateApiKeyFormValues) => {
    try {
      const newKey = await createApiKey(values);
      setCreateDialogOpen(false);
      form.reset();

      // Show the API key in a toast since it will only be shown once
      toast.message("API Key criada com sucesso!", {
        description: (
          <div className="mt-2 space-y-2">
            <p className="font-medium">Copie sua chave de API:</p>
            <div className="flex items-center gap-2 rounded-md bg-muted p-2">
              <code className="text-sm">{newKey.key}</code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(newKey.key);
                  toast.success("Chave copiada!");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Esta chave será mostrada apenas uma vez.
            </p>
          </div>
        ),
      });
    } catch (error) {
      console.error("Erro ao criar API key:", error);
      toast.error("Erro ao criar API key");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta chave de API?")) {
      return;
    }

    try {
      await deleteApiKey(id);
      toast.success("API Key excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir API key:", error);
      toast.error("Erro ao excluir API key");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Chaves de API</CardTitle>
              <CardDescription>
                Gerencie as chaves de API para integração com outros sistemas
              </CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Chave
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : keys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-muted-foreground">
                Nenhuma chave de API encontrada
              </div>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setCreateDialogOpen(true)}
              >
                Criar primeira chave
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Criada em</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead>Último uso</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell>{key.name}</TableCell>
                      <TableCell>
                        {format(new Date(key.createdAt), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        {key.expiresAt
                          ? format(new Date(key.expiresAt), "dd/MM/yyyy HH:mm")
                          : "Nunca"}
                      </TableCell>
                      <TableCell>
                        {key.lastUsed
                          ? format(new Date(key.lastUsed), "dd/MM/yyyy HH:mm")
                          : "Nunca usada"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(key.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
            <DialogTitle>Criar Nova Chave de API</DialogTitle>
            <DialogDescription>
              Crie uma nova chave de API para integração com outros sistemas.
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
                      <Input placeholder="Minha API Key" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Expiração (opcional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
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