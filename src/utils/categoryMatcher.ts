import { Product, Category } from '../types';

// Medical domain synonyms and keywords map for intelligent cross-matching
const MEDICAL_CATEGORY_SYNONYMS: Record<string, string[]> = {
  'cardiology': ['cardiac', 'heart', 'ecg', 'ekg', 'defibrillator', 'holter', 'pacemaker', 'stress test', 'echo', 'echocardiogram', 'cardio'],
  'diagnostic imaging': ['radiology', 'imaging', 'mri', 'ct scan', 'ct scanner', 'x-ray', 'xray', 'ultrasound', 'sonography', 'mammography', 'c-arm', 'fluoroscopy', 'pet scan', 'usg'],
  'ultrasound': ['sonography', 'ultrasonic', 'echocardiography', 'doppler', 'usg', 'transducer', 'probe', 'voluson', 'vivid', 'epiq', 'affiniti'],
  'icu & critical care': ['critical care', 'icu', 'intensive care', 'ventilator', 'patient monitor', 'infusion pump', 'syringe pump', 'defibrillator', 'respirator', 'bipap', 'cpap', 'anesthesia'],
  'surgical & ot equipment': ['operating theater', 'operation theatre', 'ot', 'surgical', 'cautery', 'electrosurgical', 'ot table', 'surgical light', 'laparoscopy', 'endoscopy', 'autoclave', 'sterilizer'],
  'patient monitoring': ['vital signs', 'multi-parameter', 'multipara', 'pulse oximeter', 'ecg monitor', 'cardiac monitor', 'capnography', 'bedside monitor', 'spo2'],
  'laboratory & diagnostics': ['lab', 'pathology', 'hematology', 'biochemistry', 'centrifuge', 'microscope', 'analyzer', 'elisa', 'reagents', 'pipette', 'pcr'],
  'emergency & life support': ['ambulance', 'resuscitation', 'aed', 'suction', 'emergency', 'first aid', 'stretcher', 'trauma'],
  'hospital furniture': ['hospital bed', 'fowler bed', 'icu bed', 'examination table', 'wheelchair', 'stretcher', 'trolley', 'iv pole', 'overbed table'],
  'ophthalmology': ['eye', 'ophthalmic', 'slit lamp', 'phoropter', 'fundus', 'retinal', 'keratometer', 'lensmeter', 'tonometer', 'cataract'],
  'dental equipment': ['dental', 'dentistry', 'dental chair', 'scalers', 'curing light', 'autoclave', 'handpiece', 'apex locator'],
  'neonatal & pediatric': ['nicu', 'infant warmer', 'baby incubator', 'phototherapy', 'pediatric', 'neonatal', 'infant radiant warmer'],
  'physiotherapy & rehab': ['rehabilitation', 'physio', 'traction', 'tens', 'ultrasound therapy', 'laser therapy', 'shortwave diathermy', 'walker'],
  'refurbished equipment': ['refurbished', 'pre-owned', 'renewed', 'certified refurbished', 'used medical', 'restored', 'refurbished imaging', 'refurbished icu', 'refurbished imaging & icu equipment', 'refurbished equipment'],
  'refurbished imaging & icu equipment': ['refurbished', 'pre-owned', 'renewed', 'certified refurbished', 'used medical', 'restored', 'refurbished imaging', 'refurbished icu', 'refurbished imaging & icu equipment', 'refurbished equipment'],
  'refurbished': ['refurbished', 'pre-owned', 'renewed', 'certified refurbished', 'used medical', 'restored', 'refurbished imaging', 'refurbished icu']
};

/**
 * Normalizes text for clean token-level comparison
 */
function cleanText(str: string | undefined | null): string {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Universal Category Matcher
 * Ensures that when a user selects or clicks any category or subcategory name,
 * ALL matching products under that category hierarchy or matching subcategories/names are accurately returned.
 */
export function isCategoryMatch(
  product: Product,
  selectedCategoryName: string,
  categoriesList: Category[] = []
): boolean {
  if (!selectedCategoryName || selectedCategoryName.trim().toLowerCase() === 'all' || selectedCategoryName.trim() === '') {
    return true;
  }

  const targetRaw = selectedCategoryName.trim();
  const target = targetRaw.toLowerCase();
  const targetClean = cleanText(target);
  const targetTokens = targetClean.split(' ').filter(t => t.length > 1);

  const pCat = (product.category || '').trim().toLowerCase();
  const pCatClean = cleanText(pCat);
  const pCatId = ((product as any).categoryId || '').trim().toLowerCase();
  const pSub = (product.subcategory || '').trim().toLowerCase();
  const pSubClean = cleanText(pSub);
  const pName = (product.name || '').trim().toLowerCase();
  const pNameClean = cleanText(pName);
  const pDesc = cleanText(product.description || '');
  const pTags = Array.isArray((product as any).tags) 
    ? ((product as any).tags as string[]).map(t => cleanText(t)).join(' ')
    : cleanText((product as any).tags || '');

  // 1. Direct equality check on category, categoryId, subcategory
  if (pCat === target || pCatId === target || pSub === target) {
    return true;
  }

  // 2. Direct equality or inclusion in cleaned text
  if (pCatClean === targetClean || pSubClean === targetClean) {
    return true;
  }

  // 3. Check if target string appears in product name or category or subcategory
  if (pNameClean.includes(targetClean) || (targetClean.length > 3 && pCatClean.includes(targetClean)) || (targetClean.length > 3 && pSubClean.includes(targetClean))) {
    return true;
  }

  // 4. Refurbished Equipment special category
  if (target.includes('refurbished')) {
    if (
      pCat.includes('refurbished') ||
      pSub.includes('refurbished') ||
      Boolean((product as any).isRefurbished) ||
      (product as any).condition === 'refurbished' ||
      (product as any).condition === 'used' ||
      pName.includes('refurbished') ||
      pTags.includes('refurbished') ||
      pDesc.includes('refurbished')
    ) {
      return true;
    }
  }

  // 5. Known Category object matching (checks parent category name & all its subcategories)
  const matchingCatObj = (categoriesList || []).find(
    c =>
      (c.name || '').trim().toLowerCase() === target ||
      cleanText(c.name) === targetClean ||
      (c.id || '').trim().toLowerCase() === target
  );

  if (matchingCatObj) {
    // If product category matches parent
    if (
      pCat === (matchingCatObj.name || '').trim().toLowerCase() ||
      pCatClean === cleanText(matchingCatObj.name) ||
      pCatId === (matchingCatObj.id || '').trim().toLowerCase()
    ) {
      return true;
    }

    // If product subcategory or name matches ANY subcategory under this category
    if (Array.isArray(matchingCatObj.subcategories)) {
      for (const sub of matchingCatObj.subcategories) {
        if (!sub) continue;
        const subLower = sub.trim().toLowerCase();
        const subClean = cleanText(sub);

        if (
          pSub === subLower ||
          pSubClean === subClean ||
          pCat === subLower ||
          pCatClean === subClean ||
          pNameClean.includes(subClean) ||
          (subClean.length > 3 && pSubClean.includes(subClean))
        ) {
          return true;
        }

        // Check if subcategory tokens match in product name
        const subTokens = subClean.split(' ').filter(t => t.length > 2);
        if (subTokens.length > 1 && subTokens.every(st => pNameClean.includes(st))) {
          return true;
        }
      }
    }
  }

  // 6. Reverse check: If target is a subcategory of any known category
  for (const c of categoriesList || []) {
    if (Array.isArray(c.subcategories)) {
      const isTargetSub = c.subcategories.some(s => 
        (s || '').trim().toLowerCase() === target || cleanText(s) === targetClean
      );
      if (isTargetSub) {
        // If this product matches the subcategory or product name contains it
        if (
          pSub === target ||
          pSubClean === targetClean ||
          pNameClean.includes(targetClean) ||
          pCat === target ||
          pCatClean === targetClean
        ) {
          return true;
        }
      }
    }
  }

  // 7. Check Medical Domain Synonyms & Keywords Dictionary
  for (const [catKey, synList] of Object.entries(MEDICAL_CATEGORY_SYNONYMS)) {
    const isCatKeyMatch = target.includes(catKey) || catKey.includes(targetClean);
    const isSynMatch = synList.some(s => targetClean.includes(s) || s === targetClean);

    if (isCatKeyMatch || isSynMatch) {
      // Check if product has any matching synonym in its name, category, or subcategory
      const matchesAnySyn = synList.some(syn => {
        const synClean = cleanText(syn);
        return (
          pNameClean.includes(synClean) ||
          pSubClean.includes(synClean) ||
          pCatClean.includes(synClean) ||
          pTags.includes(synClean)
        );
      });

      if (matchesAnySyn) {
        return true;
      }
    }
  }

  // 8. Multi-token comprehensive match: If all non-stop tokens of target exist in product name + category + subcategory
  if (targetTokens.length > 0) {
    const combinedProductText = `${pNameClean} ${pCatClean} ${pSubClean} ${pTags} ${pDesc}`;
    const allTokensPresent = targetTokens.every(token => combinedProductText.includes(token));
    if (allTokensPresent) {
      return true;
    }
  }

  return false;
}

/**
 * Calculates a relevance score for ordering products when a category is selected.
 * Higher score = more relevant product displayed first.
 */
export function calculateCategoryRelevanceScore(
  product: Product,
  selectedCategoryName: string,
  categoriesList: Category[] = []
): number {
  if (!selectedCategoryName || selectedCategoryName.trim().toLowerCase() === 'all') {
    return 0;
  }

  const target = selectedCategoryName.trim().toLowerCase();
  const targetClean = cleanText(target);
  const pCat = (product.category || '').trim().toLowerCase();
  const pCatClean = cleanText(pCat);
  const pSub = (product.subcategory || '').trim().toLowerCase();
  const pSubClean = cleanText(pSub);
  const pNameClean = cleanText(product.name || '');

  let score = 0;

  // Exact Category match
  if (pCat === target || pCatClean === targetClean) {
    score += 100;
  }

  // Exact Subcategory match
  if (pSub === target || pSubClean === targetClean) {
    score += 90;
  }

  // Product name starts with or contains target
  if (pNameClean.startsWith(targetClean)) {
    score += 80;
  } else if (pNameClean.includes(targetClean)) {
    score += 60;
  }

  // Known Category subcategory exact match
  const matchingCatObj = (categoriesList || []).find(
    c => (c.name || '').trim().toLowerCase() === target || cleanText(c.name) === targetClean
  );

  if (matchingCatObj && Array.isArray(matchingCatObj.subcategories)) {
    for (const sub of matchingCatObj.subcategories) {
      const subClean = cleanText(sub);
      if (pSubClean === subClean) {
        score += 70;
      } else if (pNameClean.includes(subClean)) {
        score += 50;
      }
    }
  }

  // Bonus for verified stock or high rating
  if (product.rating && product.rating >= 4.8) {
    score += 5;
  }
  if (Boolean((product as any).featured)) {
    score += 5;
  }

  return score;
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
  const targetClean = cleanText(target);
  const subSet = new Set<string>();

  // 1. From categories list
  const catObj = (categoriesList || []).find(
    c =>
      (c.name || '').trim().toLowerCase() === target ||
      cleanText(c.name) === targetClean ||
      (c.id || '').trim().toLowerCase() === target
  );

  if (catObj && Array.isArray(catObj.subcategories)) {
    catObj.subcategories.forEach(s => {
      if (s && s.trim()) subSet.add(s.trim());
    });
  }

  // 2. From products matching this category
  (products || []).forEach(p => {
    if (isCategoryMatch(p, categoryName, categoriesList)) {
      if (p.subcategory && p.subcategory.trim()) {
        subSet.add(p.subcategory.trim());
      }
    }
  });

  return Array.from(subSet);
}
