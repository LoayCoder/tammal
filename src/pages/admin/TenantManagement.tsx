import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTenants, type Tenant } from '@/hooks/useTenants';
import { TenantTable } from '@/components/tenants/TenantTable';
import { TenantSheet } from '@/components/tenants/TenantSheet';

const TENANT_STATUSES = ['all', 'active', 'trial', 'suspended', 'inactive'] as const;

export default function TenantManagement() {
  const { t } = useTranslation();
  const {
    tenants,
    isLoading,
    createTenant,
    updateTenant,
    deleteTenant,
    isCreating,
    isUpdating,
    isDeleting,
  } = useTenants();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenantToDelete, setTenantToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filtered tenants based on search and status
  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tenant.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tenants, searchQuery, statusFilter]);

  const handleCreate = () => {
    setSelectedTenant(null);
    setSheetOpen(true);
  };

  const handleEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setSheetOpen(true);
  };

  const handleDelete = (id: string) => {
    setTenantToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (tenantToDelete) {
      deleteTenant(tenantToDelete);
      setDeleteDialogOpen(false);
      setTenantToDelete(null);
    }
  };

  const handleSubmit = (data: any) => {
    if (selectedTenant) {
      updateTenant({ id: selectedTenant.id, ...data });
    } else {
      createTenant(data);
    }
    setSheetOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('tenants.title')}</h1>
          <p className="text-muted-foreground">{t('tenants.subtitle')}</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="me-2 h-4 w-4" />
          {t('tenants.addTenant')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>{t('tenants.title')}</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('tenants.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TENANT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`common.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TenantTable
            tenants={filteredTenants}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <TenantSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        tenant={selectedTenant}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tenants.deleteTenant')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tenants.confirmDelete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
