import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload, X, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/auth/useProfile';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProfile: {
    full_name: string | null;
    avatar_url: string | null;
    email?: string;
  } | null;
  onSuccess?: () => void;
}

const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function EditProfileDialog({
  open,
  onOpenChange,
  currentProfile,
  onSuccess,
}: EditProfileDialogProps) {
  const { t } = useTranslation();
  const { updateProfile, uploadAvatar, removeAvatar, isUpdating } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const profileSchema = z.object({
    full_name: z
      .string()
      .trim()
      .min(1, t('profile.fullNameRequired'))
      .max(100, t('profile.fullNameTooLong')),
  });

  type ProfileFormData = z.infer<typeof profileSchema>;

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: currentProfile?.full_name || '',
    },
  });

  // Reset form when dialog opens or profile changes
  useEffect(() => {
    if (open && currentProfile) {
      form.reset({
        full_name: currentProfile.full_name || '',
      });
      setAvatarPreview(null);
      setAvatarFile(null);
      setAvatarRemoved(false);
    }
  }, [open, currentProfile, form]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      form.setError('full_name', { message: t('profile.invalidFileType') });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      form.setError('full_name', { message: t('profile.fileTooLarge') });
      return;
    }

    setAvatarFile(file);
    setAvatarRemoved(false);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setAvatarFile(null);
    setAvatarRemoved(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsUploading(true);
      let avatarUrl: string | null | undefined;

      // Handle avatar changes
      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile);
      } else if (avatarRemoved) {
        await removeAvatar();
        avatarUrl = null;
      }

      // Update profile
      await updateProfile({
        full_name: data.full_name,
        ...(avatarUrl !== undefined && { avatar_url: avatarUrl }),
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = (name: string | null, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.charAt(0).toUpperCase() || 'U';
  };

  const displayAvatar = avatarPreview || (!avatarRemoved ? currentProfile?.avatar_url : null);
  const isBusy = isUpdating || isUploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('profile.editProfile')}</DialogTitle>
          <DialogDescription>{t('profile.editProfileDescription')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <FormLabel>{t('profile.avatar')}</FormLabel>
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={displayAvatar || undefined} alt="Avatar" />
                  <AvatarFallback className="text-2xl">
                    {getInitials(form.watch('full_name') || currentProfile?.full_name, currentProfile?.email)}
                  </AvatarFallback>
                </Avatar>
                {displayAvatar && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -end-2 -top-2 h-6 w-6 rounded-full"
                    onClick={handleRemoveAvatar}
                    disabled={isBusy}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBusy}
                >
                  <Upload className="me-2 h-4 w-4" />
                  {displayAvatar ? t('profile.changeAvatar') : t('profile.uploadAvatar')}
                </Button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <p className="text-xs text-muted-foreground text-center">
                {t('profile.avatarHint')}
              </p>
            </div>

            {/* Full Name Field */}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('profile.fullName')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('profile.fullNamePlaceholder')}
                      {...field}
                      disabled={isBusy}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isBusy}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isBusy}>
                {isBusy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
