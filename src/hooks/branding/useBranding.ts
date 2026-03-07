import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import type { HSLColor } from '@/types/branding';

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
  const [isPending, setIsPending] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch branding config
  const fetchBranding = useCallback(async () => {
    if (!tenantId) {
      setIsPending(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('branding_config')
        .eq('id', tenantId)
        .single();

      if (error) throw error;

      let newConfig = { ...DEFAULT_BRANDING };

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

      setBranding(newConfig);

    } catch (error) {
      logger.error('useBranding', 'Error fetching branding', error);
    } finally {
      setIsPending(false);
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

      // Upload each file type if provided — all through brand-assets bucket
      if (files) {
        const fileTypes: AssetType[] = [
          'logo', 'logo_light', 'logo_dark',
          'favicon', 'icon_light', 'icon_dark',
          'pwa_icon', 'pwa_icon_light', 'pwa_icon_dark'
        ];

        for (const type of fileTypes) {
          const file = files[type];
          if (file) {
            const url = await uploadFile(file, type);
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
    isPending,
    isSaving,
    saveBranding,
    resetBranding,
    defaultBranding: DEFAULT_BRANDING
  };
}
