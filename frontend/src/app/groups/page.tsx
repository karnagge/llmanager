"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGroups } from "@/hooks/groups/use-groups";
import { GroupFormDialog } from "@/components/groups/group-form-dialog";
import { format } from "date-fns";

export default function GroupsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const router = useRouter();
  const { data: groups, isLoading } = useGroups();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Grupos</h1>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Grupo
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Membros</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Última atualização</TableHead>
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
              ) : groups?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum grupo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                groups?.map((group) => (
                  <TableRow
                    key={group.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/groups/${group.id}`)}
                  >
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>{group.description || "-"}</TableCell>
                    <TableCell>{group.membersCount}</TableCell>
                    <TableCell>
                      {format(new Date(group.createdAt), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      {format(new Date(group.updatedAt), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <GroupFormDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          mode="create"
        />
      </div>
    </DashboardLayout>
  );
}