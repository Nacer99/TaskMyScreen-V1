import { useCallback, useState } from "react";
import { useAuth } from "@clerk/react";

export interface UploadResult {
  objectPath: string;
}

export class UploadError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "UploadError";
    this.status = status;
  }
}

export interface UseUploadOptions {
  onError?: (error: UploadError) => void;
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
          `${(import.meta.env.VITE_API_BASE_URL ?? "/tms-api").replace(/\/$/, "")}/storage/upload`,
          {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            body: form,
            credentials: "include",
          }
        );

        if (!res.ok) {
          // Surface the real status/message instead of a single generic
          // "upload failed" for every possible cause (misconfigured storage,
          // rejected file type, auth) — the previous version swallowed this,
          // making the actual cause of any future failure undiagnosable from
          // the UI alone.
          let message = `Upload failed with status ${res.status}`;
          try {
            const body = (await res.json()) as { message?: string };
            if (body?.message) message = body.message;
          } catch {
            // non-JSON error body — keep the generic message
          }
          throw new UploadError(message, res.status);
        }

        return (await res.json()) as UploadResult;
      } catch (err) {
        const uploadError =
          err instanceof UploadError ? err : new UploadError((err as Error)?.message ?? "Upload failed");
        options?.onError?.(uploadError);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [getToken, options]
  );

  return { uploadFile, isUploading };
}
