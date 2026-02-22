import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Clock, Phone, BarChart3 } from 'lucide-react';
import FirstAidersTab from '@/components/crisis/FirstAidersTab';
import SchedulesTab from '@/components/crisis/SchedulesTab';
import EmergencyContactsTab from '@/components/crisis/EmergencyContactsTab';
import RulesTab from '@/components/crisis/RulesTab';
import CrisisAnalyticsTab from '@/components/crisis/CrisisAnalyticsTab';

export default function CrisisSettings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('first-aiders');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('crisisSupport.admin.title')}</h1>
        <p className="text-muted-foreground">{t('crisisSupport.admin.subtitle')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="first-aiders" className="gap-1.5">
            <Users className="h-4 w-4" />
            {t('crisisSupport.admin.firstAidersTab')}
          </TabsTrigger>
          <TabsTrigger value="schedules" className="gap-1.5">
            <Clock className="h-4 w-4" />
            {t('crisisSupport.admin.schedulesTab')}
          </TabsTrigger>
          <TabsTrigger value="emergency" className="gap-1.5">
            <Phone className="h-4 w-4" />
            {t('crisisSupport.admin.emergencyTab')}
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-1.5">
            <Shield className="h-4 w-4" />
            {t('crisisSupport.admin.rulesTab')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            {t('crisisSupport.admin.analyticsTab')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="first-aiders"><FirstAidersTab /></TabsContent>
        <TabsContent value="schedules"><SchedulesTab /></TabsContent>
        <TabsContent value="emergency"><EmergencyContactsTab /></TabsContent>
        <TabsContent value="rules"><RulesTab /></TabsContent>
        <TabsContent value="analytics"><CrisisAnalyticsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
