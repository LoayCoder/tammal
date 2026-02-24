import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantAssetsService, type TenantAssets, type AssetType } from '@/services/tenantAssets';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function useTenantAssets(tenantId?: string) {
    
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    // Fetch assets
    const { data: assets, isLoading } = useQuery({
        queryKey: ['tenant-assets', tenantId],
        queryFn: () => tenantAssetsService.getTenantAssets(),
        enabled: !!tenantId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Update assets mutation
    const updateMutation = useMutation({
        mutationFn: async (updates: Partial<TenantAssets>) => {
            if (!tenantId) throw new Error("No tenant ID");
            return tenantAssetsService.updateTenantAssets(tenantId, updates);
        },
        onSuccess: (updatedAssets) => {
            queryClient.setQueryData(['tenant-assets', tenantId], updatedAssets);
            toast.success(t('branding.savedSuccess'));
        },
        onError: (error) => {
            console.error('Failed to update assets:', error);
            toast.error(t('branding.savedError'));
        },
    });

    // Upload asset mutation
    const uploadMutation = useMutation({
        mutationFn: async ({ file, type }: { file: File; type: AssetType }) => {
            if (!tenantId) throw new Error("No tenant ID");
            const url = await tenantAssetsService.uploadAsset(tenantId, file, type);

            // Immediately update the DB record with new URL
            const updateData: Partial<TenantAssets> = {};
            switch (type) {
                case 'logo_light': updateData.logo_light_url = url; break;
                case 'logo_dark': updateData.logo_dark_url = url; break;
                case 'pwa_icon_light': updateData.pwa_icon_light_url = url; break;
                case 'pwa_icon_dark': updateData.pwa_icon_dark_url = url; break;
            }

            return tenantAssetsService.updateTenantAssets(tenantId, updateData);
        },
        onSuccess: (updatedAssets) => {
            queryClient.setQueryData(['tenant-assets', tenantId], updatedAssets);
            toast.success(t('branding.uploadSuccess'));
        },
        onError: (error) => {
            console.error('Failed to upload asset:', error);
            toast.error(t('branding.uploadError'));
        },
    });

    return {
        assets,
        isLoading,
        updateAssets: updateMutation.mutate,
        uploadAsset: uploadMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
        isUploading: uploadMutation.isPending,
    };
}
