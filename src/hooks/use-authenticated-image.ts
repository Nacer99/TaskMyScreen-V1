import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";

export function useAuthenticatedImage(imageUrl?: string | null) {
  const { getToken } = useAuth();
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    console.log("AUTH IMAGE URL:", imageUrl);
    if (!imageUrl) {
      setSrc(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    (async () => {
      try {
        const token = await getToken();
        const resolvedUrl = imageUrl.startsWith("/api/storage/") ? `/tms-api${imageUrl.slice(4)}` : imageUrl;
        const response = await fetch(resolvedUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: "include",
        });

        console.log("AUTH IMAGE RESPONSE:", resolvedUrl, response.status); if (!response.ok) return;

        const blob = await response.blob(); console.log("AUTH IMAGE BLOB:", blob.type, blob.size);
        objectUrl = URL.createObjectURL(blob);

        if (!cancelled) setSrc(objectUrl);
      } catch {
        if (!cancelled) setSrc(null);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageUrl, getToken]);

  return src;
}
