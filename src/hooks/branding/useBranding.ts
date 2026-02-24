import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { tenantAssetsService } from '@/services/tenantAssets';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { HSLColor } from '@/components/branding/HSLColorPicker';

export type AssetType = 'logo' | 'logo_light' | 'logo_dark' | 'favicon' | 'icon_light' | 'icon_dark' | 'pwa_icon' | 'pwa_icon_light' | 'pwa_icon_dark';

export interface BrandingConfig {
  colors: {
    primary: HSLColor;
    secondary: HSLColor;
    accent: HSLColor;
  };
  logo_url: string | null;
  logo_light_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  icon_light_url: string | null;
  icon_dark_url: string | null;
  pwa_icon_url: string | null;
  // New strict keys
  pwa_icon_light_url?: string | null;
  pwa_icon_dark_url?: string | null;
}

const DEFAULT_BRANDING: BrandingConfig = {
  colors: {
    primary: { h: 221, s: 83, l: 53 },
    secondary: { h: 210, s: 40, l: 96 },
    accent: { h: 142, s: 76, l: 36 }
  },
  logo_url: null,
  logo_light_url: null,
  logo_dark_url: null,
  favicon_url: null,
  icon_light_url: null,
  icon_dark_url: null,
  pwa_icon_url: null,
  pwa_icon_light_url: null,
  pwa_icon_dark_url: null
};

export function useBranding(tenantId?: string) {
  const { t } = useTranslation();
  
  const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch branding config
  const fetchBranding = useCallback(async () => {
    if (!tenantId) {
      setIsLoading(false);
      return;
    }

    try {
      // Parallel fetch for speed
      const [brandingResponse, assetsResponse] = await Promise.all([
        supabase
          .from('tenants')
          .select('branding_config')
          .eq('id', tenantId)
          .single(),
        tenantAssetsService.getTenantAssets().catch(() => null)
      ]);

      const { data, error } = brandingResponse;
      const assets = assetsResponse;

      if (error) throw error;

      let newConfig = { ...DEFAULT_BRANDING };

      // Apply legacy/jsonb config
      if (data?.branding_config) {
        const config = data.branding_config as unknown as BrandingConfig;
        newConfig = {
          ...newConfig,
          ...config,
          colors: {
            ...newConfig.colors,
            ...(config.colors || {})
          }
        };
      }

      // Apply strict isolated assets (Override if present)
      if (assets) {
        if (assets.logo_light_url) newConfig.logo_light_url = assets.logo_light_url;
        if (assets.logo_dark_url) newConfig.logo_dark_url = assets.logo_dark_url;
        if (assets.pwa_icon_light_url) newConfig.pwa_icon_light_url = assets.pwa_icon_light_url;
        if (assets.pwa_icon_dark_url) newConfig.pwa_icon_dark_url = assets.pwa_icon_dark_url;

        // Backwards compatibility filling
        if (!newConfig.pwa_icon_url && assets.pwa_icon_light_url) {
          newConfig.pwa_icon_url = assets.pwa_icon_light_url;
        }
      }

      setBranding(newConfig);

    } catch (error) {
      console.error('Error fetching branding:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  // Upload file to storage
  const uploadFile = async (file: File, type: AssetType): Promise<string | null> => {
    if (!tenantId) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${type}.${fileExt}`;
    const filePath = `${tenantId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('brand-assets')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('brand-assets')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  // Save branding config
  const saveBranding = async (
    config: BrandingConfig,
    files?: Partial<Record<AssetType, File | null>>
  ) => {
    if (!tenantId) {
      toast.error('No tenant ID provided');
      return false;
    }

    setIsSaving(true);

    try {
      let updatedConfig = { ...config };

      // Upload each file type if provided
      if (files) {
        const fileTypes: AssetType[] = [
          'logo', 'logo_light', 'logo_dark',
          'favicon', 'icon_light', 'icon_dark',
          'pwa_icon', 'pwa_icon_light', 'pwa_icon_dark'
        ];

        const strictAssets: Partial<Record<AssetType, boolean>> = {
          'logo_light': true,
          'logo_dark': true,
          'pwa_icon_light': true,
          'pwa_icon_dark': true
        };

        for (const type of fileTypes) {
          const file = files[type];
          if (file) {
            let url: string | null = null;

            // Should this asset use strict tenant isolation?
            if (strictAssets[type]) {
              try {
                url = await tenantAssetsService.uploadAsset(tenantId, file, type as any);
                // Update the strict table immediately
                await tenantAssetsService.updateTenantAssets(tenantId, {
                  [`${type}_url`]: url
                });
              } catch (e) {
                console.error(`Failed to strictly upload ${type}`, e);
                // Fallback? No, strict failure should probably be noted, but for now we log.
              }
            } else {
              // Legacy upload
              url = await uploadFile(file, type);
            }

            if (url) {
              const urlKey = `${type}_url` as keyof BrandingConfig;
              (updatedConfig as any)[urlKey] = url;
            }
          }
        }
      }

      // Update tenant branding config (Legacy JSON column still updated for backward compat or non-strict fields)
      const { error } = await supabase
        .from('tenants')
        .update({ branding_config: JSON.parse(JSON.stringify(updatedConfig)) })
        .eq('id', tenantId);

      if (error) throw error;

      setBranding(updatedConfig);

      toast.success(t('branding.savedSuccess'));

      return true;
    } catch (error) {
      console.error('Error saving branding:', error);
      toast.error(t('branding.savedError'));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const resetBranding = () => {
    setBranding(DEFAULT_BRANDING);
  };

  return {
    branding,
    setBranding,
    isLoading,
    isSaving,
    saveBranding,
    resetBranding,
    defaultBranding: DEFAULT_BRANDING
  };
}
