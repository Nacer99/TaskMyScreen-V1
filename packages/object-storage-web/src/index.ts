import { useCallback, useState } from "react";
import { useAuth } from "@clerk/react";

export interface UploadResult {
  objectPath: string;
}

export interface UseUploadOptions {
  onError?: (error: unknown) => void;
}

/**
 * Uploads a file to the backend's object storage endpoint
 * (POST /api/storage/upload, backed by Google Cloud Storage —
 * see public/apps/api-server/src/routes/storage.ts).
 *
 * Returns the object's storage path (not a full URL); callers prefix it
 * with `/api/storage` to build the servable image URL, matching what the
 * backend's GET /api/storage/:path passthrough route expects.
 */
export function useUpload(options?: UseUploadOptions) {
  const { getToken } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      setIsUploading(true);
      try {
        const token = await getToken();
        const form = new FormData();
        form.append("file", file);

        const res = await fetch(
          `${(import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "")}/storage/upload`,
          {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            body: form,
            credentials: "include",
          }
        );

        if (!res.ok) {
          throw new Error(`Upload failed with status ${res.status}`);
        }

        return (await res.json()) as UploadResult;
      } catch (err) {
        options?.onError?.(err);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [getToken, options]
  );

  return { uploadFile, isUploading };
}
