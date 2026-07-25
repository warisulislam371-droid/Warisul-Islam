import { Product, Category } from '../types';
import { INITIAL_CATEGORIES } from '../data';

export interface CategoryDetectionResult {
  category: string;
  subcategory: string;
  confidence: number; // 0 to 100
  matchedKeywords: string[];
}

// Key term mappings to standard HealNex medical taxonomy
const TAXONOMY_MAPS: Array<{
  category: string;
  subcategory: string;
  keywords: string[];
}> = [
  // Medical Equipment
  {
    category: 'Medical Equipment',
    subcategory: 'ECG Machine',
    keywords: ['ecg', 'electrocardiograph', 'electrocardiogram', 'cabrera', 'lead ecg', 'holter', 'cardiac monitor', 'ekg']
  },
  {
    category: 'Medical Equipment',
    subcategory: 'Ventilator',
    keywords: ['ventilator', 'respirator', 'icu ventilator', 'bipap', 'cpap', 'tracheostomy ventilator', 'breathing machine']
  },
  {
    category: 'Medical Equipment',
    subcategory: 'Defibrillator',
    keywords: ['defibrillator', 'aed', 'pacer', 'cardioverter', 'shock paddle', 'biphasic']
  },
  {
    category: 'Medical Equipment',
    subcategory: 'Patient Monitor',
    keywords: ['patient monitor', 'multipara', 'multiparameter', 'vital signs', 'spo2 monitor', 'bedside monitor']
  },
  {
    category: 'Medical Equipment',
    subcategory: 'Infusion Pump',
    keywords: ['infusion pump', 'syringe pump', 'volumetric pump', 'iv pump', 'drip pump']
  },
  {
    category: 'Medical Equipment',
    subcategory: 'Ultrasound Machine',
    keywords: ['ultrasound', 'sonography', 'doppler', 'echocardiography', 'transducer', 'probe']
  },

  // Laboratory Equipment
  {
    category: 'Laboratory Equipment',
    subcategory: 'Microscope',
    keywords: ['microscope', 'binocular microscope', 'trinocular', 'fluorescence', 'microscopy', 'lens']
  },
  {
    category: 'Laboratory Equipment',
    subcategory: 'Centrifuge',
    keywords: ['centrifuge', 'microcentrifuge', 'hematocrit', 'refrigerated centrifuge', 'benchtop centrifuge']
  },
  {
    category: 'Laboratory Equipment',
    subcategory: 'Blood Analyzer',
    keywords: ['blood analyzer', 'hematology analyzer', 'cell counter', 'cbc machine', 'hemoglobinometer', 'blood gas']
  },
  {
    category: 'Laboratory Equipment',
    subcategory: 'Biochemistry Analyzer',
    keywords: ['biochemistry analyzer', 'semi auto analyzer', 'fully automated biochemistry', 'spectrophotometer', 'reagent analyzer']
  },

  // Dental Equipment
  {
    category: 'Dental Equipment',
    subcategory: 'Dental Chair',
    keywords: ['dental chair', 'dental unit', 'operatory chair', 'dental stool']
  },
  {
    category: 'Dental Equipment',
    subcategory: 'Dental Instruments',
    keywords: ['dental instrument', 'scaler', 'apex locator', 'handpiece', 'dental drill', 'curing light', 'dental mirror', 'forceps dental']
  },
  {
    category: 'Dental Equipment',
    subcategory: 'Dental X-Ray',
    keywords: ['dental x-ray', 'rvg', 'opg', 'intraoral camera', 'cbct dental']
  },

  // Surgical Instruments
  {
    category: 'Surgical Instruments',
    subcategory: 'Forceps',
    keywords: ['forceps', 'artery forceps', 'tissue forceps', 'thumb forceps', 'dissecting forceps', 'hemostat']
  },
  {
    category: 'Surgical Instruments',
    subcategory: 'Retractors',
    keywords: ['retractor', 'langhenbeck', 'self retaining retractor', 'deaver retractor', 'abdominal retractor']
  },
  {
    category: 'Surgical Instruments',
    subcategory: 'Scissors',
    keywords: ['surgical scissors', 'mayo scissors', 'metzenbaum', 'iris scissors', 'operating scissors', 'stitch scissors']
  },
  {
    category: 'Surgical Instruments',
    subcategory: 'Surgical Kits',
    keywords: ['surgical kit', 'delivery kit', 'laparoscopy kit', 'orthopedic set', 'general surgery set', 'scalpel set']
  },

  // Hospital Furniture
  {
    category: 'Hospital Furniture',
    subcategory: 'ICU Beds',
    keywords: ['icu bed', 'motorized bed', 'electric hospital bed', '5 function bed', '3 function bed', 'fowler bed']
  },
  {
    category: 'Hospital Furniture',
    subcategory: 'Hospital Beds',
    keywords: ['hospital bed', 'semi fowler', 'plain bed', 'ward bed', 'pediatric bed', 'attendant bed']
  },
  {
    category: 'Hospital Furniture',
    subcategory: 'Stretchers',
    keywords: ['stretcher', 'trolley stretcher', 'ambulance stretcher', 'transport stretcher', 'folding stretcher']
  },
  {
    category: 'Hospital Furniture',
    subcategory: 'Wheelchairs',
    keywords: ['wheelchair', 'motorized wheelchair', 'folding wheelchair', 'commode wheelchair', 'transit chair']
  },

  // Homecare Devices
  {
    category: 'Homecare Devices',
    subcategory: 'BP Monitor',
    keywords: ['bp monitor', 'blood pressure monitor', 'sphygmomanometer', 'digital bp']
  },
  {
    category: 'Homecare Devices',
    subcategory: 'Glucometer',
    keywords: ['glucometer', 'blood glucose', 'test strips', 'sugar monitor', 'lancing device']
  },
  {
    category: 'Homecare Devices',
    subcategory: 'Nebulizer',
    keywords: ['nebulizer', 'compressor nebulizer', 'mesh nebulizer', 'ultrasonic nebulizer']
  },
  {
    category: 'Homecare Devices',
    subcategory: 'Oxygen Concentrator',
    keywords: ['oxygen concentrator', '5l concentrator', '10l concentrator', 'portable oxygen', 'o2 generator']
  },
  {
    category: 'Homecare Devices',
    subcategory: 'Pulse Oximeter',
    keywords: ['pulse oximeter', 'fingertip oximeter', 'spo2 sensor']
  },

  // Consumables
  {
    category: 'Consumables',
    subcategory: 'Gloves',
    keywords: ['gloves', 'nitrile gloves', 'latex gloves', 'examination gloves', 'surgical gloves', 'powder free gloves']
  },
  {
    category: 'Consumables',
    subcategory: 'Masks',
    keywords: ['mask', 'n95', '3 ply mask', 'surgical mask', 'respirator mask', 'ffp2']
  },
  {
    category: 'Consumables',
    subcategory: 'Syringes',
    keywords: ['syringe', 'hypodermic needle', 'dispo van', 'insulin syringe', 'auto disable syringe']
  },
  {
    category: 'Consumables',
    subcategory: 'Catheters',
    keywords: ['catheter', 'foley catheter', 'suction catheter', 'central venous', 'nelaton']
  },
  {
    category: 'Consumables',
    subcategory: 'IV Sets',
    keywords: ['iv set', 'infusion set', 'blood transfusion set', 'cannula', 'iv cannula', 'scalp vein']
  },
  {
    category: 'Consumables',
    subcategory: 'PPE Kits',
    keywords: ['ppe kit', 'protective gown', 'face shield', 'shoe cover', 'surgeon cap']
  }
];

/**
 * Automatically detects the best Category and Subcategory for a product
 * based on its name, description, tags, and specifications.
 */
export function detectCategoryAndSubcategory(
  product: Partial<Product>,
  availableCategories: Category[] = INITIAL_CATEGORIES
): CategoryDetectionResult {
  const textToScan = [
    product.name || '',
    product.description || '',
    product.shortDescription || '',
    product.fullDescription || '',
    ...(product.tags || []),
    ...(product.specifications || []).map(s => `${s.key} ${s.value}`)
  ].join(' ').toLowerCase();

  let bestMatch: CategoryDetectionResult = {
    category: availableCategories[0]?.name || 'Medical Equipment',
    subcategory: availableCategories[0]?.subcategories?.[0] || 'General Equipment',
    confidence: 0,
    matchedKeywords: []
  };

  let maxScore = 0;

  for (const entry of TAXONOMY_MAPS) {
    let score = 0;
    const matches: string[] = [];

    for (const kw of entry.keywords) {
      if (textToScan.includes(kw)) {
        // Higher weight if keyword appears in product name
        const nameMatches = (product.name || '').toLowerCase().includes(kw);
        score += nameMatches ? 15 : 5;
        matches.push(kw);
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = {
        category: entry.category,
        subcategory: entry.subcategory,
        confidence: Math.min(100, score * 4),
        matchedKeywords: matches
      };
    }
  }

  // If score is 0, fall back to matching availableCategories by name
  if (maxScore === 0) {
    for (const cat of availableCategories) {
      if (textToScan.includes(cat.name.toLowerCase())) {
        bestMatch = {
          category: cat.name,
          subcategory: cat.subcategories?.[0] || cat.name,
          confidence: 40,
          matchedKeywords: [cat.name.toLowerCase()]
        };
        break;
      }
    }
  }

  return bestMatch;
}

/**
 * Asynchronously attempts to auto-classify product category and subcategory
 * using the server-side Gemini AI engine, with instant local fallback.
 */
export async function detectCategoryWithAI(
  product: Partial<Product>,
  availableCategories: Category[] = INITIAL_CATEGORIES
): Promise<CategoryDetectionResult & { aiReason?: string }> {
  try {
    const response = await fetch('/api/gemini/classify-category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: product.name,
        description: product.description || product.shortDescription || product.fullDescription,
        specifications: product.specifications,
        categories: availableCategories
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.category && data.subcategory) {
        return {
          category: data.category,
          subcategory: data.subcategory,
          confidence: data.confidence || 90,
          matchedKeywords: ['gemini-ai-classification'],
          aiReason: data.aiReason || 'Classified by Gemini Medical AI Taxonomy Model.'
        };
      }
    }
  } catch (err) {
    console.log('AI Category classification endpoint call failed, using local fallback:', err);
  }

  // Fallback to local keyword-driven taxonomy engine
  return detectCategoryAndSubcategory(product, availableCategories);
}

/**
 * Automatically sorts and auto-classifies a list of products.
 * Guarantees proper Category and Subcategory linking and clean sorting.
 */
export function autoSortAndClassifyProducts(
  products: Product[],
  categories: Category[] = INITIAL_CATEGORIES
): {
  updatedProducts: Product[];
  autoFixedCount: number;
} {
  let autoFixedCount = 0;

  const validCategoryNames = new Set(categories.map(c => c.name));
  const categorySubmap = new Map<string, string[]>();
  categories.forEach(c => categorySubmap.set(c.name, c.subcategories || []));

  const updatedProducts = products.map(p => {
    let category = p.category;
    let subcategory = p.subcategory;
    let wasModified = false;

    // Check if category or subcategory is missing, generic, or invalid
    const isCategoryInvalid = !category || !validCategoryNames.has(category) || category === 'General' || category === 'Uncategorized';
    const subList = categorySubmap.get(category) || [];
    const isSubcategoryInvalid = !subcategory || (subList.length > 0 && !subList.includes(subcategory));

    if (isCategoryInvalid || isSubcategoryInvalid) {
      const detected = detectCategoryAndSubcategory(p, categories);
      if (detected.confidence > 0) {
        category = detected.category;
        subcategory = detected.subcategory;
        wasModified = true;
        autoFixedCount++;
      } else if (isCategoryInvalid && categories.length > 0) {
        category = categories[0].name;
        subcategory = categories[0].subcategories?.[0] || 'General';
        wasModified = true;
        autoFixedCount++;
      }
    }

    return wasModified
      ? { ...p, category, subcategory, updatedAt: new Date().toISOString() }
      : p;
  });

  // Sort products systematically by Category name -> Subcategory name -> Product name
  updatedProducts.sort((a, b) => {
    const catComp = (a.category || '').localeCompare(b.category || '');
    if (catComp !== 0) return catComp;

    const subComp = (a.subcategory || '').localeCompare(b.subcategory || '');
    if (subComp !== 0) return subComp;

    return (a.name || '').localeCompare(b.name || '');
  });

  return {
    updatedProducts,
    autoFixedCount
  };
}

/**
 * Sorts Categories alphabetically and sorts their subcategories array cleanly.
 */
export function sortCategoriesTaxonomy(categories: Category[]): Category[] {
  return [...categories]
    .map(c => ({
      ...c,
      subcategories: c.subcategories ? [...c.subcategories].sort((a, b) => a.localeCompare(b)) : []
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
