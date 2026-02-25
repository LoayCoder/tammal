import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminRedemptionOptions, useAdminRedemptionRequests } from '@/hooks/recognition/useRedemption';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, Check, X } from 'lucide-react';
import { format } from 'date-fns';

const CATEGORIES = ['time_off', 'cash_equivalent', 'experience', 'charity', 'merchandise'];

export default function RedemptionManagement() {
  const { t } = useTranslation();
  const { options, isLoading: optLoading, createOption, deleteOption } = useAdminRedemptionOptions();
  const { requests, isLoading: reqLoading, updateRequest } = useAdminRedemptionRequests();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', name_ar: '', description: '', description_ar: '', category: 'merchandise', points_cost: 100, is_active: true, max_per_year: null as number | null, min_tenure_months: null as number | null, fulfillment_config: {} });

  if (optLoading || reqLoading) {
    return <div className="space-y-4 p-6"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  const handleCreate = () => {
    createOption.mutate(form as any, { onSuccess: () => setShowCreate(false) });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('recognition.points.managementTitle')}</h1>
          <p className="text-muted-foreground">{t('recognition.points.managementSubtitle')}</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 me-2" />{t('recognition.points.addOption')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('recognition.points.addOption')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>{t('recognition.points.optionName')}</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><Label>{t('recognition.points.optionNameAr')}</Label><Input value={form.name_ar} onChange={e => setForm(p => ({ ...p, name_ar: e.target.value }))} dir="rtl" /></div>
              </div>
              <div><Label>{t('recognition.points.optionDescription')}</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('recognition.points.category')}</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{t(`recognition.points.categories.${c}`, c)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>{t('recognition.points.pointsCost')}</Label><Input type="number" value={form.points_cost} onChange={e => setForm(p => ({ ...p, points_cost: parseInt(e.target.value) || 0 }))} /></div>
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={!form.name || createOption.isPending}>
                {t('common.create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="options">
        <TabsList>
          <TabsTrigger value="options">{t('recognition.points.catalogTab')}</TabsTrigger>
          <TabsTrigger value="requests">{t('recognition.points.requestsTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="options">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('recognition.points.optionName')}</TableHead>
                    <TableHead>{t('recognition.points.category')}</TableHead>
                    <TableHead className="text-end">{t('recognition.points.pointsCost')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {options.map(opt => (
                    <TableRow key={opt.id}>
                      <TableCell className="font-medium">{opt.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{t(`recognition.points.categories.${opt.category}`, opt.category)}</Badge>
                      </TableCell>
                      <TableCell className="text-end">{opt.points_cost}</TableCell>
                      <TableCell><Badge variant={opt.is_active ? 'default' : 'secondary'}>{opt.is_active ? t('common.active') : t('common.inactive')}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => deleteOption.mutate(opt.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('recognition.points.date')}</TableHead>
                    <TableHead>{t('recognition.points.reward')}</TableHead>
                    <TableHead className="text-end">{t('recognition.points.pointsSpent')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map(req => (
                    <TableRow key={req.id}>
                      <TableCell className="text-sm">{format(new Date(req.requested_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="font-medium">{(req.redemption_options as any)?.name || req.option_id}</TableCell>
                      <TableCell className="text-end">{req.points_spent}</TableCell>
                      <TableCell>
                        <Badge variant={req.status === 'fulfilled' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'}>
                          {t(`recognition.points.requestStatuses.${req.status}`, req.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {req.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => updateRequest.mutate({ id: req.id, status: 'approved' })}>
                              <Check className="h-4 w-4 text-chart-2" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => updateRequest.mutate({ id: req.id, status: 'rejected', rejection_reason: 'Declined by admin' })}>
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                        {req.status === 'approved' && (
                          <Button variant="ghost" size="sm" onClick={() => updateRequest.mutate({ id: req.id, status: 'fulfilled' })}>
                            {t('recognition.points.markFulfilled')}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
