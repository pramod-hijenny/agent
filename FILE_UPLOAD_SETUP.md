# File Upload Setup with InsForge

This document describes the file upload functionality integrated into the app using InsForge Storage and the SDK.

## What's Been Set Up

### 1. **InsForge Storage Bucket**

- Created public bucket: `uploads`
- Files are publicly accessible at `https://mep6b952.us-east.insforge.app/storage/v1/object/public/uploads/{filename}`

### 2. **Environment Variables** (`.env`)

```
VITE_INSFORGE_URL=https://mep6b952.us-east.insforge.app
VITE_INSFORGE_ANON_KEY=<your-anon-key>
```

### 3. **SDK Integration** (`src/lib/insforge.ts`)

- Initializes the InsForge SDK client
- Used by all components for database and storage operations

### 4. **Core Files Created**

#### `src/hooks/useMediaAssets.ts`

Custom React hook for managing file uploads and retrieval.

**Features:**

- `uploadFile(file, agentId?)` — Upload file to storage and save metadata
- `deleteFile(assetId, objectKey)` — Delete from storage and database
- `fetchAssets()` — Refresh file list
- `files`, `loading`, `error` — State management

**Example:**

```typescript
const { files, uploadFile, deleteFile } = useMediaAssets();

// Upload a file
await uploadFile(file, "agent-uuid");

// Delete a file
await deleteFile(assetId, objectKey);
```

#### `src/components/FileUpload.tsx`

Drag-and-drop or click-to-upload component with preview.

**Props:**

- `agentId?` (optional) — Associate upload with an agent
- `onUploadComplete?` (optional) — Callback after successful upload

**Example:**

```tsx
<FileUpload agentId="some-uuid" onUploadComplete={() => console.log("Done!")} />
```

#### `src/components/MediaGallery.tsx`

Displays all uploaded files in a grid with download/delete actions.

**Features:**

- Responsive grid layout
- Image previews
- File type icons (PDF, documents)
- Download and delete buttons
- Shows file info (name, date)

**Example:**

```tsx
<MediaGallery />
```

#### `src/components/FileUploadExample.tsx`

Complete example showing both components together.

## Database Schema

### `media_assets` table

Stores file metadata after upload:

| Column          | Type      | Description                 |
| --------------- | --------- | --------------------------- |
| `id`            | uuid      | Primary key                 |
| `owner_user_id` | uuid      | User who uploaded           |
| `agent_id`      | uuid      | Associated agent (nullable) |
| `bucket`        | text      | Storage bucket name         |
| `object_key`    | text      | File path in storage        |
| `url`           | text      | Public URL                  |
| `content_type`  | text      | MIME type                   |
| `created_at`    | timestamp | Upload timestamp            |

## Usage Examples

### Basic File Upload

```tsx
import { FileUpload } from "@/components/FileUpload";

export function MyPage() {
  return <FileUpload />;
}
```

### Upload with Agent Association

```tsx
<FileUpload agentId={currentAgentId} />
```

### Custom Upload Handler

```tsx
import { useMediaAssets } from "@/hooks/useMediaAssets";

export function CustomUpload() {
  const { uploadFile, files, error } = useMediaAssets();

  const handleUpload = async (file: File) => {
    try {
      await uploadFile(file);
      console.log("Upload successful!");
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      {error && <p className="text-red-600">{error}</p>}
      <p>Total files: {files.length}</p>
    </div>
  );
}
```

### Full Page Example

```tsx
import { FileUploadExample } from "@/components/FileUploadExample";

export function FilesPage() {
  return <FileUploadExample />;
}
```

## File Type Support

- **Images**: PNG, JPG, GIF, WebP, SVG
- **Documents**: PDF
- Customize by modifying the `accept` attribute in `FileUpload.tsx`

## Security & Permissions

- Files are stored in a **public** bucket (world-readable)
- For private files, create a private bucket and add RLS policies
- User identity is stored in `media_assets.owner_user_id` for access control

## Next Steps

1. **Integrate into a form**: Add FileUpload to profile creation or agent setup forms
2. **Add image cropping**: Use a library like `react-easy-crop` before upload
3. **File size limits**: Add client-side validation in FileUpload component
4. **Batch uploads**: Extend `useMediaAssets` to handle multiple files
5. **Progress indication**: Add upload progress bar using `insforge.storage.upload()` stream

## Troubleshooting

**"Upload failed" error:**

- Check `.env` variables are correct
- Verify bucket exists: `npx @insforge/cli storage buckets`
- Check browser console for detailed error

**Files not appearing:**

- Verify RLS policies allow reading from `media_assets` table
- Check Storage bucket is public

**CORS issues:**

- InsForge handles CORS by default for public buckets
- No additional configuration needed

## API Reference

See the InsForge documentation:

- [Storage SDK Integration](https://docs.insforge.dev/storage/sdk-integration)
- [Database CRUD](https://docs.insforge.dev/database/sdk-integration)
