import { Category, Brand, Product, Blog, User } from './types';

export const INITIAL_CATEGORIES: Category[] = [];

export const INITIAL_BRANDS: Brand[] = [
  { id: 'brand-healnex', name: 'HealNex Premium', country: 'India', description: 'Flagship high-grade clinical diagnostic equipment', isActive: true },
  { id: 'brand-lifeshield', name: 'Lifeshield', country: 'Germany', description: 'Emergency medical care and crash cart systems', isActive: true },
  { id: 'brand-oxyflow', name: 'OxyFlow', country: 'USA', description: 'Respiratory care and continuous oxygen delivery systems', isActive: true },
  { id: 'brand-hospiluxe', name: 'Hospiluxe', country: 'India', description: 'Motorized hospital and ICU furniture solutions', isActive: true },
  { id: 'brand-safeshield', name: 'SafeShield', country: 'Malaysia', description: 'Medical grade nitrile and latex examination gloves', isActive: true },
  { id: 'brand-labspin', name: 'LabSpin', country: 'India', description: 'Digital benchtop clinical centrifuge and lab apparatus', isActive: true },
  { id: 'brand-philips', name: 'Philips Healthcare', country: 'Netherlands', description: 'Global leader in patient monitoring and diagnostic imaging', isActive: true },
  { id: 'brand-siemens', name: 'Siemens Healthineers', country: 'Germany', description: 'Advanced clinical imaging and laboratory diagnostics', isActive: true },
  { id: 'brand-mindray', name: 'Mindray Medical', country: 'China', description: 'Patient monitoring, ultrasound, and critical care solutions', isActive: true },
  { id: 'brand-ge', name: 'GE Healthcare', country: 'USA', description: 'Comprehensive medical diagnostic imaging systems', isActive: true }
];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_BLOGS: Blog[] = [
  {
    id: 'blog-1',
    title: 'Essential Maintenance Checklist for High-Flow ICU Ventilators',
    content: 'ICU ventilators are critical life-support devices that require immaculate care and periodic maintenance to perform reliably. In this comprehensive guide, we cover daily calibration checks, tubing sterilization protocols, sensor replacements, and backup battery upkeep. Hospitals that implement rigorous routine diagnostics reduce unexpected downtime by over 45%, ensuring constant readiness for emergency acute care scenarios.',
    author: 'Dr. Ramesh Sharma, Biomedical Lead',
    tags: ['Ventilators', 'ICU Maintenance', 'Biomedical Guide'],
    image: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?auto=format&fit=crop&q=80&w=500',
    seoTitle: 'ICU Ventilator Maintenance & Calibration Checklist',
    seoDescription: 'A complete clinical and engineering checklist to keep life-support ICU ventilators functioning correctly with zero downtime.',
    createdAt: '2026-06-25T10:00:00Z'
  },
  {
    id: 'blog-2',
    title: 'B2B Medical Procurement Trends for Modern Hospital Systems in 2026',
    content: 'The medical supply chain landscape in India is undergoing a massive digital overhaul. From fragmented regional dealer networks to centralized multi-vendor marketplace platforms, digital adoption is shortening lead times, providing price transparency, and introducing institutional financing tools. We outline how hospital administrators are leveraging digital RFQ bidding sheets to reduce clinical procurement costs by up to 18% this year.',
    author: 'Amitabh Sen, Healthcare Consultant',
    tags: ['Hospital Procurement', 'B2B Marketplace', 'Supply Chain'],
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=500',
    seoTitle: 'B2B Medical Procurement & Hospital Supply Chain Trends 2026',
    seoDescription: 'Explore how digital multi-vendor marketplaces are revolutionizing medical equipment procurement for Indian hospital chains.',
    createdAt: '2026-06-26T12:00:00Z'
  }
];

export const DEFAULT_SUPER_ADMIN: User = {
  id: 'user-superadmin',
  name: 'Super Admin',
  email: 'warisulislam371@gmail.com',
  role: 'super_admin',
  phone: '+91 9103500592',
  isVerified: true,
  forcePasswordChange: false,
  createdAt: '2026-01-01T00:00:00Z'
};
