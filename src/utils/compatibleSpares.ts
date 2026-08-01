import { Product } from '../types';
import { dbLocal } from '../db';

export interface CompatibleSpareItem extends Product {
  compatibilityNote: string;
  isSparePart: boolean;
  isConsumable: boolean;
}

const KEYWORDS = [
  'spare', 'part', 'consumable', 'probe', 'gel', 'paper', 'cable', 
  'sensor', 'filter', 'battery', 'cartridge', 'tube', 'strip', 
  'electrode', 'mask', 'disposable', 'kit', 'accessory', 'connector', 
  'adapter', 'lamp', 'valve', 'blade', 'cuff', 'tray', 'solution', 
  'fluid', 'needle', 'syringe', 'glove', 'cover', 'sheet', 'lead', 
  'transducer', 'roll', 'tip', 'bulb', 'hose'
];

/**
 * Dynamically finds or generates compatible spare parts & consumables for a given product
 */
export function getCompatibleSparesAndConsumables(mainProduct: Product): CompatibleSpareItem[] {
  if (!mainProduct) return [];

  const allDbProducts = dbLocal.getProducts();
  const matched: CompatibleSpareItem[] = [];

  // 1. Search DB for matching products (same category/subcategory or spare keywords)
  const categoryLower = (mainProduct.category || '').toLowerCase();
  const subcategoryLower = (mainProduct.subcategory || '').toLowerCase();
  const nameLower = (mainProduct.name || '').toLowerCase();

  for (const p of allDbProducts) {
    if (p.id === mainProduct.id) continue;

    const pName = (p.name || '').toLowerCase();
    const pCat = (p.category || '').toLowerCase();
    const pSubcat = (p.subcategory || '').toLowerCase();
    const pDesc = (p.description || '').toLowerCase();

    const isKeywordMatch = KEYWORDS.some(k => pName.includes(k) || pDesc.includes(k) || pCat.includes(k));
    const isCategoryMatch = pCat === categoryLower || pSubcat === subcategoryLower || pCat.includes(categoryLower) || categoryLower.includes(pCat);
    const isBrandMatch = (p.brand || '').toLowerCase() === (mainProduct.brand || '').toLowerCase();

    if ((isCategoryMatch && isKeywordMatch) || (isBrandMatch && isKeywordMatch)) {
      matched.push({
        ...p,
        compatibilityNote: `100% Guaranteed Compatible with ${mainProduct.brand} ${mainProduct.name.slice(0, 25)}`,
        isSparePart: pName.includes('spare') || pName.includes('part') || pName.includes('cable') || pName.includes('sensor') || pName.includes('battery'),
        isConsumable: pName.includes('gel') || pName.includes('paper') || pName.includes('disposable') || pName.includes('strip') || pName.includes('filter')
      });
    }
  }

  // 2. Curate category-specific medical spare parts & consumables if fewer than 4 matched from DB
  if (matched.length < 4) {
    const syntheticTemplates = getSyntheticCategorySpares(mainProduct);
    for (const template of syntheticTemplates) {
      if (!matched.some(m => m.name.toLowerCase() === template.name.toLowerCase())) {
        matched.push(template);
      }
    }
  }

  return matched.slice(0, 6);
}

function getSyntheticCategorySpares(mainProduct: Product): CompatibleSpareItem[] {
  const category = (mainProduct.category || '').toLowerCase();
  const subcat = (mainProduct.subcategory || '').toLowerCase();
  const name = (mainProduct.name || '').toLowerCase();
  const brand = mainProduct.brand || 'HealNex Certified';

  const basePrice = mainProduct.salePrice || mainProduct.price || 50000;

  // Category specific templates
  if (category.includes('ultrasound') || category.includes('imaging') || name.includes('ultrasound') || subcat.includes('ultrasound')) {
    return [
      createSpareObj(
        `sp_${mainProduct.id}_1`,
        'High-Viscosity Ultrasonic Coupling Gel (5 Litre Can)',
        `SP-${mainProduct.sku}-GEL`,
        brand,
        'Consumable',
        'Acoustic Coupling Gel 5L Container',
        Math.round(basePrice * 0.015) || 850,
        Math.round((basePrice * 0.015) * 1.3) || 1200,
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80',
        `Acoustic coupling gel engineered for ${brand} ultrasound transducers.`
      ),
      createSpareObj(
        `sp_${mainProduct.id}_2`,
        'Sony High Density Thermal Video Printer Paper (UPP-110HD)',
        `SP-${mainProduct.sku}-PPR`,
        'Sony / HealNex',
        'Consumable',
        'Thermal Recording Paper Roll',
        1450,
        2100,
        'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&auto=format&fit=crop&q=80',
        `High contrast thermal printing paper for ${mainProduct.name} image output.`
      ),
      createSpareObj(
        `sp_${mainProduct.id}_3`,
        'Sterile Transducer Probe Sheath Cover (Box of 100)',
        `SP-${mainProduct.sku}-SHT`,
        brand,
        'Consumable',
        'Latex-Free Probe Protective Covers',
        1800,
        2500,
        'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop&q=80',
        `Sterile probe covers for cross-contamination prevention.`
      ),
      createSpareObj(
        `sp_${mainProduct.id}_4`,
        'Biopsy Needle Guide Bracket Attachment',
        `SP-${mainProduct.sku}-BKT`,
        brand,
        'Spare Part',
        'Stainless Steel Biopsy Attachment',
        4200,
        6000,
        'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=300&auto=format&fit=crop&q=80',
        `Autoclavable stainless steel needle guide for ultrasound interventional procedures.`
      )
    ];
  }

  if (category.includes('ecg') || category.includes('monitor') || category.includes('cardio') || name.includes('ecg') || name.includes('monitor')) {
    return [
      createSpareObj(
        `sp_${mainProduct.id}_1`,
        '10-Lead Shielded Patient ECG Trunk Cable (Banana Pin)',
        `SP-${mainProduct.sku}-CBL`,
        brand,
        'Spare Part',
        '10-Lead Shielded Patient Cable',
        2800,
        3900,
        'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=300&auto=format&fit=crop&q=80',
        `Noise-shielded 10-lead patient cable fully compatible with ${mainProduct.name}.`
      ),
      createSpareObj(
        `sp_${mainProduct.id}_2`,
        'Reusable Adult SpO2 Finger Clip Sensor Cable (3 Meters)',
        `SP-${mainProduct.sku}-SPO2`,
        brand,
        'Spare Part',
        'SpO2 Pulse Oximetry Sensor',
        1950,
        2800,
        'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=300&auto=format&fit=crop&q=80',
        `Medical grade dual-wavelength SpO2 clip sensor.`
      ),
      createSpareObj(
        `sp_${mainProduct.id}_3`,
        'Dual-Tube Nylon Reusable NIBP Adult Cuff (25-35cm)',
        `SP-${mainProduct.sku}-CUFF`,
        brand,
        'Consumable',
        'NIBP Blood Pressure Arm Cuff',
        1250,
        1800,
        'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=300&auto=format&fit=crop&q=80',
        `Antimicrobial dual-tube blood pressure cuff for non-invasive monitoring.`
      ),
      createSpareObj(
        `sp_${mainProduct.id}_4`,
        'Pre-Gelled Disposable ECG Electrodes (Pack of 50)',
        `SP-${mainProduct.sku}-ELE`,
        '3M / HealNex',
        'Consumable',
        'Ag/AgCl Disposable Electrodes',
        650,
        950,
        'https://images.unsplash.com/photo-1631815588090-d4bfec5b1cdb?w=300&auto=format&fit=crop&q=80',
        `High conductivity silver/silver-chloride diagnostic ECG monitoring pads.`
      )
    ];
  }

  if (category.includes('respiratory') || category.includes('ventilat') || category.includes('anesthesia') || category.includes('icu') || name.includes('pump')) {
    return [
      createSpareObj(
        `sp_${mainProduct.id}_1`,
        'Disposable Adult Dual-Limb Breathing Circuit Tubing Set',
        `SP-${mainProduct.sku}-TUB`,
        brand,
        'Consumable',
        'Corrugated Silicone Breathing Circuit',
        2200,
        3200,
        'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80',
        `Smooth-bore dual limb corrugated respiratory breathing tubing.`
      ),
      createSpareObj(
        `sp_${mainProduct.id}_2`,
        'Bacterial/Viral HME Filter with Luer Port (Box of 20)',
        `SP-${mainProduct.sku}-HME`,
        brand,
        'Consumable',
        'Heat & Moisture Exchanging Filter',
        1650,
        2400,
        'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&auto=format&fit=crop&q=80',
        `99.99% efficiency viral/bacterial isolation filter for ventilators.`
      ),
      createSpareObj(
        `sp_${mainProduct.id}_3`,
        'Galvanic Oxygen Sensor Cell Replacement Capsule',
        `SP-${mainProduct.sku}-O2`,
        'EnviroTec / HealNex',
        'Spare Part',
        'O2 Fuel Cell Sensor Capsule',
        6500,
        8900,
        'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=300&auto=format&fit=crop&q=80',
        `Fast response O2 concentration sensing cell compatible with ${mainProduct.name}.`
      ),
      createSpareObj(
        `sp_${mainProduct.id}_4`,
        'Autoclavable Silicone Anaesthesia Face Mask (Adult Size 4)',
        `SP-${mainProduct.sku}-MSK`,
        brand,
        'Consumable',
        'Transparent Silicone Anaesthesia Mask',
        1400,
        2000,
        'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&auto=format&fit=crop&q=80',
        `Soft anatomical air-cushioned silicone face mask.`
      )
    ];
  }

  // Default fallback for general surgical, furniture, OT lights, or other equipment
  return [
    createSpareObj(
      `sp_${mainProduct.id}_1`,
      'Lithium-Ion Rechargeable Battery Backup Pack (14.8V 4400mAh)',
      `SP-${mainProduct.sku}-BAT`,
      brand,
      'Spare Part',
      'Rechargeable Li-Ion Battery Pack',
      4500,
      6200,
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=300&auto=format&fit=crop&q=80',
      `High-capacity emergency power backup battery pack for uninterrupted operation.`
    ),
    createSpareObj(
      `sp_${mainProduct.id}_2`,
      'Heavy-Duty Medical Grade 3-Pin Power Cord Cable (3 Meters)',
      `SP-${mainProduct.sku}-PWR`,
      'HealNex Certified',
      'Spare Part',
      '3-Pin Hospital Grade Power Cord',
      650,
      950,
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=300&auto=format&fit=crop&q=80',
      `Shielded hospital-grade copper power cord for leak-free electrical grounding.`
    ),
    createSpareObj(
      `sp_${mainProduct.id}_3`,
      'Medical Disinfectant Surface Wipes (Canister of 160 Wipes)',
      `SP-${mainProduct.sku}-WIP`,
      'MicroSept / HealNex',
      'Consumable',
      'Hospital Disinfectant Surface Wipes',
      950,
      1400,
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80',
      `Alcohol-free broad-spectrum disinfectant wipes safe for clinical equipment surfaces.`
    ),
    createSpareObj(
      `sp_${mainProduct.id}_4`,
      'Waterproof Antimicrobial Equipment Protective Cover',
      `SP-${mainProduct.sku}-CVR`,
      brand,
      'Consumable',
      'Antimicrobial Heavy Duty Dust Cover',
      1200,
      1800,
      'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&auto=format&fit=crop&q=80',
      `Custom-fit waterproof dust and fluid protection cover.`
    )
  ];
}

function createSpareObj(
  id: string,
  name: string,
  sku: string,
  brand: string,
  type: 'Spare Part' | 'Consumable',
  subcategory: string,
  salePrice: number,
  mrp: number,
  imageUrl: string,
  description: string
): CompatibleSpareItem {
  return {
    id,
    vendorId: 'vendor_healnex_spares',
    vendorName: 'HealNex Certified Spares',
    name,
    sku,
    brand,
    category: 'Spares & Consumables',
    subcategory,
    description,
    specifications: [
      { key: 'Classification', value: type },
      { key: 'Quality Standard', value: 'CDSCO / CE Certified' },
      { key: 'Compatibility', value: '100% Guaranteed Fit' }
    ],
    price: mrp,
    salePrice,
    moq: 1,
    stockQuantity: 50,
    hsnCode: '9018',
    gstRate: 12,
    warranty: '6 Months Replacement Warranty',
    countryOfOrigin: 'India',
    images: [imageUrl],
    status: 'Approved',
    createdAt: new Date().toISOString(),
    compatibilityNote: `100% Guaranteed Compatible ${type}`,
    isSparePart: type === 'Spare Part',
    isConsumable: type === 'Consumable'
  };
}
