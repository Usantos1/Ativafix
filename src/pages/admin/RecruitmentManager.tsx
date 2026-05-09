import { useState } from "react";
import { ModernLayout } from "@/components/ModernLayout";
import { AdminInterviewsManager } from "@/pages/AdminInterviews";
import { AdminJobSurveysManager } from "@/components/AdminJobSurveysManager";
import TalentBank from "@/pages/admin/TalentBank";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, UserPlus, Video } from "lucide-react";

interface RecruitmentManagerProps {
  initialTab?: "surveys" | "interviews" | "talent";
}

export default function RecruitmentManager({ initialTab = "surveys" }: RecruitmentManagerProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  return (
    <ModernLayout
      title="Recrutamento e Seleção"
      subtitle="Gerencie formulários de vagas e entrevistas"
    >
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="inline-flex h-auto w-auto max-w-full flex-wrap gap-1 rounded-2xl border border-border bg-card p-1 shadow-sm">
            <TabsTrigger value="surveys" className="min-h-9 rounded-full px-4 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="h-4 w-4" />
              Formulários de Vaga
            </TabsTrigger>
            <TabsTrigger value="interviews" className="min-h-9 rounded-full px-4 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Video className="h-4 w-4" />
              Entrevistas
            </TabsTrigger>
            <TabsTrigger value="talent" className="min-h-9 rounded-full px-4 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <UserPlus className="h-4 w-4" />
              Banco de Talentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="surveys" className="mt-4">
            <AdminJobSurveysManager />
          </TabsContent>

          <TabsContent value="interviews" className="mt-4">
            <AdminInterviewsManager />
          </TabsContent>

          <TabsContent value="talent" className="mt-4">
            <TalentBank embedded />
          </TabsContent>
        </Tabs>
      </div>
    </ModernLayout>
  );
}
