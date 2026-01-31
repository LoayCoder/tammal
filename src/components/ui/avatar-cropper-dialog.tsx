import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ZoomIn, RotateCw } from 'lucide-react';
import { getCroppedImg, type PixelCrop } from '@/lib/cropImage';

interface AvatarCropperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
}

export function AvatarCropperDialog({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
}: AvatarCropperDialogProps) {
  const { t } = useTranslation();
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onCropChange = useCallback((newCrop: Point) => {
    setCrop(newCrop);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onRotationChange = useCallback((newRotation: number) => {
    setRotation(newRotation);
  }, []);

  const onCropAreaChange = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
    
    // Generate preview (debounced internally by react-easy-crop)
    generatePreview(croppedAreaPixels);
  }, [imageSrc, rotation]);

  const generatePreview = async (pixelCrop: PixelCrop) => {
    try {
      const blob = await getCroppedImg(imageSrc, pixelCrop, rotation, 100);
      const url = URL.createObjectURL(blob);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (error) {
      console.error('Failed to generate preview:', error);
    }
  };

  const handleApplyCrop = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, 200);
      onCropComplete(croppedBlob);
      handleClose();
    } catch (error) {
      console.error('Failed to crop image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    // Reset state
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onOpenChange(false);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('profile.cropPhoto')}</DialogTitle>
          <DialogDescription>{t('profile.cropPhotoDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Cropper Area */}
          <div className="relative h-64 w-full overflow-hidden rounded-lg bg-muted">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropAreaChange}
            />
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom Control */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4 text-muted-foreground" />
                <Label>{t('profile.zoom')}</Label>
              </div>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(values) => onZoomChange(values[0])}
              />
            </div>

            {/* Rotation Control */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RotateCw className="h-4 w-4 text-muted-foreground" />
                <Label>{t('profile.rotation')}</Label>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  value={[rotation]}
                  min={0}
                  max={360}
                  step={1}
                  onValueChange={(values) => onRotationChange(values[0])}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRotate}
                  className="shrink-0"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-4">
            <Label className="text-muted-foreground">{t('profile.preview')}:</Label>
            <Avatar className="h-16 w-16 border-2 border-border">
              <AvatarImage src={previewUrl || undefined} />
            </Avatar>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button 
            type="button" 
            onClick={handleApplyCrop} 
            disabled={isProcessing || !croppedAreaPixels}
          >
            {isProcessing ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              t('profile.applyCrop')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
