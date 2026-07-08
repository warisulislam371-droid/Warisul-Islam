import { getSitemapEntries } from '../src/seo/generator';

export default async function sitemap() {
  const entries = await getSitemapEntries('https://medbazarhelnex.shop');
  return entries.map((entry) => ({
    url: entry.url,
    lastModified: entry.lastModified ? new Date(entry.lastModified) : new Date(),
    changeFrequency: entry.changeFrequency || 'daily',
    priority: entry.priority !== undefined ? entry.priority : 0.7,
  }));
}
