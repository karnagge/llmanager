"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Shield, History } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGroup } from "@/hooks/groups/use-groups";
import { GroupFormDialog } from "@/components/groups/group-form-dialog";
import { GroupMembers } from "@/components/groups/group-members";
import { GroupPermissions } from "@/components/groups/group-permissions";
import { GroupHistory } from "@/components/groups/group-history";
import { useState } from "react";

interface GroupDetailPageProps {
  params: {
    id: string;
  };
}

export default function GroupDetailPage({ params }: GroupDetailPageProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const router = useRouter();
  const { data: group, isLoading } = useGroup(params.id);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!group) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <p className="text-lg text-muted-foreground">Grupo não encontrado</p>
          <Button onClick={() => router.push("/groups")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para lista
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/groups")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-semibold">{group.name}</h1>
            </div>
            {group.description && (
              <p className="text-muted-foreground">{group.description}</p>
            )}
          </div>
          <Button onClick={() => setEditDialogOpen(true)}>Editar Grupo</Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="members" className="space-y-6">
          <TabsList>
            <TabsTrigger value="members">
              <Users className="mr-2 h-4 w-4" />
              Membros
            </TabsTrigger>
            <TabsTrigger value="permissions">
              <Shield className="mr-2 h-4 w-4" />
              Permissões
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="mr-2 h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <GroupMembers groupId={group.id} />
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <GroupPermissions groupId={group.id} />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <GroupHistory groupId={group.id} />
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <GroupFormDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          mode="edit"
          group={group}
        />
      </div>
    </DashboardLayout>
  );
}