import { useMediaAssets } from "@/hooks/useMediaAssets";
import { X, Download } from "lucide-react";
import { useState } from "react";

export function MediaGallery() {
  const { files, loading, deleteFile } = useMediaAssets();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (loading) {
    return <div className="text-center py-8">Loading files...</div>;
  }

  if (files.length === 0) {
    return <div className="text-center py-12 text-gray-500">No files uploaded yet</div>;
  }

  const handleDelete = async (id: string, objectKey: string) => {
    setDeletingId(id);
    try {
      await deleteFile(id, objectKey);
    } finally {
      setDeletingId(null);
    }
  };

  const isImage = (contentType: string) => contentType.startsWith("image/");
  const isPdf = (contentType: string) => contentType === "application/pdf";

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Media Library</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {files.map((file) => (
          <div key={file.id} className="relative group">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {isImage(file.content_type) ? (
                <img
                  src={file.url}
                  alt={file.object_key}
                  className="w-full h-full object-cover group-hover:opacity-75 transition"
                />
              ) : isPdf(file.content_type) ? (
                <div className="w-full h-full flex items-center justify-center bg-red-50">
                  <span className="text-2xl">📄</span>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-50">
                  <span className="text-2xl">📎</span>
                </div>
              )}
            </div>

            {/* Overlay actions */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 rounded-lg">
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white text-gray-800 rounded hover:bg-gray-100"
                title="Download"
              >
                <Download size={16} />
              </a>
              <button
                onClick={() => handleDelete(file.id, file.object_key)}
                disabled={deletingId === file.id}
                className="p-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                title="Delete"
              >
                <X size={16} />
              </button>
            </div>

            {/* File info */}
            <p className="text-xs text-gray-600 mt-2 truncate">
              {file.object_key.split("-").slice(1).join("-")}
            </p>
            <p className="text-xs text-gray-400">
              {new Date(file.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
