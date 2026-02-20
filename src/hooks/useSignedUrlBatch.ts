import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SignedUrlMap = Map<string, string>; // asset.id → signedUrl

interface AssetRef {
  id: string;
  storage_path: string | null | undefined;
  storage_bucket?: string | null;
  thumb_url?: string | null;
  preview_url?: string | null;
  og_image_url?: string | null;
}

/**
 * Pre-fetches signed URLs for ALL private assets in one batch per bucket,
 * eliminating the N individual createSignedUrl calls that cause per-card delays.
 *
 * Assets that already have a public URL (thumb_url / og_image_url / preview_url)
 * are skipped — those don't need a signed URL.
 *
 * Returns a stable Map<assetId, resolvedUrl> that is updated once per assets list change.
 */
export function useSignedUrlBatch(
  assets: AssetRef[],
  ttlSeconds = 3600
): SignedUrlMap {
  const [urlMap, setUrlMap] = useState<SignedUrlMap>(new Map());
  // Track the last assets fingerprint to avoid re-fetching unnecessarily
  const fingerprintRef = useRef<string>("");

  useEffect(() => {
    if (!assets || assets.length === 0) return;

    // Fingerprint = sorted asset IDs joined
    const fingerprint = assets
      .map((a) => a.id)
      .sort()
      .join(",");
    if (fingerprint === fingerprintRef.current) return;
    fingerprintRef.current = fingerprint;

    // Seed the map with public URLs immediately (zero delay)
    const immediate = new Map<string, string>();
    assets.forEach((a) => {
      const pub = a.thumb_url || a.og_image_url || a.preview_url;
      if (pub) immediate.set(a.id, pub);
    });
    setUrlMap(immediate);

    // Collect private assets that need signed URLs (no public URL, have storage_path)
    const needsSigned = assets.filter(
      (a) =>
        a.storage_path &&
        !a.thumb_url &&
        !a.og_image_url &&
        !a.preview_url
    );

    if (needsSigned.length === 0) return;

    // Group by bucket
    const byBucket = new Map<string, AssetRef[]>();
    needsSigned.forEach((a) => {
      const bucket = a.storage_bucket || "project-files";
      if (!byBucket.has(bucket)) byBucket.set(bucket, []);
      byBucket.get(bucket)!.push(a);
    });

    // Batch fetch per bucket in parallel
    const fetchAll = async () => {
      const results = new Map<string, string>(immediate);

      await Promise.all(
        [...byBucket.entries()].map(async ([bucket, bucketAssets]) => {
          const paths = bucketAssets.map((a) => a.storage_path as string);
          try {
            const { data, error } = await supabase.storage
              .from(bucket)
              .createSignedUrls(paths, ttlSeconds);
            if (error || !data) return;
            data.forEach((item) => {
              if (item.signedUrl && item.path) {
                const asset = bucketAssets.find(
                  (a) => a.storage_path === item.path
                );
                if (asset) results.set(asset.id, item.signedUrl);
              }
            });
          } catch (e) {
            console.warn("[useSignedUrlBatch] batch error for bucket", bucket, e);
          }
        })
      );

      setUrlMap(results);
    };

    fetchAll();
  }, [assets, ttlSeconds]);

  return urlMap;
}
