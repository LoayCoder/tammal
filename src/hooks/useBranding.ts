import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import type { HSLColor } from '@/components/branding/HSLColorPicker';

export interface BrandingConfig {
  colors: {
    primary: HSLColor;
    secondary: HSLColor;
    accent: HSLColor;
  };
  logo_url: string | null;
  favicon_url: string | null;
}

const DEFAULT_BRANDING: BrandingConfig = {
  colors: {
    primary: { h: 221, s: 83, l: 53 },
    secondary: { h: 210, s: 40, l: 96 },
    accent: { h: 142, s: 76, l: 36 }
  },
  logo_url: null,
  favicon_url: null
};

export function useBranding(tenantId?: string) {
  const { t } = useTranslation();
  const { toast } = useToast();
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
      const { data, error } = await supabase
        .from('tenants')
        .select('branding_config')
        .eq('id', tenantId)
        .single();

      if (error) throw error;

      if (data?.branding_config) {
        const config = data.branding_config as unknown as BrandingConfig;
        setBranding({
          ...DEFAULT_BRANDING,
          ...config,
          colors: {
            ...DEFAULT_BRANDING.colors,
            ...(config.colors || {})
          }
        });
      }
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
  const uploadFile = async (file: File, type: 'logo' | 'favicon'): Promise<string | null> => {
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
    logoFile?: File | null,
    faviconFile?: File | null
  ) => {
    if (!tenantId) {
      toast({
        title: t('branding.savedError'),
        description: 'No tenant ID provided',
        variant: 'destructive'
      });
      return false;
    }

    setIsSaving(true);

    try {
      let updatedConfig = { ...config };

      // Upload logo if provided
      if (logoFile) {
        const logoUrl = await uploadFile(logoFile, 'logo');
        updatedConfig.logo_url = logoUrl;
      }

      // Upload favicon if provided
      if (faviconFile) {
        const faviconUrl = await uploadFile(faviconFile, 'favicon');
        updatedConfig.favicon_url = faviconUrl;
      }

      // Update tenant branding config
      const { error } = await supabase
        .from('tenants')
        .update({ branding_config: JSON.parse(JSON.stringify(updatedConfig)) })
        .eq('id', tenantId);

      if (error) throw error;

      setBranding(updatedConfig);

      toast({
        title: t('branding.savedSuccess'),
      });

      return true;
    } catch (error) {
      console.error('Error saving branding:', error);
      toast({
        title: t('branding.savedError'),
        variant: 'destructive'
      });
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
