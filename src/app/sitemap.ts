import type { MetadataRoute } from 'next';
import { getAllDocs } from '@/lib/docs';
import { meta } from '../../config/meta';

// Mirrors the DISABLE_INDEXING flag in config/meta.tsx — no point listing
// pages in a sitemap when the site is telling crawlers to stay out.
const isIndexingDisabled = process.env.DISABLE_INDEXING === 'true';

export const SITE_URL = meta.metadataBase.origin;

export default function sitemap(): MetadataRoute.Sitemap {
  if (isIndexingDisabled) return [];

  const docEntries: MetadataRoute.Sitemap = getAllDocs().map((doc) => ({
    url: `${SITE_URL}${doc.url}`,
    lastModified: doc.date,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...docEntries,
  ];
}
