import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_BRANDS, INITIAL_BLOGS } from '../data';
import { Product, Vendor, Blog } from '../types';

/**
 * Sitemap URL Entry representation as defined by sitemaps.org standard
 */
export interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Fallback vendor list if Firestore read fails or is unpopulated
 */
const FALLBACK_VENDORS: Partial<Vendor>[] = [
  { id: 'vendor-medilink', companyName: 'MediLink Systems Private Limited', status: 'Approved' },
  { id: 'vendor-apex', companyName: 'Apex Healthcare Equipment Corp', status: 'Approved' },
  { id: 'vendor-furniture-pros', companyName: 'Reliable Hospital Furniture India', status: 'Approved' },
];

/**
 * Helper function to escape special XML characters for safe Search Engine indexing
 */
export function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
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

/**
 * Ensures clean Base URL with fallback to standard domain
 */
export function getCleanBaseUrl(baseUrl: string = 'https://medbazarhelnex.shop'): string {
  let clean = baseUrl.trim().replace(/\/+$/, '');
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }
  return clean;
}

/**
 * 1. Fetch Static & Public Pages (Priority: 0.6)
 * Excludes Admin (/admin), Login (/login), Dashboard (/dashboard), Checkout (/checkout), Private API
 */
export async function getStaticPageEntries(baseUrl: string = 'https://medbazarhelnex.shop'): Promise<SitemapEntry[]> {
  const cleanBase = getCleanBaseUrl(baseUrl);
  const now = new Date().toISOString();

  // Home has top priority (1.0)
  const entries: SitemapEntry[] = [
    { url: `${cleanBase}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${cleanBase}/marketplace`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${cleanBase}/rfqs`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${cleanBase}/reviews`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${cleanBase}/trust-safety`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${cleanBase}/policy/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${cleanBase}/policy/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${cleanBase}/policy/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${cleanBase}/policy/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${cleanBase}/policy/refund`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${cleanBase}/policy/shipping`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];

  return entries;
}

/**
 * 2. Fetch Category Entries (Priority: 0.9)
 */
export async function getCategoryEntries(baseUrl: string = 'https://medbazarhelnex.shop'): Promise<SitemapEntry[]> {
  const cleanBase = getCleanBaseUrl(baseUrl);
  const categoriesSet = new Set<string>(INITIAL_CATEGORIES.map((c) => c.name));
  const now = new Date().toISOString();

  try {
    const catsSnap = await getDocs(collection(db, 'categories'));
    catsSnap.forEach((d) => {
      const data = d.data();
      if (data.name && data.isActive !== false) {
        categoriesSet.add(data.name);
      }
    });
  } catch (error) {
    console.warn('[SEO Generator] Using fallback categories for sitemap:', error);
  }

  const entries: SitemapEntry[] = [];
  categoriesSet.forEach((catName) => {
    if (catName.trim()) {
      entries.push({
        url: `${cleanBase}/category/${encodeURIComponent(catName.trim().toLowerCase().replace(/\s+/g, '-'))}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    }
  });

  return entries;
}

/**
 * 3. Fetch Product Entries (Priority: 0.9)
 */
export async function getProductEntries(baseUrl: string = 'https://medbazarhelnex.shop'): Promise<SitemapEntry[]> {
  const cleanBase = getCleanBaseUrl(baseUrl);
  let products: Product[] = [];

  try {
    const productsSnap = await getDocs(collection(db, 'products'));
    productsSnap.forEach((docSnap) => {
      const data = docSnap.data() as Product;
      if (data && (data.id || docSnap.id) && data.isActive !== false && data.published !== false) {
        products.push({ ...data, id: data.id || docSnap.id });
      }
    });
  } catch (error) {
    console.warn('[SEO Generator] Using fallback products for sitemap:', error);
  }

  if (products.length === 0) {
    products = INITIAL_PRODUCTS;
  }

  return products.map((p) => ({
    url: `${cleanBase}/product/${encodeURIComponent(p.id)}`,
    lastModified: p.createdAt || new Date().toISOString(),
    changeFrequency: 'daily',
    priority: 0.9,
  }));
}

/**
 * 4. Fetch Vendor Entries (Priority: 0.8)
 */
export async function getVendorEntries(baseUrl: string = 'https://medbazarhelnex.shop'): Promise<SitemapEntry[]> {
  const cleanBase = getCleanBaseUrl(baseUrl);
  let vendors: any[] = [];

  try {
    const vendorsSnap = await getDocs(collection(db, 'vendors'));
    vendorsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && (data.id || docSnap.id) && data.status !== 'Rejected') {
        vendors.push({ ...data, id: data.id || docSnap.id });
      }
    });
  } catch (error) {
    console.warn('[SEO Generator] Using fallback vendors for sitemap:', error);
  }

  if (vendors.length === 0) {
    vendors = FALLBACK_VENDORS;
  }

  return vendors.map((v) => ({
    url: `${cleanBase}/vendor/${encodeURIComponent(v.id)}`,
    lastModified: v.updatedAt || v.createdAt || new Date().toISOString(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));
}

/**
 * 5. Fetch Brand Entries (Priority: 0.8)
 */
export async function getBrandEntries(baseUrl: string = 'https://medbazarhelnex.shop'): Promise<SitemapEntry[]> {
  const cleanBase = getCleanBaseUrl(baseUrl);
  const brandsSet = new Set<string>(INITIAL_BRANDS.map((b) => b.name));
  const now = new Date().toISOString();

  try {
    const brandsSnap = await getDocs(collection(db, 'brands'));
    brandsSnap.forEach((d) => {
      const data = d.data();
      if (data.name && data.isActive !== false) {
        brandsSet.add(data.name);
      }
    });
  } catch (error) {
    console.warn('[SEO Generator] Using fallback brands for sitemap:', error);
  }

  const entries: SitemapEntry[] = [];
  brandsSet.forEach((brandName) => {
    if (brandName.trim()) {
      entries.push({
        url: `${cleanBase}/brand/${encodeURIComponent(brandName.trim().toLowerCase().replace(/\s+/g, '-'))}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  });

  return entries;
}

/**
 * 6. Fetch Blog Entries (Priority: 0.7)
 */
export async function getBlogEntries(baseUrl: string = 'https://medbazarhelnex.shop'): Promise<SitemapEntry[]> {
  const cleanBase = getCleanBaseUrl(baseUrl);
  let blogs: Blog[] = [];
  const now = new Date().toISOString();

  try {
    const blogsSnap = await getDocs(collection(db, 'blogs'));
    blogsSnap.forEach((docSnap) => {
      const data = docSnap.data() as Blog;
      if (data && (data.id || docSnap.id)) {
        blogs.push({ ...data, id: data.id || docSnap.id });
      }
    });
  } catch (error) {
    console.warn('[SEO Generator] Using fallback blogs for sitemap:', error);
  }

  if (blogs.length === 0) {
    blogs = INITIAL_BLOGS;
  }

  const entries: SitemapEntry[] = [
    { url: `${cleanBase}/blogs`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
  ];

  blogs.forEach((b) => {
    entries.push({
      url: `${cleanBase}/blogs/${encodeURIComponent(b.id)}`,
      lastModified: b.createdAt || now,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  });

  return entries;
}

/**
 * Consolidates all entries across the HealNex Medi Bazar marketplace
 */
export async function getAllSitemapEntries(baseUrl: string = 'https://medbazarhelnex.shop'): Promise<SitemapEntry[]> {
  const [pages, categories, products, vendors, brands, blogs] = await Promise.all([
    getStaticPageEntries(baseUrl),
    getCategoryEntries(baseUrl),
    getProductEntries(baseUrl),
    getVendorEntries(baseUrl),
    getBrandEntries(baseUrl),
    getBlogEntries(baseUrl),
  ]);

  return [...pages, ...categories, ...products, ...vendors, ...brands, ...blogs];
}

/**
 * Backwards compatible alias for getAllSitemapEntries
 */
export const getSitemapEntries = getAllSitemapEntries;

/**
 * Generates standard XML urlset for a set of entries
 */
export function generateSingleSitemapXml(entries: SitemapEntry[]): string {
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

/**
 * Generates XML sitemapindex linking to category-specific sitemap files
 */
export function generateSitemapIndexXml(baseUrl: string = 'https://medbazarhelnex.shop'): string {
  const cleanBase = getCleanBaseUrl(baseUrl);
  const now = new Date().toISOString();

  const subSitemaps = [
    `${cleanBase}/sitemap-products.xml`,
    `${cleanBase}/sitemap-categories.xml`,
    `${cleanBase}/sitemap-vendors.xml`,
    `${cleanBase}/sitemap-brands.xml`,
    `${cleanBase}/sitemap-blog.xml`,
    `${cleanBase}/sitemap-pages.xml`,
  ];

  const xmlSitemaps = subSitemaps
    .map(
      (url) => `  <sitemap>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlSitemaps}
</sitemapindex>`;
}

/**
 * Automatically decides whether to output a single sitemap or sitemap index if total URLs > 5000
 */
export async function generateDynamicSitemap(baseUrl: string = 'https://medbazarhelnex.shop'): Promise<string> {
  const allEntries = await getAllSitemapEntries(baseUrl);
  
  // If total URLs exceeds 5000, serve sitemap index automatically as required
  if (allEntries.length > 5000) {
    return generateSitemapIndexXml(baseUrl);
  }

  return generateSingleSitemapXml(allEntries);
}

/**
 * Backwards compatible export
 */
export async function generateSitemapXml(baseUrl: string = 'https://medbazarhelnex.shop'): Promise<string> {
  return generateDynamicSitemap(baseUrl);
}

/**
 * Generates production-ready robots.txt matching search engine standards
 */
export function generateRobotsTxt(sitemapUrl: string = 'https://medbazarhelnex.shop/sitemap.xml'): string {
  const cleanSitemapUrl = getCleanBaseUrl(sitemapUrl.replace(/\/sitemap\.xml$/, '')) + '/sitemap.xml';

  return `User-agent: *

Allow: /

Disallow: /admin/
Disallow: /dashboard/
Disallow: /login/
Disallow: /api/private/

Sitemap: ${cleanSitemapUrl}`;
}
