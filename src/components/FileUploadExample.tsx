/**
 * Example usage of FileUpload and MediaGallery components
 *
 * Usage:
 * 1. Add to a route:
 *    import { FileUploadExample } from '@/components/FileUploadExample'
 *
 * 2. In your page:
 *    <FileUploadExample />
 *
 * 3. Or use components individually:
 *    <FileUpload agentId="some-uuid" />
 *    <MediaGallery />
 */

import { FileUpload } from './FileUpload'
import { MediaGallery } from './MediaGallery'
import { useState } from 'react'

export function FileUploadExample() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold mb-4">File Management</h1>
        <FileUpload onUploadComplete={() => setRefreshKey(k => k + 1)} />
      </div>

      <div key={refreshKey}>
        <MediaGallery />
      </div>
    </div>
  )
}
