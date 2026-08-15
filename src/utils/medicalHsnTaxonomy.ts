/**
 * Medical Equipment Indian HSN & GST Council Taxonomy Lookup Engine
 * Automatically assigns accurate HSN codes, GST % rates, and descriptions
 * based on clinical keywords and equipment classification.
 */

export interface MedicalHsnRule {
  hsnCode: string;
  gstRate: number; // 5, 12, or 18
  name: string;
  description: string;
  category: string;
  keywords: string[];
}

export const MEDICAL_HSN_DATABASE: MedicalHsnRule[] = [
  {
    hsnCode: '90181100',
    gstRate: 12,
    name: 'Electro-cardiographs (ECG / EKG)',
    description: 'ECG Machines, EKG Units, Holter Systems, Stress Test Systems, Cardiac Event Monitors',
    category: 'Diagnostic Equipment',
    keywords: ['ecg', 'ekg', 'electrocardiograph', 'electrocardiogram', 'holter', 'cabrera', 'stress test', 'tmt machine', '12 lead', 'cardiac monitor']
  },
  {
    hsnCode: '90181200',
    gstRate: 12,
    name: 'Ultrasonic Scanning Apparatus (Ultrasound)',
    description: 'Ultrasound machines, Sonography systems, Color Doppler, 3D/4D ultrasound, Echo machines, Ultrasound Probes',
    category: 'Diagnostic Equipment',
    keywords: ['ultrasound', 'sonography', 'color doppler', 'echocardiography', 'transducer', 'ultrasound probe', 'sonoline', 'echo machine', 'ultrasonic scanner']
  },
  {
    hsnCode: '90181300',
    gstRate: 12,
    name: 'Magnetic Resonance Imaging Apparatus (MRI)',
    description: 'MRI Systems, Superconducting MRI Scanners, Open MRI, MRI RF Coils',
    category: 'Imaging & Radiology',
    keywords: ['mri', 'magnetic resonance', 'tesla', 'mri scanner', 'mri coil', 'neuro imaging']
  },
  {
    hsnCode: '90181400',
    gstRate: 12,
    name: 'Scintigraphic Apparatus (Nuclear Medicine / PET / SPECT)',
    description: 'PET-CT, SPECT Scanners, Gamma Cameras, Scintigraphy equipment',
    category: 'Imaging & Radiology',
    keywords: ['scintigraphic', 'pet ct', 'spect', 'gamma camera', 'nuclear medicine', 'positron emission']
  },
  {
    hsnCode: '90181900',
    gstRate: 12,
    name: 'Electro-Diagnostic Apparatus (Patient Monitoring / EEG / EMG)',
    description: 'Multipara Patient Monitors, Vital Signs Monitors, ICU Bedside Monitors, EEG, EMG, Evoked Potential',
    category: 'Patient Monitoring',
    keywords: ['patient monitor', 'multipara', 'multiparameter', 'vital signs', 'bedside monitor', 'spo2 monitor', 'nibp monitor', 'eeg', 'emg', 'capnography', 'etco2']
  },
  {
    hsnCode: '90189029',
    gstRate: 12,
    name: 'Surgical Diathermy & Electrosurgical Units',
    description: 'Cautery machines, Electrosurgical Generators (ESU), Vessel Sealers, Bipolar / Monopolar Diathermy',
    category: 'Surgical & OT Equipment',
    keywords: ['cautery', 'diathermy', 'electrosurgical', 'esu', 'vessel sealer', 'bipolar cautery', 'monopolar', 'electrocautery', 'radiofrequency ablation', 'harmonic scalpel']
  },
  {
    hsnCode: '90189032',
    gstRate: 12,
    name: 'Endoscopes & Laparoscopy Systems',
    description: 'Rigid & Flexible Endoscopes, Laparoscopes, Bronchoscopes, Arthroscopes, Video Endoscopy Towers',
    category: 'Surgical & OT Equipment',
    keywords: ['endoscope', 'endoscopy', 'laparoscope', 'laparoscopy', 'bronchoscope', 'arthroscope', 'colonoscope', 'gastroscope', 'cystoscope', 'camera tower', 'insufflator', 'light source']
  },
  {
    hsnCode: '90184900',
    gstRate: 12,
    name: 'Dental Instruments & Appliances',
    description: 'Dental Chairs, Dental Handpieces, Ultrasonic Scalers, Autoclaves for Dental, Apex Locators, RVG Sensor',
    category: 'Dental Equipment',
    keywords: ['dental', 'dental chair', 'scaler', 'handpiece', 'apex locator', 'rvg', 'intraoral', 'curing light', 'micromotor', 'contra angle']
  },
  {
    hsnCode: '90185000',
    gstRate: 12,
    name: 'Ophthalmic Instruments & Appliances',
    description: 'Slit Lamps, Autorefractometers, Ophthalmoscopes, Tonometers, Phoropters, Lensmeters',
    category: 'Ophthalmology',
    keywords: ['ophthalmic', 'ophthalmology', 'slit lamp', 'autorefractometer', 'keratometer', 'tonometer', 'phoropter', 'lensmeter', 'fundus camera', 'retinoscope', 'eye chart']
  },
  {
    hsnCode: '90189099',
    gstRate: 12,
    name: 'Medical, Surgical Diagnostic Instruments & Equipment (General)',
    description: 'Defibrillators, AEDs, Infusion Pumps, Syringe Pumps, OT Lights, OT Tables, Suction Machines, Stethoscopes',
    category: 'Medical Equipment',
    keywords: ['defibrillator', 'aed', 'infusion pump', 'syringe pump', 'suction machine', 'suction apparatus', 'ot light', 'surgical light', 'stethoscope', 'sphygmomanometer', 'otoscope', 'laryngoscope', 'medical device', 'medical equipment']
  },
  {
    hsnCode: '90192000',
    gstRate: 12,
    name: 'Artificial Respiration & Oxygen Therapy Apparatus',
    description: 'ICU Ventilators, Transport Ventilators, CPAP, BiPAP Machines, Oxygen Concentrators, Nebulizers, Anesthesia Workstations',
    category: 'ICU & Critical Care',
    keywords: ['ventilator', 'respirator', 'icu ventilator', 'bipap', 'cpap', 'oxygen concentrator', 'o2 generator', 'nebulizer', 'anesthesia', 'anesthetic machine', 'humidifier', 'high flow nasal']
  },
  {
    hsnCode: '90221400',
    gstRate: 12,
    name: 'X-Ray Apparatus for Medical, Surgical or Dental Use',
    description: 'Fixed & Portable X-Ray machines, C-Arm Systems, CT Scanners, Mammography, Dental OPG, DR Radiography Panels',
    category: 'Imaging & Radiology',
    keywords: ['x-ray', 'xray', 'c-arm', 'c arm', 'ct scanner', 'computed tomography', 'mammography', 'dr panel', 'digital radiography', 'radiology', 'fluoroscopy', 'opg machine']
  },
  {
    hsnCode: '94029090',
    gstRate: 18,
    name: 'Medical & Hospital Furniture',
    description: 'Hospital Beds (Motorized, ICU, Manual Fowler), Examination Couches, Operating Tables, Patient Stretchers, Wheelchairs, Medical Carts & Trolleys',
    category: 'Hospital Furniture',
    keywords: ['hospital bed', 'icu bed', 'fowler bed', 'electric bed', 'stretcher', 'trolley', 'crash cart', 'examination table', 'operation table', 'ot table', 'wheelchair', 'bedside locker', 'overbed table', 'iv stand', 'commode chair']
  },
  {
    hsnCode: '84192010',
    gstRate: 18,
    name: 'Medical, Surgical or Laboratory Sterilizers (Autoclaves)',
    description: 'Steam Autoclaves, Flash Sterilizers, ETO Sterilizers, Plasma Sterilizers, Instrument Washers',
    category: 'Surgical & OT Equipment',
    keywords: ['autoclave', 'sterilizer', 'steam sterilizer', 'eto', 'plasma sterilizer', 'sterilization', 'ultrasonic cleaner', 'instrument washer']
  },
  {
    hsnCode: '90278090',
    gstRate: 18,
    name: 'Clinical Laboratory Analyzers & Diagnostic Instruments',
    description: 'Biochemistry Analyzers, Hematology (CBC) Analyzers, Blood Gas (ABG) Analyzers, Centrifuges, Microscopes, ELISA Readers',
    category: 'Laboratory Equipment',
    keywords: ['analyzer', 'biochemistry', 'hematology', 'cbc machine', 'abg analyzer', 'centrifuge', 'microscope', 'elisa reader', 'incubator', 'cell counter', 'electrolyte analyzer', 'laboratory']
  },
  {
    hsnCode: '90251910',
    gstRate: 12,
    name: 'Clinical & Digital Thermometers',
    description: 'Digital Thermometers, Infrared Forehead Thermometers, Non-contact Temp Scanners',
    category: 'Diagnostic Equipment',
    keywords: ['thermometer', 'infrared thermometer', 'digital thermometer', 'temperature scanner', 'clinical thermometer']
  },
  {
    hsnCode: '90183100',
    gstRate: 12,
    name: 'Syringes, with or without Needles',
    description: 'Disposable Syringes, Auto-disable Syringes, Insulin Syringes, Hypodermic Needles',
    category: 'Consumables & Disposables',
    keywords: ['syringe', 'needle', 'insulin syringe', 'hypodermic', 'dispovan', 'syringes']
  },
  {
    hsnCode: '90183990',
    gstRate: 12,
    name: 'Catheters, Cannulae & Infusion Sets',
    description: 'IV Cannulas, Foley Catheters, Central Venous Lines (CVC), Infusion Giving Sets, Suction Catheters',
    category: 'Consumables & Disposables',
    keywords: ['catheter', 'cannula', 'iv cannula', 'infusion set', 'iv set', 'foley', 'endotracheal tube', 'ett', 'suction catheter', 'cvc line', 'blood transfusion set']
  },
  {
    hsnCode: '40151100',
    gstRate: 12,
    name: 'Surgical & Examination Gloves (Latex / Nitrile)',
    description: 'Sterile Surgical Gloves, Powder-free Nitrile Gloves, Latex Examination Gloves',
    category: 'Consumables & Disposables',
    keywords: ['glove', 'gloves', 'nitrile gloves', 'latex gloves', 'surgical gloves', 'examination gloves', 'sterile gloves']
  },
  {
    hsnCode: '30059040',
    gstRate: 12,
    name: 'Surgical Dressings, Bandages & Gauze',
    description: 'Sterile Gauze Swabs, Crepe Bandages, Adhesive Tapes, Cotton Rolls, Wound Dressings',
    category: 'Consumables & Disposables',
    keywords: ['bandage', 'gauze', 'dressing', 'cotton roll', 'surgical tape', 'crepe bandage', 'micropore', 'wound care', 'plaster']
  },
  {
    hsnCode: '63079090',
    gstRate: 12,
    name: 'PPE Kits, Face Masks & Surgical Gowns',
    description: '3-Ply Surgical Masks, N95 Masks, Surgical Gowns, Disposable Caps, Shoe Covers, PPE Kits',
    category: 'Consumables & Disposables',
    keywords: ['mask', 'face mask', 'n95', '3 ply', 'surgical gown', 'ppe kit', 'disposable cap', 'shoe cover', 'apron']
  },
  {
    hsnCode: '90211000',
    gstRate: 5,
    name: 'Orthopedic Appliances, Splints & Fracture Aids',
    description: 'Orthopedic Braces, Knee Braces, Walking Sticks, Crutches, Cervical Collars, Traction Kits, Fracture Splints',
    category: 'Homecare Devices',
    keywords: ['orthopedic', 'brace', 'splint', 'crutch', 'walker', 'walking stick', 'cervical collar', 'knee support', 'lumbar belt', 'traction']
  }
];

/**
 * Intelligent HSN and GST calculator for any medical product name, category, or description
 */
export function determineMedicalHsnAndGst(
  name: string = '',
  category: string = '',
  description: string = ''
): { hsnCode: string; gstRate: number; ruleName: string; rationale: string } {
  const combinedText = `${name} ${category} ${description}`.toLowerCase();

  // 1. Direct Keyword Match against Medical HSN Taxonomy
  let bestMatch: MedicalHsnRule | null = null;
  let maxScore = 0;

  for (const rule of MEDICAL_HSN_DATABASE) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (combinedText.includes(kw.toLowerCase())) {
        score += kw.length > 5 ? 3 : 1.5;
        // Extra weight if product name directly has keyword
        if (name.toLowerCase().includes(kw.toLowerCase())) {
          score += 4;
        }
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestMatch = rule;
    }
  }

  if (bestMatch && maxScore >= 2) {
    return {
      hsnCode: bestMatch.hsnCode,
      gstRate: bestMatch.gstRate,
      ruleName: bestMatch.name,
      rationale: `Matched ${bestMatch.name} (HSN ${bestMatch.hsnCode} @ ${bestMatch.gstRate}% GST per Indian GST Council rules).`
    };
  }

  // 2. Category Fallback Rules
  const catLower = (category || '').toLowerCase();
  if (catLower.includes('furniture') || catLower.includes('bed') || catLower.includes('table')) {
    return {
      hsnCode: '94029090',
      gstRate: 18,
      ruleName: 'Hospital Furniture',
      rationale: 'Classified under HSN 94029090 (Medical / Hospital Furniture) @ 18% GST.'
    };
  }

  if (catLower.includes('lab') || catLower.includes('analyzer')) {
    return {
      hsnCode: '90278090',
      gstRate: 18,
      ruleName: 'Laboratory Diagnostic Equipment',
      rationale: 'Classified under HSN 90278090 (Laboratory & Clinical Analyzers) @ 18% GST.'
    };
  }

  if (catLower.includes('consumable') || catLower.includes('disposable')) {
    return {
      hsnCode: '90183990',
      gstRate: 12,
      ruleName: 'Medical Consumables & Accessories',
      rationale: 'Classified under HSN 90183990 (Medical Consumables) @ 12% GST.'
    };
  }

  // Default Standard Medical Equipment HSN
  return {
    hsnCode: '90189099',
    gstRate: 12,
    ruleName: 'Medical Diagnostic & Electromedical Apparatus',
    rationale: 'Classified under standard Indian B2B Medical HSN 90189099 @ 12% GST.'
  };
}
