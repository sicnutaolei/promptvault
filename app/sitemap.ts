import type { MetadataRoute } from 'next';
import { listPublicPromptEntries } from '@/lib/queries';
import { siteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const prompts = listPublicPromptEntries();

  return [
    {
      url: `${base}/`,
      lastModified: prompts[0]?.updated_at ? new Date(prompts[0].updated_at) : new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...prompts.map((p) => ({
      url: `${base}/p/${p.id}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
