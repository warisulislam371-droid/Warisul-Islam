import type { IncomingMessage, ServerResponse } from 'http';
import { generateSitemapXml } from '../src/seo/generator';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const host = req.headers?.host || 'medbazarhelnex.shop';
    const proto = (req.headers?.['x-forwarded-proto'] as string) || 'https';
    const baseUrl = `${proto}://${host}`;
    
    const xml = await generateSitemapXml(baseUrl);
    
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.statusCode = 200;
    res.end(xml);
  } catch (error) {
    console.error('Sitemap API Error:', error);
    res.statusCode = 500;
    res.end('Error generating sitemap');
  }
}
