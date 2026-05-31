import { useState, useEffect } from 'react'
import { insforge } from '@/lib/insforge'

export interface MediaAsset {
  id: string
  owner_user_id: string
  agent_id: string | null
  bucket: string
  object_key: string
  url: string
  content_type: string
  created_at: string
}

export function useMediaAssets() {
  const [files, setFiles] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAssets = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await insforge.database
        .from('media_assets')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setFiles(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch files')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [])

  const uploadFile = async (file: File, agentId?: string) => {
    try {
      setError(null)
      const filename = `${Date.now()}-${file.name}`

      // Upload to storage
      const { data: uploadData, error: uploadError } = await insforge.storage
        .from('uploads')
        .upload(filename, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: publicUrl } = insforge.storage
        .from('uploads')
        .getPublicUrl(filename)

      // Save metadata to database
      const { error: dbError } = await insforge.database
        .from('media_assets')
        .insert([
          {
            bucket: 'uploads',
            object_key: filename,
            url: publicUrl?.publicUrl || '',
            content_type: file.type,
            agent_id: agentId || null,
          },
        ])

      if (dbError) throw dbError

      // Refresh files list
      await fetchAssets()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      throw err
    }
  }

  const deleteFile = async (assetId: string, objectKey: string) => {
    try {
      setError(null)

      // Delete from storage
      const { error: storageError } = await insforge.storage
        .from('uploads')
        .remove([objectKey])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await insforge.database
        .from('media_assets')
        .delete()
        .eq('id', assetId)

      if (dbError) throw dbError

      // Refresh files list
      await fetchAssets()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
      throw err
    }
  }

  return {
    files,
    loading,
    error,
    uploadFile,
    deleteFile,
    refreshAssets: fetchAssets,
  }
}
