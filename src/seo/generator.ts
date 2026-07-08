import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_BRANDS } from '../data';
import { Product, Vendor } from '../types';

export interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

// Fallback vendor list if firestore read fails or is unpopulated on server
const FALLBACK_VENDORS: Partial<Vendor>[] = [
  { id: 'ven_1', companyName: 'Meditools Pvt Ltd', status: 'Approved' },
  { id: 'ven_2', companyName: 'BioHealth India', status: 'Approved' },
  { id: 'ven_3', companyName: 'Apex Medical Systems', status: 'Approved' },
];

export async function getSitemapEntries(baseUrl: string = 'https://medbazarhelnex.shop'): Promise<SitemapEntry[]> {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const entries: SitemapEntry[] = [];

  // 1. Homepage
  entries.push({
    url: `${cleanBase}/`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily',
    priority: 1.0,
  });

  let products: Product[] = [];
  let vendors: any[] = [];

  // Fetch from Firestore
  try {
    const productsSnap = await getDocs(collection(db, 'products'));
    productsSnap.forEach((docSnap) => {
      const data = docSnap.data() as Product;
      if (data && (data.id || docSnap.id)) {
        products.push({ ...data, id: data.id || docSnap.id });
      }
    });
  } catch (error) {
    console.warn('[SEO Generator] Could not read products from Firestore, using initial fallback:', error);
  }

  if (products.length === 0) {
    products = INITIAL_PRODUCTS;
  }

  try {
    const vendorsSnap = await getDocs(collection(db, 'vendors'));
    vendorsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && (data.id || docSnap.id)) {
        vendors.push({ ...data, id: data.id || docSnap.id });
      }
    });
  } catch (error) {
    console.warn('[SEO Generator] Could not read vendors from Firestore, using fallback:', error);
  }

  if (vendors.length === 0) {
    vendors = FALLBACK_VENDORS;
  }

  // 2. Fetch Categories & Brands
  const categoriesSet = new Set<string>(INITIAL_CATEGORIES.map(c => c.name));
  const brandsSet = new Set<string>(INITIAL_BRANDS.map(b => b.name));

  try {
    const catsSnap = await getDocs(collection(db, 'categories'));
    catsSnap.forEach(d => {
      const data = d.data();
      if (data.name && data.isActive !== false) categoriesSet.add(data.name);
    });
    const brandsSnap = await getDocs(collection(db, 'brands'));
    brandsSnap.forEach(d => {
      const data = d.data();
      if (data.name && data.isActive !== false) brandsSet.add(data.name);
    });
  } catch (error) {
    console.warn('[SEO Generator] Could not read categories/brands from Firestore:', error);
  }

  // 3. Product Pages
  products.forEach((p) => {
    if (p.id) {
      entries.push({
        url: `${cleanBase}/product/${encodeURIComponent(p.id)}`,
        lastModified: p.createdAt || new Date().toISOString(),
        changeFrequency: 'daily',
        priority: 0.9,
      });
    }
    if (p.category) categoriesSet.add(p.category);
    if (p.brand) brandsSet.add(p.brand);
  });

  // 4. Category Pages
  categoriesSet.forEach((cat) => {
    if (cat.trim()) {
      entries.push({
        url: `${cleanBase}/category/${encodeURIComponent(cat.trim())}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  });

  // 5. Brand Pages
  brandsSet.forEach((brd) => {
    if (brd.trim()) {
      entries.push({
        url: `${cleanBase}/brand/${encodeURIComponent(brd.trim())}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  });

  // 4. Vendor Pages
  vendors.forEach((v) => {
    if (v.id) {
      entries.push({
        url: `${cleanBase}/vendor/${encodeURIComponent(v.id)}`,
        lastModified: v.updatedAt || v.createdAt || new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  });

  // 5. Brand Pages
  brandsSet.forEach((brand) => {
    if (brand.trim()) {
      entries.push({
        url: `${cleanBase}/brand/${encodeURIComponent(brand.trim())}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  });

  return entries;
}

export async function generateSitemapXml(baseUrl: string = 'https://medbazarhelnex.shop'): Promise<string> {
  const entries = (await getSitemapEntries(baseUrl)) as SitemapEntry[];
  
  const xmlUrls = entries
    .map((e) => {
      const lastmod = e.lastModified ? `<lastmod>${new Date(e.lastModified).toISOString()}</lastmod>` : '';
      const changefreq = e.changeFrequency ? `<changefreq>${e.changeFrequency}</changefreq>` : '';
      const priority = e.priority !== undefined ? `<priority>${e.priority.toFixed(1)}</priority>` : '';
      return `  <url>
    <loc>${escapeXml(e.url)}</loc>
    ${lastmod}
    ${changefreq}
    ${priority}
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>`;
}

export function generateRobotsTxt(sitemapUrl: string = 'https://medbazarhelnex.shop/sitemap.xml'): string {
  return `User-agent: *
Allow: /

Sitemap: ${sitemapUrl}`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
