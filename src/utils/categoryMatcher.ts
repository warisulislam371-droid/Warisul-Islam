import { Product, Category } from '../types';

/**
 * Universal Category Matcher
 * Ensures that when a user selects or clicks any category or subcategory name,
 * ALL matching products under that category hierarchy are accurately returned.
 */
export function isCategoryMatch(
  product: Product,
  selectedCategoryName: string,
  categoriesList: Category[] = []
): boolean {
  if (!selectedCategoryName || selectedCategoryName.trim().toLowerCase() === 'all' || selectedCategoryName.trim() === '') {
    return true;
  }

  const target = selectedCategoryName.trim().toLowerCase();
  const pCat = (product.category || '').trim().toLowerCase();
  const pCatId = (product.categoryId || '').trim().toLowerCase();
  const pSub = (product.subcategory || '').trim().toLowerCase();
  const pName = (product.name || '').trim().toLowerCase();

  // 1. Direct category name, category ID, or subcategory match
  if (pCat === target || pCatId === target || pSub === target) {
    return true;
  }

  // 2. Refurbished Equipment special category
  if (target === 'refurbished equipment' || target === 'refurbished') {
    if (
      pCat.includes('refurbished') ||
      pSub.includes('refurbished') ||
      Boolean((product as any).isRefurbished) ||
      pName.includes('refurbished')
    ) {
      return true;
    }
  }

  // 3. Known Category object matching (checks parent category name & subcategories array)
  const catObj = (categoriesList || []).find(
    c =>
      (c.name || '').trim().toLowerCase() === target ||
      (c.id || '').trim().toLowerCase() === target
  );

  if (catObj) {
    if (pCat === (catObj.name || '').trim().toLowerCase() || pCatId === (catObj.id || '').trim().toLowerCase()) {
      return true;
    }
    if (Array.isArray(catObj.subcategories)) {
      const subListLower = catObj.subcategories.map(s => (s || '').trim().toLowerCase());
      if (subListLower.includes(pSub) || subListLower.includes(pCat)) {
        return true;
      }
    }
  }

  // 4. Check if target is a subcategory of any category
  for (const c of categoriesList || []) {
    if (Array.isArray(c.subcategories)) {
      const subListLower = c.subcategories.map(s => (s || '').trim().toLowerCase());
      if (subListLower.includes(target)) {
        if (
          pSub === target ||
          pCat === target ||
          (subListLower.includes(pSub) &&
            ((c.name || '').toLowerCase() === pCat || (c.id || '').toLowerCase() === pCatId))
        ) {
          return true;
        }
      }
    }
  }

  // 5. Partial / Substring flexible matching
  if (pCat.length > 3 && (pCat.includes(target) || target.includes(pCat))) return true;
  if (pSub.length > 3 && (pSub.includes(target) || target.includes(pSub))) return true;

  return false;
}

/**
 * Get all subcategories associated with a category name
 */
export function getCategorySubcategories(
  categoryName: string,
  products: Product[],
  categoriesList: Category[] = []
): string[] {
  if (!categoryName) return [];

  const target = categoryName.trim().toLowerCase();
  const subSet = new Set<string>();

  // From categories list
  const catObj = (categoriesList || []).find(
    c =>
      (c.name || '').trim().toLowerCase() === target ||
      (c.id || '').trim().toLowerCase() === target
  );

  if (catObj && Array.isArray(catObj.subcategories)) {
    catObj.subcategories.forEach(s => {
      if (s && s.trim()) subSet.add(s.trim());
    });
  }

  // From products matching this category
  (products || []).forEach(p => {
    if (isCategoryMatch(p, categoryName, categoriesList)) {
      if (p.subcategory && p.subcategory.trim()) {
        subSet.add(p.subcategory.trim());
      }
    }
  });

  return Array.from(subSet);
}
