import { useRef, useState } from 'react'
import { useMediaAssets } from '@/hooks/useMediaAssets'
import { Upload, X } from 'lucide-react'

interface FileUploadProps {
  agentId?: string
  onUploadComplete?: () => void
}

export function FileUpload({ agentId, onUploadComplete }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { uploadFile, error, files } = useMediaAssets()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      await uploadFile(file, agentId)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onUploadComplete?.()
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Upload size={18} />
          {isUploading ? 'Uploading...' : 'Upload File'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
          accept="image/*,application/pdf"
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3 text-sm">Uploaded Files</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {files.map((file) => (
              <FilePreview key={file.id} file={file} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FilePreview({ file }: { file: any }) {
  const { deleteFile } = useMediaAssets()
  const [isDeleting, setIsDeleting] = useState(false)

  const isImage = file.content_type.startsWith('image/')

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteFile(file.id, file.object_key)
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="relative group">
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block aspect-square bg-gray-100 rounded-lg overflow-hidden hover:shadow-md transition"
      >
        {isImage ? (
          <img
            src={file.url}
            alt={file.object_key}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-xs text-gray-600 text-center px-2">
              {file.object_key}
            </span>
          </div>
        )}
      </a>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
        title="Delete file"
      >
        <X size={16} />
      </button>
    </div>
  )
}
