

# Full Avatar Upload System with Image Cropping

## Problem Summary

### Issue 1: Storage RLS Policy Blocking Uploads
The upload fails with error: `"new row violates row-level security policy"`

**Root Cause**: Current RLS policy structure:
```sql
-- Current INSERT policy:
((auth.uid())::text = (storage.foldername(name))[1])
```
This requires:
- Files must be in a folder named with the uploader's user ID
- Only the file owner can upload

**But the code does**:
```typescript
const filePath = `${user.user_id}-${Date.now()}.${fileExt}`;  // Flat path, no folder
```

**Problems**:
1. Path structure doesn't match policy expectation (no folder)
2. Admins uploading for OTHER users will never match `auth.uid()`

### Issue 2: No Image Cropping
User requested full photo setup with crop functionality for proper avatar sizing.

---

## Solution Architecture

### Part 1: Fix Storage RLS Policies

Update storage policies to:
1. Allow users to upload their own avatars (current behavior)
2. Allow `super_admin` and `tenant_admin` to upload avatars for any user
3. Use flat file paths (no folder structure needed)

**New Policy Logic**:
```sql
-- INSERT: Allow if user owns the file OR is admin
((bucket_id = 'avatars') AND (
  (auth.uid()::text = split_part(name, '-', 1)) -- File starts with uploader's ID
  OR has_role(auth.uid(), 'super_admin')
  OR (has_role(auth.uid(), 'tenant_admin') AND EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.user_id::text = split_part(name, '-', 1)
    AND p.tenant_id = get_user_tenant_id(auth.uid())
  ))
))
```

### Part 2: Install Image Cropping Library

Use **react-easy-crop** - popular, maintained, TypeScript support, works with circles.

```bash
npm install react-easy-crop
```

### Part 3: Create AvatarCropperDialog Component

A new modal component that:
1. Accepts an image file/URL
2. Displays circular crop area (for avatar)
3. Allows zoom and pan
4. Outputs cropped image as Blob for upload

---

## Detailed Implementation

### Step 1: Database Migration - Fix Storage Policies

Drop and recreate avatar storage policies with admin support:

```sql
-- Drop existing avatar policies
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- New INSERT policy: User owns file OR admin
CREATE POLICY "Avatar upload policy" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND (
    auth.uid()::text = split_part(name, '-', 1)
    OR has_role(auth.uid(), 'super_admin')
    OR (
      has_role(auth.uid(), 'tenant_admin') 
      AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id::text = split_part(name, '-', 1)
        AND tenant_id = get_user_tenant_id(auth.uid())
      )
    )
  )
);

-- Similar UPDATE and DELETE policies for admins
```

### Step 2: Create AvatarCropperDialog Component

New file: `src/components/ui/avatar-cropper-dialog.tsx`

Features:
- Circular crop stencil (1:1 aspect ratio)
- Zoom slider control
- Pan with mouse/touch
- Preview of final result
- Outputs cropped image as Blob

```text
+------------------------------------------+
| Crop Profile Photo                   [X] |
+------------------------------------------+
|                                          |
|     +--------------------------+         |
|     |                          |         |
|     |    [Image with Crop      |         |
|     |     Circle Overlay]      |         |
|     |         ⊕ ⊖              |         |
|     +--------------------------+         |
|                                          |
|     Zoom: [====●==========]              |
|                                          |
|     Preview:                             |
|       +------+                           |
|       |Avatar|                           |
|       +------+                           |
|                                          |
+------------------------------------------+
|                    [Cancel] [Apply Crop] |
+------------------------------------------+
```

### Step 3: Update UserEditDialog

Integrate the cropper:
1. When user selects file → Open cropper dialog
2. User adjusts crop → Click "Apply"
3. Cropped image blob → Upload to storage
4. Display cropped preview

Flow:
```
Select File → Cropper Dialog → Crop → Upload → Update Avatar URL
```

### Step 4: Add Helper Function for Cropped Image

Create utility function to convert crop coordinates to actual image blob:

```typescript
// src/lib/cropImage.ts
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    pixelCrop.width, pixelCrop.height
  );
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.95);
  });
}
```

### Step 5: Update Localization

Add new translation keys for cropper:

**English**:
```json
"cropPhoto": "Crop Photo",
"cropPhotoDescription": "Adjust your photo to fit the avatar area",
"zoom": "Zoom",
"applyCrop": "Apply Crop",
"rotation": "Rotation"
```

**Arabic**:
```json
"cropPhoto": "قص الصورة",
"cropPhotoDescription": "اضبط صورتك لتناسب منطقة الصورة الشخصية",
"zoom": "تكبير",
"applyCrop": "تطبيق القص",
"rotation": "التدوير"
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| Database Migration | Create | Fix storage RLS for admin uploads |
| `package.json` | Modify | Add `react-easy-crop` dependency |
| `src/lib/cropImage.ts` | Create | Utility to generate cropped image blob |
| `src/components/ui/avatar-cropper-dialog.tsx` | Create | Image cropper modal component |
| `src/components/users/UserEditDialog.tsx` | Modify | Integrate cropper dialog |
| `src/locales/en.json` | Modify | Add cropper translations |
| `src/locales/ar.json` | Modify | Add Arabic cropper translations |

---

## Technical Flow After Implementation

```text
1. Admin clicks "Upload Photo" in UserEditDialog
2. File input opens, admin selects image file
3. AvatarCropperDialog opens with image preview
4. Admin adjusts zoom/position for circular crop
5. Admin clicks "Apply Crop"
6. Cropped blob is generated (JPEG, ~200x200px)
7. Blob uploaded to storage: `{target_user_id}-{timestamp}.jpeg`
8. RLS allows upload (admin check passes)
9. Avatar URL updated in form state
10. On save, profile updated with new avatar_url
```

---

## Security Considerations

1. **RLS Policies**: Admins can only upload for users in their tenant
2. **File Validation**: Image type and size checked before upload
3. **File Naming**: Target user ID in filename prevents overwrites
4. **Bucket Settings**: Already has MIME type restrictions (jpeg, png, webp, gif)

