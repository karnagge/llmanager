"use client";

import { useGroupPermissions, useUpdateGroupPermissions } from "@/hooks/groups/use-groups";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const RESOURCES = [
  {
    id: "users",
    name: "Usuários",
    description: "Gerenciamento de usuários do sistema",
  },
  {
    id: "groups",
    name: "Grupos",
    description: "Gerenciamento de grupos e suas permissões",
  },
  {
    id: "metrics",
    name: "Métricas",
    description: "Acesso às métricas e analytics do sistema",
  },
  {
    id: "quotas",
    name: "Quotas",
    description: "Gerenciamento de limites e quotas",
  },
  {
    id: "settings",
    name: "Configurações",
    description: "Configurações gerais do sistema",
  },
];

const ACTIONS = [
  { value: "read", label: "Visualizar" },
  { value: "write", label: "Editar" },
  { value: "delete", label: "Excluir" },
  { value: "manage", label: "Gerenciar" },
] as const;

interface GroupPermissionsProps {
  groupId: string;
}

export function GroupPermissions({ groupId }: GroupPermissionsProps) {
  const { data: permissions = [], isLoading } = useGroupPermissions(groupId);
  const { mutate: updatePermissions, isPending: isUpdating } = useUpdateGroupPermissions();

  // Track permissions in local state for better UX
  const [localPermissions, setLocalPermissions] = useState<
    Record<string, "read" | "write" | "delete" | "manage">
  >(() => {
    const permMap: Record<string, "read" | "write" | "delete" | "manage"> = {};
    permissions.forEach((p) => {
      permMap[p.resource] = p.action;
    });
    return permMap;
  });

  // Update local state whenever permissions data changes
  useState(() => {
    const permMap: Record<string, "read" | "write" | "delete" | "manage"> = {};
    permissions.forEach((p) => {
      permMap[p.resource] = p.action;
    });
    setLocalPermissions(permMap);
  });

  const handlePermissionChange = (resource: string, action: "read" | "write" | "delete" | "manage") => {
    setLocalPermissions((prev) => ({
      ...prev,
      [resource]: action,
    }));
  };

  const handleSave = () => {
    const permissions = Object.entries(localPermissions).map(([resource, action]) => ({
      resource,
      action,
    }));

    updatePermissions(
      { groupId, permissions },
      {
        onError: (error) => {
          console.error("Erro ao atualizar permissões:", error);
          // Reset to server state on error
          const permMap: Record<string, "read" | "write" | "delete" | "manage"> = {};
          permissions.forEach((p) => {
            permMap[p.resource] = p.action;
          });
          setLocalPermissions(permMap);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isUpdating}>
          {isUpdating ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      <div className="grid gap-4">
        {RESOURCES.map((resource) => (
          <Card key={resource.id}>
            <CardHeader>
              <CardTitle>{resource.name}</CardTitle>
              <CardDescription>{resource.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={localPermissions[resource.id] || "read"}
                onValueChange={(value: "read" | "write" | "delete" | "manage") =>
                  handlePermissionChange(resource.id, value)
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIONS.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}