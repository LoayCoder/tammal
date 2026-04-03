import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Clock, Phone, Activity } from 'lucide-react';
import { PageHeader } from '@/components/system';
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
      <PageHeader
        icon={<Shield className="h-5 w-5 text-primary" />}
        title={t('crisisSupport.admin.title')}
        subtitle={t('crisisSupport.admin.subtitle')}
        variant="card"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass-tabs">
          <TabsTrigger value="first-aiders" className="gap-1.5 rounded-xl">
            <Users className="h-4 w-4" />
            {t('crisisSupport.admin.firstAidersTab')}
          </TabsTrigger>
          <TabsTrigger value="schedules" className="gap-1.5 rounded-xl">
            <Clock className="h-4 w-4" />
            {t('crisisSupport.admin.schedulesTab')}
          </TabsTrigger>
          <TabsTrigger value="emergency" className="gap-1.5 rounded-xl">
            <Phone className="h-4 w-4" />
            {t('crisisSupport.admin.emergencyTab')}
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-1.5 rounded-xl">
            <Shield className="h-4 w-4" />
            {t('crisisSupport.admin.rulesTab')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5 rounded-xl">
            <Activity className="h-4 w-4" />
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
