"use client";

import { format } from "date-fns";
import { CircleOff, Edit, Plus, Shield, Trash, UserMinus, UserPlus } from "lucide-react";
import { useGroupHistory } from "@/hooks/groups/use-groups";
import { GroupChangeLog } from "@/services/group-service";

interface GroupHistoryProps {
  groupId: string;
}

function getActionIcon(action: GroupChangeLog["action"]) {
  switch (action) {
    case "created":
      return <Plus className="h-4 w-4" />;
    case "updated":
      return <Edit className="h-4 w-4" />;
    case "deleted":
      return <Trash className="h-4 w-4" />;
    case "member_added":
      return <UserPlus className="h-4 w-4" />;
    case "member_removed":
      return <UserMinus className="h-4 w-4" />;
    case "permission_changed":
      return <Shield className="h-4 w-4" />;
    default:
      return <CircleOff className="h-4 w-4" />;
  }
}

function getActionDescription(log: GroupChangeLog) {
  switch (log.action) {
    case "created":
      return "Grupo criado";
    case "updated":
      return `Grupo atualizado: ${
        log.details.name
          ? `nome alterado para "${log.details.name}"`
          : `descrição atualizada`
      }`;
    case "deleted":
      return "Grupo removido";
    case "member_added":
      return `${log.details.userEmail} adicionado como ${
        log.details.role === "admin" ? "administrador" : "membro"
      }`;
    case "member_removed":
      return `${log.details.userEmail} removido do grupo`;
    case "permission_changed":
      return `Permissões atualizadas para ${log.details.resource}: ${log.details.action}`;
    default:
      return "Ação desconhecida";
  }
}

export function GroupHistory({ groupId }: GroupHistoryProps) {
  const { data: history = [], isLoading } = useGroupHistory(groupId);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma alteração registrada
        </div>
      ) : (
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-2.5 top-4 bottom-2 w-px bg-border" />

          {history.map((log) => (
            <div key={log.id} className="flex gap-4 relative">
              {/* Icon */}
              <div className="h-5 w-5 rounded-full bg-background border flex items-center justify-center z-10">
                {getActionIcon(log.action)}
              </div>

              {/* Content */}
              <div className="flex-1 bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium">{getActionDescription(log)}</p>
                  <time className="text-sm text-muted-foreground">
                    {format(new Date(log.performedAt), "dd/MM/yyyy HH:mm")}
                  </time>
                </div>
                <p className="text-sm text-muted-foreground">
                  Por: {log.performedBy}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}