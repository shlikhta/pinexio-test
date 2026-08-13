import type { MetadataRoute } from 'next';

// Mirrors the DISABLE_INDEXING flag in config/meta.tsx — when set, block
// crawlers at the /robots.txt level too, not just via the meta tag.
const isIndexingDisabled = process.env.DISABLE_INDEXING === 'true';

export default function robots(): MetadataRoute.Robots {
  if (isIndexingDisabled) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
  };
}
