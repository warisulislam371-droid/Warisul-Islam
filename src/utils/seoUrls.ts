/**
 * Utility functions for generating SEO-friendly URLs and slugs
 * for categories, subcategories, and products in HealNex Medi Bazar.
 */

export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

export function getCategorySeoUrl(category: string): string {
  const catSlug = slugify(category || 'general');
  return `/category/${catSlug}`;
}

export function getSubcategorySeoUrl(category: string, subcategory: string): string {
  const catSlug = slugify(category || 'general');
  const subSlug = slugify(subcategory || 'all');
  return `/category/${catSlug}/${subSlug}`;
}

export function getProductSeoUrl(category: string, subcategory: string, productName: string, brand?: string): string {
  const catSlug = slugify(category || 'general');
  const subSlug = slugify(subcategory || 'all');
  const nameSlug = slugify(`${brand ? `${brand}-` : ''}${productName || 'product'}`);
  return `/product/${catSlug}/${subSlug}/${nameSlug}`;
}
