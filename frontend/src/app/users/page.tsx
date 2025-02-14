"use client";

import { useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { User } from "@/lib/types";
import { Plus, MoreVertical, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { type UserFormData } from "@/lib/schemas/user";
import { UserService } from "@/services/user-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const queryClient = useQueryClient();

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users", page],
    queryFn: () => UserService.list({ page, limit }),
  });

  const handleCreateUser = async (data: UserFormData) => {
    try {
      await UserService.create(data);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      // TODO: Implementar tratamento de erro
    }
  };

  const handleUpdateUser = async (userId: string, data: UserFormData) => {
    try {
      await UserService.update(userId, data);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      // TODO: Implementar tratamento de erro
    }
  };

  const handleSearch = useCallback(async (search: string) => {
    try {
      await queryClient.fetchQuery({
        queryKey: ["users", page],
        queryFn: () => UserService.list({ page, limit, search }),
      });
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    }
  }, [page, queryClient]);

  const columns: Array<{
    key: keyof User;
    header: string;
    render?: (value: string, item: User) => React.ReactNode;
  }> = [
    {
      key: "name",
      header: "Nome",
    },
    {
      key: "email",
      header: "Email",
    },
    {
      key: "role",
      header: "Função",
      render: (value, item) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            item.role === "ADMIN"
              ? "bg-purple-100 text-purple-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {item.role === "ADMIN" ? "Administrador" : "Usuário"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Data de Criação",
      render: (value) =>
        format(new Date(value), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
    },
    {
      key: "id",
      header: "",
      render: (_, user) => (
        <UserFormDialog
          trigger={
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          }
          user={user}
          onSubmit={(data) => handleUpdateUser(user.id, data)}
        />
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Usuários</h1>
          <UserFormDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            }
            onSubmit={handleCreateUser}
          />
        </div>

        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : (
          <DataTable<User>
            data={usersData?.data.data ?? []}
            columns={columns}
            onSearch={handleSearch}
            pagination={{
              total: usersData?.data.total ?? 0,
              page,
              limit,
              onPageChange: setPage,
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}