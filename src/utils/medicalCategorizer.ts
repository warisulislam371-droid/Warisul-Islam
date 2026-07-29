import { Category, Product } from '../types';
import { INITIAL_CATEGORIES } from '../data';
import { getProductSeoUrl, getSubcategorySeoUrl, getCategorySeoUrl, slugify } from './seoUrls';

export interface CategorizationCandidate {
  category: string;
  subcategory: string;
  confidence: number; // 0 to 100
  reasoning: string;
}

export interface CategorizationResult {
  mainCategory: string;
  subcategory: string;
  confidenceScore: number; // 0 to 100
  status: 'AutoSelected' | 'Suggested' | 'NeedsAdminReview';
  suggestions: CategorizationCandidate[];
  matchedKeywords: string[];
  reasoning: string;
  needsAdminReview: boolean;
  seoCategoryUrl: string;
  seoSubcategoryUrl: string;
  seoProductUrl: string;
}

// Extensive Synonym & Medical Vocabulary Taxonomy Dictionary
export interface TaxonomyRule {
  category: string;
  subcategory: string;
  synonyms: string[];
  primaryTerms: string[]; // High weight terms (e.g. name matches)
}

export const MEDICAL_TAXONOMY_DICTIONARY: TaxonomyRule[] = [
  // Medical Equipment
  {
    category: 'Medical Equipment',
    subcategory: 'ECG Machine',
    primaryTerms: ['ecg', 'ekg', 'electrocardiograph', 'electrocardiogram', 'cabrera'],
    synonyms: ['12 lead ecg', '3 channel ecg', '6 channel ecg', 'cardiac monitor', 'holter monitor', 'electrocardiograf', 'heart monitor', 'ecg machine', 'cardio recorder']
  },
  {
    category: 'Medical Equipment',
    subcategory: 'Patient Monitor',
    primaryTerms: ['patient monitor', 'multipara', 'multiparameter', 'vital signs monitor', 'bedside monitor'],
    synonyms: ['spo2 monitor', 'nibp monitor', 'cardiac bedside monitor', 'vital monitor', 'icu monitor', 'patient tracker']
  },
  {
    category: 'Medical Equipment',
    subcategory: 'Defibrillator',
    primaryTerms: ['defibrillator', 'aed', 'biphasic defibrillator', 'cardioverter'],
    synonyms: ['defib', 'automated external defibrillator', 'pacer', 'shock paddle', 'cardiac shock', 'shock machine']
  },
  {
    category: 'Medical Equipment',
    subcategory: 'Ventilator',
    primaryTerms: ['ventilator', 'respirator', 'icu ventilator', 'bipap', 'cpap'],
    synonyms: ['breathing machine', 'tracheostomy ventilator', 'non invasive ventilator', 'transport ventilator', 'mechanical ventilator']
  },
  {
    category: 'Medical Equipment',
    subcategory: 'Infusion Pump',
    primaryTerms: ['infusion pump', 'syringe pump', 'volumetric pump'],
    synonyms: ['iv pump', 'drip pump', 'micro infusion pump', 'peristaltic pump', 'analgesia pump']
  },
  {
    category: 'Medical Equipment',
    subcategory: 'Ultrasound Machine',
    primaryTerms: ['ultrasound', 'sonography', 'echocardiography', 'doppler ultrasound'],
    synonyms: ['transducer', 'ultrasound probe', 'color doppler', 'echo machine', 'ultrasound scanner', '4d ultrasound']
  },
  {
    category: 'Medical Equipment',
    subcategory: 'X-Ray Machine',
    primaryTerms: ['x-ray', 'xray', 'c-arm', 'digital radiography', 'dr system'],
    synonyms: ['radiography machine', 'portable x-ray', 'fluoroscopy', 'radiology system', 'x ray unit']
  },
  {
    category: 'Medical Equipment',
    subcategory: 'MRI',
    primaryTerms: ['mri', 'magnetic resonance imaging'],
    synonyms: ['mri scanner', 'mri machine', 'tesla mri', 'magnetic resonance']
  },
  {
    category: 'Medical Equipment',
    subcategory: 'CT Scanner',
    primaryTerms: ['ct scanner', 'computed tomography', 'cat scan'],
    synonyms: ['slice ct', 'ct machine', 'tomography scanner', 'multislice ct']
  },
  {
    category: 'Medical Equipment',
    subcategory: 'OT Light & Table',
    primaryTerms: ['ot light', 'ot table', 'operating light', 'operating table', 'surgical light'],
    synonyms: ['shadowless light', 'operating theater light', 'hydraulic ot table', 'c-arm compatible table', 'surgical bed']
  },

  // Hospital Furniture
  {
    category: 'Hospital Furniture',
    subcategory: 'ICU Beds',
    primaryTerms: ['icu bed', 'motorized bed', 'electric hospital bed', '5 function bed'],
    synonyms: ['3 function bed', 'fowler bed', 'motorized icu bed', 'hi low hospital bed', 'electric icu bed']
  },
  {
    category: 'Hospital Furniture',
    subcategory: 'Hospital Beds',
    primaryTerms: ['hospital bed', 'semi fowler', 'plain bed', 'ward bed'],
    synonyms: ['pediatric bed', 'attendant bed', 'patient bed', 'manual hospital bed', 'side railing bed']
  },
  {
    category: 'Hospital Furniture',
    subcategory: 'Wheelchairs',
    primaryTerms: ['wheelchair', 'motorized wheelchair', 'folding wheelchair'],
    synonyms: ['commode wheelchair', 'transit chair', 'wheel chair', 'electric wheelchair', 'lightweight wheelchair']
  },
  {
    category: 'Hospital Furniture',
    subcategory: 'Stretchers',
    primaryTerms: ['stretcher', 'trolley stretcher', 'ambulance stretcher', 'transport stretcher'],
    synonyms: ['folding stretcher', 'scoop stretcher', 'patient transfer trolley', 'emergency stretcher']
  },

  // Homecare Devices
  {
    category: 'Homecare Devices',
    subcategory: 'Oxygen Concentrator',
    primaryTerms: ['oxygen concentrator', 'o2 generator', 'portable oxygen'],
    synonyms: ['5l concentrator', '10l concentrator', 'oxygen machine', 'concentrator', 'oxygen plant portable']
  },
  {
    category: 'Homecare Devices',
    subcategory: 'Nebulizer',
    primaryTerms: ['nebulizer', 'compressor nebulizer', 'mesh nebulizer'],
    synonyms: ['ultrasonic nebulizer', 'nebuliser', 'inhaler machine', 'steam nebulizer']
  },
  {
    category: 'Homecare Devices',
    subcategory: 'Pulse Oximeter',
    primaryTerms: ['pulse oximeter', 'oximeter', 'fingertip oximeter'],
    synonyms: ['spo2 sensor', 'finger pulse oximeter', 'spo2 meter', 'pulse meter']
  },
  {
    category: 'Homecare Devices',
    subcategory: 'BP Monitor',
    primaryTerms: ['bp monitor', 'sphygmomanometer', 'blood pressure monitor'],
    synonyms: ['digital bp', 'bp apparatus', 'aneroid bp', 'mercury bp', 'bp cuff digital']
  },
  {
    category: 'Homecare Devices',
    subcategory: 'Glucometer',
    primaryTerms: ['glucometer', 'blood glucose meter', 'sugar monitor'],
    synonyms: ['test strips', 'lancing device', 'glucose monitor', 'sugar test machine']
  },

  // Consumables & Accessories
  {
    category: 'Consumables',
    subcategory: 'Accessories & Cables',
    primaryTerms: ['ecg cable', 'spo2 sensor cable', 'nibp cuff', 'etco2 accessory', 'patient monitor cable'],
    synonyms: ['ecg lead wire', 'oximeter sensor', 'nibp hose', 'temp probe', 'defib pads', 'grounding pad']
  },
  {
    category: 'Consumables',
    subcategory: 'Blood Collection Tube',
    primaryTerms: ['blood collection tube', 'vacutainer', 'edta tube'],
    synonyms: ['clot activator tube', 'sodium heparin tube', 'glucose tube', 'blood sample tube', 'vacutainer needle']
  },
  {
    category: 'Consumables',
    subcategory: 'Catheters',
    primaryTerms: ['catheter', 'foley catheter', 'suction catheter', 'nelaton catheter'],
    synonyms: ['central venous catheter', 'urology catheter', '3 way foley', 'silicone catheter', 'foley balloon']
  },
  {
    category: 'Consumables',
    subcategory: 'Syringes',
    primaryTerms: ['syringe', 'hypodermic needle', 'dispo van', 'insulin syringe'],
    synonyms: ['syringe with needle', 'luer lock syringe', 'auto disable syringe', 'syrenge', '2ml syringe', '5ml syringe']
  },
  {
    category: 'Consumables',
    subcategory: 'Gloves',
    primaryTerms: ['gloves', 'nitrile gloves', 'latex gloves', 'examination gloves'],
    synonyms: ['surgical gloves', 'powder free gloves', 'sterile gloves', 'disposable gloves', 'hand gloves']
  },
  {
    category: 'Consumables',
    subcategory: 'PPE Kits & Masks',
    primaryTerms: ['ppe kit', 'mask', 'n95', '3 ply mask', 'face shield'],
    synonyms: ['protective gown', 'surgeon cap', 'shoe cover', 'ffp2 mask', 'kn95 mask', 'isolation gown']
  },

  // Surgical Instruments
  {
    category: 'Surgical Instruments',
    subcategory: 'Surgical Instruments',
    primaryTerms: ['surgical instrument', 'forceps', 'scissors', 'scalpel', 'retractor'],
    synonyms: ['artery forceps', 'metzenbaum scissors', 'needle holder', 'surgical blade', 'dissecting set', 'tissue forceps', 'scalpel handle']
  },

  // Laboratory Equipment
  {
    category: 'Laboratory Equipment',
    subcategory: 'Microscope',
    primaryTerms: ['microscope', 'binocular microscope', 'trinocular microscope'],
    synonyms: ['fluorescence microscope', 'optical microscope', 'lab microscope', 'student microscope']
  },
  {
    category: 'Laboratory Equipment',
    subcategory: 'Centrifuge',
    primaryTerms: ['centrifuge', 'microcentrifuge', 'benchtop centrifuge'],
    synonyms: ['hematocrit centrifuge', 'refrigerated centrifuge', 'prp centrifuge', 'tube centrifuge']
  },
  {
    category: 'Laboratory Equipment',
    subcategory: 'Laboratory Analyzer',
    primaryTerms: ['laboratory analyzer', 'biochemistry analyzer', 'hematology analyzer', 'cell counter'],
    synonyms: ['cbc machine', 'hemoglobinometer', 'blood gas analyzer', 'semi auto analyzer', 'fully auto analyzer']
  }
];

/**
 * Normalizes input string for fuzzy and abbreviation comparison.
 * Ignores punctuation, multiple spaces, common typos, and case differences.
 */
export function normalizeMedicalText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates string similarity / fuzzy match score between 0 and 100.
 */
export function getFuzzyScore(input: string, target: string): number {
  const normInput = normalizeMedicalText(input);
  const normTarget = normalizeMedicalText(target);

  if (!normInput || !normTarget) return 0;
  if (normInput === normTarget) return 100;
  if (normInput.includes(normTarget) || normTarget.includes(normInput)) return 85;

  // Word overlap comparison
  const inputWords = normInput.split(' ').filter(w => w.length > 2);
  const targetWords = normTarget.split(' ').filter(w => w.length > 2);

  if (inputWords.length === 0 || targetWords.length === 0) return 0;

  let matches = 0;
  for (const iw of inputWords) {
    if (targetWords.some(tw => tw === iw || tw.includes(iw) || iw.includes(tw))) {
      matches++;
    }
  }

  return Math.round((matches / Math.max(inputWords.length, targetWords.length)) * 80);
}

/**
 * Fast deterministic local categorizer with synonym & fuzzy matching.
 */
export function categorizeProductLocally(productData: {
  name: string;
  brand?: string;
  description?: string;
  keywords?: string[];
  specifications?: any[];
  sku?: string;
}): CategorizationResult {
  const normName = normalizeMedicalText(productData.name || '');
  const normBrand = normalizeMedicalText(productData.brand || '');
  const normDesc = normalizeMedicalText(productData.description || '');
  const normSku = normalizeMedicalText(productData.sku || '');
  const normTags = (productData.keywords || []).map(normalizeMedicalText).join(' ');
  const normSpecs = (productData.specifications || [])
    .map(s => typeof s === 'string' ? s : `${s.key || ''} ${s.value || ''}`)
    .map(normalizeMedicalText)
    .join(' ');

  const fullSearchText = `${normName} ${normBrand} ${normTags} ${normSku} ${normSpecs} ${normDesc}`;

  const candidatesMap = new Map<string, { candidate: CategorizationCandidate; score: number; matches: string[] }>();

  for (const rule of MEDICAL_TAXONOMY_DICTIONARY) {
    const key = `${rule.category}::${rule.subcategory}`;
    let score = 0;
    const matchedKeywords: string[] = [];

    // Check primary terms (High Weight)
    for (const term of rule.primaryTerms) {
      if (normName.includes(term)) {
        score += 45; // Name match gives huge confidence
        matchedKeywords.push(`Primary Name: "${term}"`);
      } else if (fullSearchText.includes(term)) {
        score += 25;
        matchedKeywords.push(`Primary Context: "${term}"`);
      }
    }

    // Check synonyms (Medium Weight)
    for (const syn of rule.synonyms) {
      if (normName.includes(syn)) {
        score += 35;
        matchedKeywords.push(`Synonym Name: "${syn}"`);
      } else if (fullSearchText.includes(syn)) {
        score += 15;
        matchedKeywords.push(`Synonym Context: "${syn}"`);
      }
    }

    // Fuzzy matching bonus
    const fuzzyNameScore = getFuzzyScore(normName, rule.subcategory);
    if (fuzzyNameScore > 50) {
      score += Math.round(fuzzyNameScore * 0.25);
      matchedKeywords.push(`Fuzzy Subcategory Match (${fuzzyNameScore}%)`);
    }

    if (score > 0) {
      const capScore = Math.min(98, score);
      candidatesMap.set(key, {
        candidate: {
          category: rule.category,
          subcategory: rule.subcategory,
          confidence: capScore,
          reasoning: `Matched medical vocabulary (${matchedKeywords.slice(0, 3).join(', ')})`
        },
        score: capScore,
        matches: matchedKeywords
      });
    }
  }

  // Sort candidates by score descending
  const sortedCandidates = Array.from(candidatesMap.values())
    .sort((a, b) => b.score - a.score);

  if (sortedCandidates.length === 0) {
    // Unclassified fallback
    const mainCategory = 'Medical Equipment';
    const subcategory = 'General Equipment';
    const confidenceScore = 30;

    return {
      mainCategory,
      subcategory,
      confidenceScore,
      status: 'NeedsAdminReview',
      needsAdminReview: true,
      suggestions: [
        { category: 'Medical Equipment', subcategory: 'General Equipment', confidence: 30, reasoning: 'Unrecognized medical terms. Defaulting to review.' },
        { category: 'Consumables', subcategory: 'General Supplies', confidence: 25, reasoning: 'Secondary general category.' },
        { category: 'Hospital Furniture', subcategory: 'General Furniture', confidence: 20, reasoning: 'Tertiary general category.' }
      ],
      matchedKeywords: [],
      reasoning: 'Product title and description do not closely match known clinical equipment keywords. Marked for Admin Compliance Review.',
      seoCategoryUrl: getCategorySeoUrl(mainCategory),
      seoSubcategoryUrl: getSubcategorySeoUrl(mainCategory, subcategory),
      seoProductUrl: getProductSeoUrl(mainCategory, subcategory, productData.name, productData.brand)
    };
  }

  const topMatch = sortedCandidates[0];
  const confidenceScore = topMatch.score;

  let status: 'AutoSelected' | 'Suggested' | 'NeedsAdminReview' = 'Suggested';
  let needsAdminReview = false;

  if (confidenceScore >= 90) {
    status = 'AutoSelected';
    needsAdminReview = false;
  } else if (confidenceScore >= 60) {
    status = 'Suggested';
    needsAdminReview = false;
  } else {
    status = 'NeedsAdminReview';
    needsAdminReview = true;
  }

  // Generate top 3 suggestions
  const suggestions: CategorizationCandidate[] = sortedCandidates
    .slice(0, 3)
    .map(c => c.candidate);

  // Pad suggestions if fewer than 3
  if (suggestions.length < 3) {
    const fallbackOptions = [
      { category: 'Medical Equipment', subcategory: 'Diagnostic Devices', confidence: Math.max(10, confidenceScore - 20), reasoning: 'Broad medical equipment category' },
      { category: 'Consumables', subcategory: 'Medical Supplies', confidence: Math.max(10, confidenceScore - 30), reasoning: 'Broad medical supplies' },
      { category: 'Homecare Devices', subcategory: 'Monitoring Devices', confidence: Math.max(10, confidenceScore - 40), reasoning: 'Broad homecare devices' }
    ];

    for (const fb of fallbackOptions) {
      if (suggestions.length >= 3) break;
      if (!suggestions.some(s => s.category === fb.category && s.subcategory === fb.subcategory)) {
        suggestions.push(fb);
      }
    }
  }

  const mainCategory = topMatch.candidate.category;
  const subcategory = topMatch.candidate.subcategory;

  return {
    mainCategory,
    subcategory,
    confidenceScore,
    status,
    needsAdminReview,
    suggestions,
    matchedKeywords: topMatch.matches,
    reasoning: topMatch.candidate.reasoning,
    seoCategoryUrl: getCategorySeoUrl(mainCategory),
    seoSubcategoryUrl: getSubcategorySeoUrl(mainCategory, subcategory),
    seoProductUrl: getProductSeoUrl(mainCategory, subcategory, productData.name, productData.brand)
  };
}

export interface ProductCategoryAuditResult {
  productId: string;
  productName: string;
  sku: string;
  currentCategory: string;
  currentSubcategory: string;
  recommendedCategory: string;
  recommendedSubcategory: string;
  recommendedHsnCode: string;
  recommendedGstRate: number;
  issueType: 'COMPLIANT' | 'MISCLASSIFIED_CATEGORY' | 'UNCATEGORIZED' | 'TAX_HSN_MISMATCH' | 'MISSING_SUBCATEGORY';
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  confidenceScore: number;
  auditNotes: string;
}

export interface CatalogCategoryAuditReport {
  timestamp: string;
  totalAudited: number;
  compliantCount: number;
  misclassifiedCount: number;
  uncategorizedCount: number;
  taxHsnFixCount: number;
  auditResults: ProductCategoryAuditResult[];
  summaryInsight: string;
}

export function auditProductsLocally(products: Product[]): CatalogCategoryAuditReport {
  const auditResults: ProductCategoryAuditResult[] = (products || []).map(p => {
    const localCat = categorizeProductLocally({
      name: p.name,
      brand: p.brand,
      description: p.description,
      specifications: p.specifications,
      sku: p.sku
    });

    const currentCat = (p.category || '').trim();
    const currentSub = (p.subcategory || '').trim();
    const recommendedCat = localCat.mainCategory;
    const recommendedSub = localCat.subcategory;

    let recHsn = p.hsnCode || '9018';
    let recGst = p.gstRate || 12;

    if (recommendedCat === 'Medical Equipment') {
      recHsn = p.hsnCode && p.hsnCode !== 'N/A' ? p.hsnCode : '9018';
      recGst = 12;
    } else if (recommendedCat === 'Hospital Furniture') {
      recHsn = p.hsnCode && p.hsnCode !== 'N/A' ? p.hsnCode : '9402';
      recGst = 18;
    } else if (recommendedCat === 'Consumables') {
      recHsn = p.hsnCode && p.hsnCode !== 'N/A' ? p.hsnCode : '9018';
      recGst = 12;
    } else if (recommendedCat === 'Homecare Devices') {
      recHsn = p.hsnCode && p.hsnCode !== 'N/A' ? p.hsnCode : '9019';
      recGst = 12;
    } else if (recommendedCat === 'Laboratory Equipment') {
      recHsn = p.hsnCode && p.hsnCode !== 'N/A' ? p.hsnCode : '9027';
      recGst = 18;
    }

    let issueType: ProductCategoryAuditResult['issueType'] = 'COMPLIANT';
    let severity: ProductCategoryAuditResult['severity'] = 'NONE';
    let notes = `Product categorized correctly in taxonomy under ${recommendedCat} -> ${recommendedSub}.`;

    if (!currentCat || currentCat === 'Uncategorized' || currentCat === 'General') {
      issueType = 'UNCATEGORIZED';
      severity = 'HIGH';
      notes = `Product lacks verified main medical category. Gemini auto-assigned to ${recommendedCat} -> ${recommendedSub}.`;
    } else if (currentCat.toLowerCase() !== recommendedCat.toLowerCase()) {
      issueType = 'MISCLASSIFIED_CATEGORY';
      severity = 'HIGH';
      notes = `Category conflict detected: currently labeled "${currentCat}" but clinical keywords map to "${recommendedCat} (${recommendedSub})".`;
    } else if (currentSub && recommendedSub && currentSub.toLowerCase() !== recommendedSub.toLowerCase()) {
      issueType = 'MISSING_SUBCATEGORY';
      severity = 'MEDIUM';
      notes = `Subcategory refinement suggested: current "${currentSub}" vs clinical optimal "${recommendedSub}".`;
    } else if (!p.hsnCode || p.hsnCode === 'N/A' || p.hsnCode === '9999' || !p.gstRate) {
      issueType = 'TAX_HSN_MISMATCH';
      severity = 'LOW';
      notes = `GST/HSN tax code requires standardized B2B classification (${recHsn}, ${recGst}% GST).`;
    }

    return {
      productId: p.id,
      productName: p.name,
      sku: p.sku || 'N/A',
      currentCategory: currentCat || 'Uncategorized',
      currentSubcategory: currentSub || 'General',
      recommendedCategory: recommendedCat,
      recommendedSubcategory: recommendedSub,
      recommendedHsnCode: recHsn,
      recommendedGstRate: recGst,
      issueType,
      severity,
      confidenceScore: localCat.confidenceScore,
      auditNotes: notes
    };
  });

  const totalAudited = auditResults.length;
  const compliantCount = auditResults.filter(r => r.issueType === 'COMPLIANT').length;
  const misclassifiedCount = auditResults.filter(r => r.issueType === 'MISCLASSIFIED_CATEGORY' || r.issueType === 'MISSING_SUBCATEGORY').length;
  const uncategorizedCount = auditResults.filter(r => r.issueType === 'UNCATEGORIZED').length;
  const taxHsnFixCount = auditResults.filter(r => r.issueType === 'TAX_HSN_MISMATCH').length;

  return {
    timestamp: new Date().toISOString(),
    totalAudited,
    compliantCount,
    misclassifiedCount,
    uncategorizedCount,
    taxHsnFixCount,
    auditResults,
    summaryInsight: `Audit completed across ${totalAudited} products. Found ${misclassifiedCount} category misclassifications, ${uncategorizedCount} uncategorized items, and ${taxHsnFixCount} tax/HSN code recommendations.`
  };
}
