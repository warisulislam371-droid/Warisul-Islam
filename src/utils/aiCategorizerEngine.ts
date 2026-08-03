import { Category, Subcategory, Product } from '../types';
import { INITIAL_CATEGORIES } from '../data';
import { dbLocal } from '../db';
import { slugify, getCategorySeoUrl, getSubcategorySeoUrl, getProductSeoUrl } from './seoUrls';
import { MEDICAL_TAXONOMY_DICTIONARY, normalizeMedicalText, getFuzzyScore } from './medicalCategorizer';

const SUBCATEGORIES_STORAGE_KEY = 'healnex_subcategory_objects';
const CATEGORIZATION_LOGS_KEY = 'healnex_categorization_logs';

export interface CategorizationLogEntry {
  id: string;
  productId: string;
  productName: string;
  brand?: string;
  category: string;
  subcategory: string;
  confidence: number;
  status: 'AutoSelected' | 'Suggested' | 'NeedsAdminReview';
  isNewSubcategoryCreated: boolean;
  reasoning: string;
  timestamp: string;
}

/**
 * Helper to generate SEO metadata for a Category
 */
export function generateCategorySeoMetadata(categoryName: string, description?: string) {
  const cleanName = categoryName.trim();
  const slug = slugify(cleanName);
  const canonicalUrl = `https://medbazarhelnex.shop/category/${slug}`;
  const seoTitle = `${cleanName} - B2B Medical Equipment & Supplies | HealNex Medi Bazar`;
  const metaDescription = description || `Buy hospital grade ${cleanName} online at HealNex Medi Bazar. Verified B2B clinical manufacturers, factory direct prices, fast shipping.`;

  return {
    seoTitle,
    metaDescription,
    seoSlug: slug,
    canonicalUrl,
    breadcrumb: [
      { name: 'Home', url: 'https://medbazarhelnex.shop/' },
      { name: cleanName, url: canonicalUrl }
    ],
    schemaJsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: seoTitle,
      description: metaDescription,
      url: canonicalUrl
    },
    openGraphTags: {
      title: seoTitle,
      description: metaDescription,
      url: canonicalUrl
    }
  };
}

/**
 * Helper to generate SEO metadata for a Subcategory
 */
export function generateSubcategorySeoMetadata(categoryName: string, subcategoryName: string, description?: string) {
  const cleanCat = categoryName.trim();
  const cleanSub = subcategoryName.trim();
  const catSlug = slugify(cleanCat);
  const subSlug = slugify(cleanSub);
  const canonicalUrl = `https://medbazarhelnex.shop/category/${catSlug}/${subSlug}`;
  const seoTitle = `${cleanSub} - ${cleanCat} | HealNex Medi Bazar`;
  const metaDescription = description || `Procure clinical grade ${cleanSub} under ${cleanCat}. Certified manufacturers, GST invoices, and bulk pricing on HealNex Medi Bazar.`;

  return {
    seoTitle,
    metaDescription,
    seoSlug: subSlug,
    canonicalUrl,
    breadcrumb: [
      { name: 'Home', url: 'https://medbazarhelnex.shop/' },
      { name: cleanCat, url: `https://medbazarhelnex.shop/category/${catSlug}` },
      { name: cleanSub, url: canonicalUrl }
    ],
    schemaJsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: seoTitle,
      description: metaDescription,
      url: canonicalUrl
    },
    openGraphTags: {
      title: seoTitle,
      description: metaDescription,
      url: canonicalUrl
    }
  };
}

/**
 * Gets or initializes all Subcategory objects in storage
 */
export function getAllSubcategories(): Subcategory[] {
  const stored = dbLocal.get<Subcategory[]>(SUBCATEGORIES_STORAGE_KEY, []);
  if (Array.isArray(stored) && stored.length > 0) {
    return stored;
  }

  // Initialize from INITIAL_CATEGORIES if not present
  const initializedSubcategories: Subcategory[] = [];
  const categories = dbLocal.getCategories();

  categories.forEach(cat => {
    (cat.subcategories || []).forEach(subName => {
      const seo = generateSubcategorySeoMetadata(cat.name, subName);
      // Find dictionary entry for keywords/synonyms
      const dictMatch = MEDICAL_TAXONOMY_DICTIONARY.find(
        d => d.category.toLowerCase() === cat.name.toLowerCase() && d.subcategory.toLowerCase() === subName.toLowerCase()
      );

      initializedSubcategories.push({
        id: `sub_${slugify(cat.name)}_${slugify(subName)}`,
        categoryId: cat.id,
        categoryName: cat.name,
        name: subName,
        slug: slugify(subName),
        description: `Verified clinical ${subName} equipment and supplies.`,
        keywords: dictMatch ? [...dictMatch.primaryTerms, ...dictMatch.synonyms] : [subName.toLowerCase()],
        synonyms: dictMatch ? [...dictMatch.synonyms] : [subName.toLowerCase()],
        productCount: 0,
        createdByAi: false,
        approved: true,
        status: 'Active',
        createdAt: new Date().toISOString(),
        ...seo
      });
    });
  });

  dbLocal.set(SUBCATEGORIES_STORAGE_KEY, initializedSubcategories);
  return initializedSubcategories;
}

/**
 * Saves updated list of subcategories
 */
export function saveSubcategories(subcategories: Subcategory[]) {
  dbLocal.set(SUBCATEGORIES_STORAGE_KEY, subcategories);
  window.dispatchEvent(new Event('healnex_db_update'));
}

/**
 * Duplicate Protection: Checks if a subcategory candidate already exists
 * using exact match, slug match, synonym match, or high fuzzy score.
 */
export function findDuplicateSubcategory(
  categoryName: string,
  subcategoryNameCandidate: string,
  existingSubcategories: Subcategory[] = getAllSubcategories()
): Subcategory | null {
  const normCandidate = normalizeMedicalText(subcategoryNameCandidate);
  const candidateSlug = slugify(subcategoryNameCandidate);

  if (!normCandidate) return null;

  for (const sub of existingSubcategories) {
    // 1. Exact match or Slug match
    if (sub.slug === candidateSlug || normalizeMedicalText(sub.name) === normCandidate) {
      return sub;
    }

    // 2. Keyword or Synonym match
    const keywordsNorm = (sub.keywords || []).map(normalizeMedicalText);
    const synonymsNorm = (sub.synonyms || []).map(normalizeMedicalText);

    if (keywordsNorm.includes(normCandidate) || synonymsNorm.includes(normCandidate)) {
      return sub;
    }

    // 3. High Fuzzy Match (>85%) within the same category
    if (sub.categoryName.toLowerCase() === categoryName.toLowerCase()) {
      const fuzzyScore = getFuzzyScore(normCandidate, sub.name);
      if (fuzzyScore >= 85) {
        return sub;
      }
    }
  }

  return null;
}

/**
 * Automatic Keyword Learning:
 * Extracts keywords/synonyms from new product details and adds them to the subcategory record.
 */
export function learnKeywordsForSubcategory(
  subcategoryId: string,
  product: { name: string; brand?: string; description?: string; specifications?: any[] }
) {
  const allSubs = getAllSubcategories();
  const subIndex = allSubs.findIndex(s => s.id === subcategoryId);
  if (subIndex === -1) return;

  const sub = allSubs[subIndex];
  const newTerms = new Set<string>();

  // Title keywords
  const titleNorm = normalizeMedicalText(product.name);
  if (titleNorm) newTerms.add(titleNorm);

  // Extract medical terms from title
  const words = titleNorm.split(' ').filter(w => w.length > 3);
  words.forEach(w => newTerms.add(w));

  if (product.brand) {
    const brandNorm = normalizeMedicalText(product.brand);
    if (brandNorm) newTerms.add(`${brandNorm} ${titleNorm}`);
  }

  const existingKeywords = new Set((sub.keywords || []).map(k => k.toLowerCase()));
  const existingSynonyms = new Set((sub.synonyms || []).map(s => s.toLowerCase()));

  let updated = false;
  newTerms.forEach(term => {
    if (term.length > 2 && !existingKeywords.has(term)) {
      sub.keywords.push(term);
      existingKeywords.add(term);
      updated = true;
    }
  });

  if (updated) {
    sub.updatedAt = new Date().toISOString();
    allSubs[subIndex] = sub;
    saveSubcategories(allSubs);
  }
}

/**
 * Core AI Classification & Auto-Generation Engine:
 * Analyzes product input, matches existing categories/subcategories,
 * or automatically creates a new subcategory with duplicate protection,
 * confidence thresholding, and SEO generation.
 */
export async function classifyAndAssignProductAI(productInput: {
  id?: string;
  name: string;
  brand?: string;
  description?: string;
  specifications?: any[];
  sku?: string;
}): Promise<{
  category: string;
  subcategory: string;
  confidence: number;
  status: 'AutoSelected' | 'Suggested' | 'NeedsAdminReview';
  needsAdminReview: boolean;
  isNewSubcategoryCreated: boolean;
  subcategoryId?: string;
  reasoning: string;
  seoCategoryUrl: string;
  seoSubcategoryUrl: string;
  seoProductUrl: string;
}> {
  const normName = normalizeMedicalText(productInput.name || '');
  const normDesc = normalizeMedicalText(productInput.description || '');
  const fullText = `${normName} ${productInput.brand ? normalizeMedicalText(productInput.brand) : ''} ${normDesc}`;

  const allSubcategories = getAllSubcategories();
  const categories = dbLocal.getCategories();

  // Step 1: Search existing subcategories in DB using exact, partial, synonym, and dictionary rules
  let bestSubMatch: Subcategory | null = null;
  let highestConfidence = 0;
  let matchReasoning = '';

  for (const sub of allSubcategories) {
    let score = 0;
    const subNorm = normalizeMedicalText(sub.name);

    // Title contains subcategory name
    if (normName.includes(subNorm) || subNorm.includes(normName)) {
      score += 60;
    } else if (fullText.includes(subNorm)) {
      score += 30;
    }

    // Keyword & synonym matches
    for (const kw of (sub.keywords || [])) {
      const kwNorm = normalizeMedicalText(kw);
      if (kwNorm && normName.includes(kwNorm)) {
        score += 25;
      } else if (kwNorm && fullText.includes(kwNorm)) {
        score += 10;
      }
    }

    for (const syn of (sub.synonyms || [])) {
      const synNorm = normalizeMedicalText(syn);
      if (synNorm && normName.includes(synNorm)) {
        score += 20;
      }
    }

    // Fuzzy match bonus
    const fuzzyScore = getFuzzyScore(normName, sub.name);
    if (fuzzyScore > 50) {
      score += Math.round(fuzzyScore * 0.3);
    }

    if (score > highestConfidence) {
      highestConfidence = score;
      bestSubMatch = sub;
      matchReasoning = `Matched subcategory "${sub.name}" via clinical terminology & synonym keyword patterns.`;
    }
  }

  // Cap initial confidence at 98
  highestConfidence = Math.min(98, highestConfidence);

  // Step 2: If strong subcategory match found (>= 70 confidence)
  if (bestSubMatch && highestConfidence >= 70) {
    // Learn keywords
    learnKeywordsForSubcategory(bestSubMatch.id, productInput);

    const isHighConfidence = highestConfidence >= 90;
    const status = isHighConfidence ? 'AutoSelected' : 'Suggested';

    // Log action
    logCategorizationAction({
      productId: productInput.id || `temp_${Date.now()}`,
      productName: productInput.name,
      brand: productInput.brand,
      category: bestSubMatch.categoryName,
      subcategory: bestSubMatch.name,
      confidence: highestConfidence,
      status,
      isNewSubcategoryCreated: false,
      reasoning: matchReasoning
    });

    return {
      category: bestSubMatch.categoryName,
      subcategory: bestSubMatch.name,
      confidence: highestConfidence,
      status,
      needsAdminReview: !isHighConfidence,
      isNewSubcategoryCreated: false,
      subcategoryId: bestSubMatch.id,
      reasoning: matchReasoning,
      seoCategoryUrl: getCategorySeoUrl(bestSubMatch.categoryName),
      seoSubcategoryUrl: getSubcategorySeoUrl(bestSubMatch.categoryName, bestSubMatch.name),
      seoProductUrl: getProductSeoUrl(bestSubMatch.categoryName, bestSubMatch.name, productInput.name, productInput.brand)
    };
  }

  // Step 3: Subcategory NOT found or confidence < 70 -> Intelligently create new Subcategory
  // 3a. Find closest Parent Category
  let parentCategoryName = 'Medical Equipment';
  let parentCategoryObj = categories.find(c => c.name === 'Medical Equipment') || categories[0];

  for (const cat of categories) {
    if (fullText.includes(normalizeMedicalText(cat.name))) {
      parentCategoryName = cat.name;
      parentCategoryObj = cat;
      break;
    }
  }

  // 3b. Determine clean new Subcategory name from product name
  // Extract key clinical term (e.g., "Philips Vein Finder Pro" -> "Vein Finder")
  let newSubName = extractClinicalSubcategoryName(productInput.name, productInput.brand);

  // Check duplicate protection before creating
  const existingDup = findDuplicateSubcategory(parentCategoryName, newSubName, allSubcategories);
  if (existingDup) {
    learnKeywordsForSubcategory(existingDup.id, productInput);
    return {
      category: existingDup.categoryName,
      subcategory: existingDup.name,
      confidence: 88,
      status: 'Suggested',
      needsAdminReview: false,
      isNewSubcategoryCreated: false,
      subcategoryId: existingDup.id,
      reasoning: `Matched existing subcategory "${existingDup.name}" after duplicate protection check.`,
      seoCategoryUrl: getCategorySeoUrl(existingDup.categoryName),
      seoSubcategoryUrl: getSubcategorySeoUrl(existingDup.categoryName, existingDup.name),
      seoProductUrl: getProductSeoUrl(existingDup.categoryName, existingDup.name, productInput.name, productInput.brand)
    };
  }

  // 3c. Generate new Subcategory object
  const computedConfidence = calculateNewSubcategoryConfidence(productInput);
  const isAutoApproved = computedConfidence >= 90;
  const subStatus: Subcategory['status'] = isAutoApproved ? 'Active' : 'Pending Approval';

  const newSubId = `sub_ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const seo = generateSubcategorySeoMetadata(parentCategoryName, newSubName, productInput.description);

  const autoKeywords = [
    newSubName.toLowerCase(),
    `${newSubName.toLowerCase()} machine`,
    `${newSubName.toLowerCase()} device`,
    `portable ${newSubName.toLowerCase()}`,
    `medical ${newSubName.toLowerCase()}`
  ];

  const newSubcategoryObj: Subcategory = {
    id: newSubId,
    categoryId: parentCategoryObj?.id || `cat_${slugify(parentCategoryName)}`,
    categoryName: parentCategoryName,
    name: newSubName,
    slug: slugify(newSubName),
    description: `Auto-generated AI clinical subcategory for ${newSubName}.`,
    keywords: autoKeywords,
    synonyms: [newSubName.toLowerCase()],
    productCount: 1,
    createdByAi: true,
    approved: isAutoApproved,
    status: subStatus,
    createdAt: new Date().toISOString(),
    ...seo
  };

  // 3d. Save new subcategory permanently
  allSubcategories.unshift(newSubcategoryObj);
  saveSubcategories(allSubcategories);

  // Update parent category's subcategories array if needed
  if (parentCategoryObj) {
    const updatedCats = categories.map(c => {
      if (c.name.toLowerCase() === parentCategoryName.toLowerCase()) {
        const subList = c.subcategories || [];
        if (!subList.includes(newSubName)) {
          return {
            ...c,
            subcategories: [...subList, newSubName],
            subcategoryObjects: [...(c.subcategoryObjects || []), newSubcategoryObj]
          };
        }
      }
      return c;
    });
    dbLocal.saveCategories(updatedCats);
  }

  const resultStatus = isAutoApproved ? 'AutoSelected' : computedConfidence >= 70 ? 'Suggested' : 'NeedsAdminReview';
  const reasoning = `Intelligently created new subcategory "${newSubName}" under "${parentCategoryName}". Confidence: ${computedConfidence}%. Status: ${subStatus}.`;

  // Log action
  logCategorizationAction({
    productId: productInput.id || `temp_${Date.now()}`,
    productName: productInput.name,
    brand: productInput.brand,
    category: parentCategoryName,
    subcategory: newSubName,
    confidence: computedConfidence,
    status: resultStatus,
    isNewSubcategoryCreated: true,
    reasoning
  });

  // Notify Admin if confidence < 90
  if (!isAutoApproved) {
    dbLocal.addNotification(
      'admin',
      'New AI Subcategory Requires Review',
      `New subcategory "${newSubName}" created with ${computedConfidence}% confidence for product "${productInput.name}". Please review in AI Category Manager.`,
      'system'
    );
  }

  return {
    category: parentCategoryName,
    subcategory: newSubName,
    confidence: computedConfidence,
    status: resultStatus,
    needsAdminReview: !isAutoApproved,
    isNewSubcategoryCreated: true,
    subcategoryId: newSubId,
    reasoning,
    seoCategoryUrl: getCategorySeoUrl(parentCategoryName),
    seoSubcategoryUrl: getSubcategorySeoUrl(parentCategoryName, newSubName),
    seoProductUrl: getProductSeoUrl(parentCategoryName, newSubName, productInput.name, productInput.brand)
  };
}

/**
 * Extracts clean clinical subcategory name from product title
 */
function extractClinicalSubcategoryName(productTitle: string, brand?: string): string {
  let title = productTitle || 'Medical Device';
  if (brand) {
    const brandRegex = new RegExp(brand, 'gi');
    title = title.replace(brandRegex, '').trim();
  }

  // Remove common filler words & model numbers
  title = title.replace(/\b(pro|plus|max|lite|v\d+|series|\d+l|\d+-channel|hd|digital|portable|compact|model|unit|system)\b/gi, '').trim();
  title = title.replace(/[^\w\s]/gi, ' ').replace(/\s+/g, ' ').trim();

  const words = title.split(' ');
  if (words.length > 3) {
    title = words.slice(0, 3).join(' ');
  }

  // Capitalize each word cleanly
  return title
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Calculates confidence score for a newly generated subcategory
 */
function calculateNewSubcategoryConfidence(product: { name: string; brand?: string; description?: string; specifications?: any[] }): number {
  let score = 75; // Baseline for well-formed title
  if (product.brand) score += 5;
  if (product.description && product.description.length > 30) score += 10;
  if (product.specifications && product.specifications.length > 0) score += 5;
  return Math.min(96, Math.max(65, score));
}

/**
 * Logging Helper for AI Categorization Actions
 */
export function logCategorizationAction(entry: Omit<CategorizationLogEntry, 'id' | 'timestamp'>) {
  const logs = dbLocal.get<CategorizationLogEntry[]>(CATEGORIZATION_LOGS_KEY, []);
  const newLog: CategorizationLogEntry = {
    ...entry,
    id: `cat_log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString()
  };
  logs.unshift(newLog);
  dbLocal.set(CATEGORIZATION_LOGS_KEY, logs.slice(0, 200)); // Keep last 200 logs
}

/**
 * Retrieves categorization history logs
 */
export function getCategorizationLogs(): CategorizationLogEntry[] {
  return dbLocal.get<CategorizationLogEntry[]>(CATEGORIZATION_LOGS_KEY, []);
}

/**
 * Admin Management Function: Merge Duplicate Subcategories
 */
export function mergeSubcategories(sourceSubId: string, targetSubId: string): { success: boolean; movedProductCount: number; message: string } {
  const allSubs = getAllSubcategories();
  const sourceSub = allSubs.find(s => s.id === sourceSubId);
  const targetSub = allSubs.find(s => s.id === targetSubId);

  if (!sourceSub || !targetSub) {
    return { success: false, movedProductCount: 0, message: 'Source or target subcategory not found.' };
  }

  const allProducts = dbLocal.getProducts();
  let movedCount = 0;

  const updatedProducts = allProducts.map(p => {
    if (p.subcategory?.toLowerCase() === sourceSub.name.toLowerCase() || p.subcategoryId === sourceSub.id) {
      movedCount++;
      return {
        ...p,
        category: targetSub.categoryName,
        subcategory: targetSub.name,
        subcategoryId: targetSub.id,
        updatedAt: new Date().toISOString()
      };
    }
    return p;
  });

  // Save updated products
  dbLocal.saveProducts(updatedProducts);

  // Merge keywords & synonyms into target subcategory
  const mergedKeywords = Array.from(new Set([...targetSub.keywords, ...sourceSub.keywords]));
  const mergedSynonyms = Array.from(new Set([...targetSub.synonyms, ...sourceSub.synonyms, sourceSub.name.toLowerCase()]));

  targetSub.keywords = mergedKeywords;
  targetSub.synonyms = mergedSynonyms;
  targetSub.productCount += movedCount;
  targetSub.updatedAt = new Date().toISOString();

  // Remove source subcategory from list
  const filteredSubs = allSubs.filter(s => s.id !== sourceSubId);
  saveSubcategories(filteredSubs);

  // Remove source subcategory from parent category list
  const categories = dbLocal.getCategories();
  const updatedCategories = categories.map(c => {
    if (c.subcategories) {
      c.subcategories = c.subcategories.filter(s => s.toLowerCase() !== sourceSub.name.toLowerCase());
    }
    return c;
  });
  dbLocal.saveCategories(updatedCategories);

  return {
    success: true,
    movedProductCount: movedCount,
    message: `Merged subcategory "${sourceSub.name}" into "${targetSub.name}". Moved ${movedCount} products.`
  };
}

/**
 * Admin Management Function: Delete Empty Subcategories
 */
export function deleteEmptySubcategories(): { deletedCount: number; deletedNames: string[] } {
  const allSubs = getAllSubcategories();
  const allProducts = dbLocal.getProducts();

  const productSubSet = new Set(allProducts.map(p => (p.subcategory || '').toLowerCase().trim()));

  const emptySubs = allSubs.filter(s => !productSubSet.has(s.name.toLowerCase().trim()) && s.createdByAi);
  const deletedNames = emptySubs.map(s => s.name);

  if (emptySubs.length > 0) {
    const emptyIds = new Set(emptySubs.map(s => s.id));
    const remainingSubs = allSubs.filter(s => !emptyIds.has(s.id));
    saveSubcategories(remainingSubs);

    // Update category objects
    const categories = dbLocal.getCategories();
    const updatedCats = categories.map(c => {
      if (c.subcategories) {
        c.subcategories = c.subcategories.filter(sub => !deletedNames.includes(sub));
      }
      return c;
    });
    dbLocal.saveCategories(updatedCats);
  }

  return { deletedCount: emptySubs.length, deletedNames };
}

/**
 * Admin Management Function: Recalculate Live Product Counts across Categories & Subcategories
 */
export function recalculateProductCounts(): { categories: Category[]; subcategories: Subcategory[] } {
  const allProducts = dbLocal.getProducts();
  const categories = dbLocal.getCategories();
  const subcategories = getAllSubcategories();

  const categoryCounts = new Map<string, number>();
  const subcategoryCounts = new Map<string, number>();

  allProducts.forEach(p => {
    if (p.category) {
      const catKey = p.category.trim().toLowerCase();
      categoryCounts.set(catKey, (categoryCounts.get(catKey) || 0) + 1);
    }
    if (p.subcategory) {
      const subKey = p.subcategory.trim().toLowerCase();
      subcategoryCounts.set(subKey, (subcategoryCounts.get(subKey) || 0) + 1);
    }
  });

  const updatedCategories = categories.map(c => ({
    ...c,
    product_count: categoryCounts.get(c.name.trim().toLowerCase()) || 0
  }));

  const updatedSubcategories = subcategories.map(s => ({
    ...s,
    productCount: subcategoryCounts.get(s.name.trim().toLowerCase()) || 0
  }));

  dbLocal.saveCategories(updatedCategories);
  saveSubcategories(updatedSubcategories);

  return { categories: updatedCategories, subcategories: updatedSubcategories };
}
