"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input";
import { useCreateGroup, useUpdateGroup } from "@/hooks/groups/use-groups";
import { type Group } from "@/services/group-service";

const groupSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof groupSchema>;

interface GroupFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  group?: Group;
}

export function GroupFormDialog({
  open,
  onOpenChange,
  mode,
  group,
}: GroupFormDialogProps) {
  const router = useRouter();
  const { mutateAsync: createGroup, isPending: isCreating } = useCreateGroup();
  const { mutateAsync: updateGroup, isPending: isUpdating } = useUpdateGroup();

  const form = useForm<FormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: group?.name || "",
      description: group?.description || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      if (mode === "create") {
        const newGroup = await createGroup(values);
        router.push(`/groups/${newGroup.id}`);
      } else if (group) {
        await updateGroup({
          id: group.id,
          data: values,
        });
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Erro ao salvar grupo:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Criar Novo Grupo" : "Editar Grupo"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Crie um novo grupo para organizar usuários e permissões."
              : "Edite as informações do grupo."}
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
                    <Input placeholder="Nome do grupo" {...field} />
                  </FormControl>
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
                    <Input placeholder="Descrição do grupo (opcional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}