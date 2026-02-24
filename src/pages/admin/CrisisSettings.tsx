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
      <div className="glass-card border-0 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-lg p-2"><Shield className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('crisisSupport.admin.title')}</h1>
            <p className="text-muted-foreground">{t('crisisSupport.admin.subtitle')}</p>
          </div>
        </div>
      </div>

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
