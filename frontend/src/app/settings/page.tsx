"use client";

import { Settings, Key, Webhook, Bell, FileText } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SystemPreferences } from "@/components/settings/system-preferences";
import { ApiKeys } from "@/components/settings/api-keys";
import { WebhookSettings } from "@/components/settings/webhook-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { SystemLogs } from "@/components/settings/system-logs";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Configurações</h1>
            <p className="text-muted-foreground">
              Gerencie as configurações do sistema e integrações
            </p>
          </div>
        </div>

        <Tabs defaultValue="preferences" className="space-y-6">
          <TabsList>
            <TabsTrigger value="preferences">
              <Settings className="mr-2 h-4 w-4" />
              Preferências
            </TabsTrigger>
            <TabsTrigger value="api-keys">
              <Key className="mr-2 h-4 w-4" />
              Chaves de API
            </TabsTrigger>
            <TabsTrigger value="webhooks">
              <Webhook className="mr-2 h-4 w-4" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="mr-2 h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="logs">
              <FileText className="mr-2 h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preferences" className="space-y-4">
            <SystemPreferences />
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-4">
            <ApiKeys />
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4">
            <WebhookSettings />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <SystemLogs />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}