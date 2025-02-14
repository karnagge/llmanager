"use client";

import { useState } from "react";
import { Plus, UserX } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import {
  useGroupMembers,
  useAddGroupMember,
  useRemoveGroupMember,
  useUpdateMemberRole,
} from "@/hooks/groups/use-groups";

interface GroupMembersProps {
  groupId: string;
}

interface AddMemberFormValues {
  userId: string;
  role: "admin" | "member";
}

export function GroupMembers({ groupId }: GroupMembersProps) {
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const { data: members = [], isLoading } = useGroupMembers(groupId);
  const { mutate: addMember, isPending: isAddingMember } = useAddGroupMember();
  const { mutate: removeMember } = useRemoveGroupMember();
  const { mutate: updateRole } = useUpdateMemberRole();

  const form = useForm<AddMemberFormValues>({
    defaultValues: {
      role: "member",
    },
  });

  const onSubmit = (values: AddMemberFormValues) => {
    addMember(
      { groupId, data: values },
      {
        onSuccess: () => {
          setAddMemberOpen(false);
          form.reset();
        },
      }
    );
  };

  const handleRemoveMember = (userId: string) => {
    if (confirm("Tem certeza que deseja remover este membro?")) {
      removeMember({ groupId, userId });
    }
  };

  const handleRoleChange = (userId: string, newRole: "admin" | "member") => {
    updateRole({ groupId, userId, role: newRole });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddMemberOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Membro
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Adicionado em</TableHead>
              <TableHead>Adicionado por</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                </TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum membro encontrado
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.userId}</TableCell>
                  <TableCell>
                    <Select
                      value={member.role}
                      onValueChange={(value: "admin" | "member") =>
                        handleRoleChange(member.userId, value)
                      }
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Membro</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {format(new Date(member.addedAt), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell>{member.addedBy}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.userId)}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Membro</DialogTitle>
            <DialogDescription>
              Adicione um novo membro ao grupo e defina sua função.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuário</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um usuário" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* TODO: Add user list */}
                          <SelectItem value="user1">Usuário 1</SelectItem>
                          <SelectItem value="user2">Usuário 2</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma função" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Membro</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddMemberOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isAddingMember}>
                  {isAddingMember ? "Adicionando..." : "Adicionar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}