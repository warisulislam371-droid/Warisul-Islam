import type { IncomingMessage, ServerResponse } from 'http';
import { generateRobotsTxt } from '../src/seo/generator';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const host = req.headers?.host || 'medbazarhelnex.shop';
    const proto = (req.headers?.['x-forwarded-proto'] as string) || 'https';
    const baseUrl = `${proto}://${host}`;
    const sitemapUrl = `${baseUrl}/sitemap.xml`;
    
    const txt = generateRobotsTxt(sitemapUrl);
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400');
    res.statusCode = 200;
    res.end(txt);
  } catch (error) {
    console.error('Robots API Error:', error);
    res.statusCode = 500;
    res.end('Error generating robots.txt');
  }
}
