import { ModernLayout } from "@/components/ModernLayout";
import { UserManagementNew } from "@/components/UserManagementNew";
import { RolesManager } from "@/components/RolesManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield } from "lucide-react";

export default function AdminUsers() {
  return (
    <ModernLayout
      title="Gestão de Usuários e Funções"
      subtitle="Gerencie usuários, funções e permissões do sistema"
    >
      <Tabs defaultValue="users" className="w-full space-y-5">
        <TabsList className="inline-flex h-auto w-auto max-w-full flex-wrap gap-1 rounded-2xl border border-border bg-card p-1 shadow-sm">
          <TabsTrigger value="users" className="min-h-9 rounded-full px-4 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="roles" className="min-h-9 rounded-full px-4 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Shield className="h-4 w-4" />
            Funções
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-0">
          <UserManagementNew />
        </TabsContent>

        <TabsContent value="roles" className="mt-0">
          <RolesManager />
        </TabsContent>
      </Tabs>
    </ModernLayout>
  );
}