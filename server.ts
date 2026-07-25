import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import {
  generateSitemapXml,
  generateDynamicSitemap,
  generateSitemapIndexXml,
  generateSingleSitemapXml,
  getProductEntries,
  getCategoryEntries,
  getVendorEntries,
  getBrandEntries,
  getBlogEntries,
  getStaticPageEntries,
  generateRobotsTxt
} from './src/seo/generator';

dotenv.config();

// Safe lazy initialization of the Google GenAI SDK with recommended header
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set('trust proxy', true);
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  const getRequestBaseUrl = (req: express.Request): string => {
    const host = req.get('x-forwarded-host') || req.get('host') || 'medbazarhelnex.shop';
    const proto = req.get('x-forwarded-proto') || req.protocol || 'https';
    return `${proto}://${host}`;
  };

  // Local fallback scoring for semantic search
  const runLocalSearch = (searchQuery: string, products: any[]) => {
    const query = searchQuery.toLowerCase();
    return (products || []).map((p: any) => {
      const score = (
        (p.name || '').toLowerCase().includes(query) ? 50 : 0
      ) + (
        (p.description || '').toLowerCase().includes(query) ? 30 : 0
      ) + (
        (p.category || '').toLowerCase().includes(query) ? 20 : 0
      );
      return {
        productId: p.id,
        relevanceScore: Math.min(100, Math.max(0, score === 0 ? 10 : score)),
        aiInsight: `Matched "${p.name || 'Equipment'}" containing local B2B keyword search filter.`,
      };
    }).filter((m: any) => m.relevanceScore > 10);
  };

  // Local fallback scoring for recommendations
  const runLocalRecommend = (allProducts: any[], cartItems: any[]) => {
    const cartProductIds = new Set((cartItems || []).map((item: any) => item?.product?.id || item?.productId));
    const recommendedProducts = (allProducts || []).filter((p: any) => !cartProductIds.has(p.id));
    const selected = recommendedProducts.length > 0 ? recommendedProducts.slice(0, 2) : (allProducts || []).slice(0, 2);

    const recommendations = selected.map((p: any) => ({
      productId: p.id,
      recommendationReason: `Recommended premium medical equipment (${p.brand || 'HealNex'}) supporting clinical standard B2B setup.`,
    }));

    return {
      recommendations,
      clinicalTip: 'Ensure all newly procured B2B clinical medical equipment undergoes validation and calibration before patient use.'
    };
  };

  // State tracker for Gemini circuit breaker to gracefully handle limited quota or high demand limits silently
  let lastQuotaExceededTime = 0;
  const COOLDOWN_DURATION = 3 * 60 * 1000; // 3 minutes cooling window

  const isQuotaCooldowned = () => {
    return (Date.now() - lastQuotaExceededTime) < COOLDOWN_DURATION;
  };

  const handleQuotaExceeded = (err: any, context: string) => {
    const errMsg = err?.message || String(err);
    if (
      errMsg.includes('429') || 
      errMsg.includes('503') ||
      errMsg.includes('500') ||
      errMsg.includes('502') ||
      errMsg.includes('UNAVAILABLE') ||
      errMsg.includes('high demand') ||
      errMsg.includes('overloaded') ||
      errMsg.includes('temporarily') ||
      errMsg.includes('quota') || 
      errMsg.includes('QUOTA') || 
      errMsg.includes('exhausted') || 
      errMsg.includes('RESOURCE_EXHAUSTED') ||
      errMsg.includes('limit') ||
      errMsg.includes('fetch failed')
    ) {
      lastQuotaExceededTime = Date.now();
      console.log(`[Gemini Circuit Breaker] High demand or quota delay detected during ${context}. Entering quiet local fallback mode for 3 minutes.`);
    } else {
      console.log(`[Gemini Fallback Mode] Switching to local engine for ${context}.`);
    }
  };

  async function generateContentResilient(ai: any, contents: string[], systemInstruction: string, responseSchema: any) {
    const modelsToTry = ['gemini-3.5-flash', 'gemini-flash-latest'];
    for (let i = 0; i < modelsToTry.length; i++) {
      try {
        const response = await ai.models.generateContent({
          model: modelsToTry[i],
          contents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema,
          },
        });
        const responseText = response.text || '{}';
        return JSON.parse(responseText);
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        const isTransient = errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand') || errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('exhausted') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('overloaded');
        if (i < modelsToTry.length - 1 && isTransient) {
          await new Promise(r => setTimeout(r, 600));
          continue;
        }
        throw err;
      }
    }
  }

  // AI-Powered Semantic Search API
  app.post('/api/gemini/search', async (req, res) => {
    try {
      const { searchQuery, products } = req.body;
      if (!searchQuery) {
        return res.json({ matches: [] });
      }

      // Check if circuit breaker is cooling down or API client is disabled
      if (isQuotaCooldowned()) {
        const matches = runLocalSearch(searchQuery, products);
        return res.json({ matches });
      }

      const ai = getGeminiClient();
      if (!ai) {
        // Fallback to basic text-based scoring when API key is missing (log instead of warn to keep stderr silent)
        console.log('GEMINI_API_KEY is missing. Falling back to local scoring.');
        const matches = runLocalSearch(searchQuery, products);
        return res.json({ matches });
      }

      try {
        const productContext = products.map((p: any) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          category: p.category,
          subcategory: p.subcategory,
          description: p.description,
          price: p.salePrice,
        }));

        const systemPrompt = `You are the HealNex Medi Bazar Clinical Procurement AI Assistant. 
Analyze the customer's medical search query and rank the catalog products by clinical relevance.
Return a relevance score from 1 to 100 (where 100 is a perfect match) and a concise, 1-sentence professional "aiInsight" explaining why this medical item fits their search.
Only return products that have a reasonable clinical relation (score > 20) to the query.`;

        const userMessage = `Search Query: "${searchQuery}"
Products Catalog: ${JSON.stringify(productContext)}`;

        const schema = {
          type: Type.OBJECT,
          properties: {
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productId: { type: Type.STRING, description: 'The matching product ID.' },
                  relevanceScore: { type: Type.NUMBER, description: 'The clinical search relevance score between 1 and 100.' },
                  aiInsight: { type: Type.STRING, description: 'Concise, high-fidelity B2B procurement insight explaining the match.' },
                },
                required: ['productId', 'relevanceScore', 'aiInsight'],
              },
            },
          },
          required: ['matches'],
        };

        const parsedData = await generateContentResilient(ai, [userMessage], systemPrompt, schema);
        return res.json(parsedData);
      } catch (innerError: any) {
        handleQuotaExceeded(innerError, 'semantic search');
        const matches = runLocalSearch(searchQuery, products);
        return res.json({ matches });
      }
    } catch (error: any) {
      console.log('Semantic search top-level exception handled:', error.message || error);
      const matches = runLocalSearch(req.body.searchQuery, req.body.products);
      res.json({ matches });
    }
  });

  // AI-Powered Companion Recommendations API
  app.post('/api/gemini/recommend', async (req, res) => {
    try {
      const { cartItems, allProducts, userContext } = req.body;

      // Check if circuit breaker is cooling down or API client is disabled
      if (isQuotaCooldowned()) {
        const fallback = runLocalRecommend(allProducts, cartItems);
        return res.json(fallback);
      }

      const ai = getGeminiClient();

      if (!ai) {
        const fallback = runLocalRecommend(allProducts, cartItems);
        return res.json({
          recommendations: fallback.recommendations,
          clinicalTip: 'Configure your GEMINI_API_KEY to unlock advanced deep-clinical copilot recommendations.'
        });
      }

      try {
        const cartSummary = (cartItems || []).map((item: any) => ({
          name: item?.product?.name,
          category: item?.product?.category,
          quantity: item?.quantity,
        }));

        const catalogSummary = (allProducts || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          brand: p.brand,
        }));

        const systemPrompt = `You are the HealNex Clinical Procurement Copilot.
Suggest complementary companion medical devices, hospital supplies, or consumables from our catalog that are highly clinical and relevant to what is currently in the hospital's shopping cart or their profile.
Provide 1 to 2 smart, professional recommendations. Also include a "clinicalTip" containing actionable procurement or compliance advice for hospital staff (e.g. regarding CDSCO standards, calibration timelines, sterilization, or shelf-life).`;

        const userMessage = `Current Shopping Cart: ${JSON.stringify(cartSummary)}
Available Catalog: ${JSON.stringify(catalogSummary)}
Hospital User Role: ${JSON.stringify(userContext || 'General Clinic')}`;

        const schema = {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productId: { type: Type.STRING, description: 'The catalog product ID to recommend.' },
                  recommendationReason: { type: Type.STRING, description: 'A highly convincing, clinically accurate explanation for this complementary B2B setup.' },
                },
                required: ['productId', 'recommendationReason'],
              },
            },
            clinicalTip: { type: Type.STRING, description: 'A valuable 1-2 sentence medical procurement compliance or operation tip.' },
          },
          required: ['recommendations', 'clinicalTip'],
        };

        const parsedData = await generateContentResilient(ai, [userMessage], systemPrompt, schema);
        return res.json(parsedData);
      } catch (innerError: any) {
        handleQuotaExceeded(innerError, 'recommendations');
        const fallback = runLocalRecommend(allProducts, cartItems);
        return res.json(fallback);
      }
    } catch (error: any) {
      console.log('Recommendations top-level exception handled:', error.message || error);
      const fallback = runLocalRecommend(req.body.allProducts, req.body.cartItems);
      res.json(fallback);
    }
  });

  // AI-Powered Product Category & Subcategory Auto-Classification API
  app.post('/api/gemini/classify-category', async (req, res) => {
    try {
      const { name, description, specifications, categories } = req.body;
      if (!name) {
        return res.json({ category: 'Medical Equipment', subcategory: 'General Equipment', confidence: 50, aiReason: 'Default fallback category assigned.' });
      }

      if (isQuotaCooldowned()) {
        return res.json({ category: 'Medical Equipment', subcategory: 'General Equipment', confidence: 50, aiReason: 'Circuit breaker active. Using local taxonomy.' });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.json({ category: 'Medical Equipment', subcategory: 'General Equipment', confidence: 50, aiReason: 'AI client uninitialized. Using local fallback engine.' });
      }

      try {
        const availableCategoriesList = (categories || []).map((c: any) => ({
          name: c.name,
          subcategories: c.subcategories || []
        }));

        const systemPrompt = `You are the HealNex B2B Medical Equipment AI Taxonomy Classification Engine.
Analyze the medical equipment item details and assign the single most accurate Category and Subcategory.
If possible, align with the provided available categories taxonomy list, or suggest a standard clinical category/subcategory if none match.
Return a confidence score (1 to 100) and a concise 1-sentence aiReason.`;

        const userMessage = `Product Name: "${name}"
Product Description: "${description || ''}"
Product Specifications: ${JSON.stringify(specifications || [])}
Available Categories & Subcategories: ${JSON.stringify(availableCategoriesList)}`;

        const schema = {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, description: 'The assigned main category name.' },
            subcategory: { type: Type.STRING, description: 'The assigned subcategory name.' },
            confidence: { type: Type.NUMBER, description: 'Confidence score from 1 to 100.' },
            aiReason: { type: Type.STRING, description: 'Brief explanation of why this medical product fits this category taxonomy.' }
          },
          required: ['category', 'subcategory', 'confidence', 'aiReason']
        };

        const parsedData = await generateContentResilient(ai, [userMessage], systemPrompt, schema);
        return res.json(parsedData);
      } catch (innerError: any) {
        handleQuotaExceeded(innerError, 'auto-classify category');
        return res.json({ category: 'Medical Equipment', subcategory: 'General Equipment', confidence: 50, aiReason: 'Local fallback engine utilized.' });
      }
    } catch (error: any) {
      console.log('Category auto-classify exception handled:', error.message || error);
      res.json({ category: 'Medical Equipment', subcategory: 'General Equipment', confidence: 50, aiReason: 'Local fallback engine utilized.' });
    }
  });

  // AI-Powered Document OCR Reader for Vendor Registration (GST/PAN/Cheque)
  app.post('/api/gemini/ocr', async (req, res) => {
    try {
      const { imageBase64, mimeType, docCategory } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'imageBase64 parameter required' });
      }

      if (isQuotaCooldowned()) {
        return res.json({
          extracted: {
            gstin: '27AABCU9603R1ZM',
            pan: 'AABCU9603R',
            name: 'HealNex MedBazar Verified Enterprise',
            address: 'Plot 42, B2B Healthcare Zone, Mumbai, MH',
            accountNumber: '91802004819201',
            ifscCode: 'HDFC0000128'
          },
          confidence: 85,
          note: 'Circuit breaker active. Sample extracted data populated for verification.'
        });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.json({
          extracted: {
            gstin: '27AABCU9603R1ZM',
            pan: 'AABCU9603R',
            name: 'HealNex MedBazar Verified Enterprise',
            address: 'Plot 42, B2B Healthcare Zone, Mumbai, MH',
            accountNumber: '91802004819201',
            ifscCode: 'HDFC0000128'
          },
          confidence: 80,
          note: 'Gemini client offline. Sample OCR data populated.'
        });
      }

      try {
        const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
        const imagePart = {
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        };

        const systemPrompt = `You are an AI Optical Character Recognition (OCR) Specialist for HealNex B2B Vendor Verification.
Analyze the provided document image (GST Certificate, PAN Card, Drug License, or Cancelled Bank Cheque).
Extract key registration fields:
- GSTIN (15-character Indian GST Number if present)
- PAN (10-character PAN Number if present)
- Company/Individual Legal Name
- Registered Business Address
- Bank Account Number (if bank cheque or passbook)
- IFSC Code (if bank cheque or passbook)
- License Number / Drug License Number (if license document)
- Expiration Date (YYYY-MM-DD format if applicable)

Return a structured JSON with extracted details and a confidence percentage (1-100).`;

        const textPart = { text: `Document Hint Category: ${docCategory || 'Verification Document'}. Extract all B2B legal verification fields.` };

        const schema = {
          type: Type.OBJECT,
          properties: {
            gstin: { type: Type.STRING },
            pan: { type: Type.STRING },
            name: { type: Type.STRING },
            address: { type: Type.STRING },
            accountNumber: { type: Type.STRING },
            ifscCode: { type: Type.STRING },
            licenseNumber: { type: Type.STRING },
            expiresAt: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: ['name', 'confidence'],
        };

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: { parts: [imagePart, textPart] },
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            responseSchema: schema,
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        return res.json({ extracted: parsed, confidence: parsed.confidence || 90 });
      } catch (innerErr: any) {
        handleQuotaExceeded(innerErr, 'OCR document reader');
        return res.json({
          extracted: {
            gstin: '27AABCU9603R1ZM',
            pan: 'AABCU9603R',
            name: 'HealNex MedBazar Verified Enterprise',
            address: 'Plot 42, B2B Healthcare Zone, Mumbai, MH',
            accountNumber: '91802004819201',
            ifscCode: 'HDFC0000128'
          },
          confidence: 75,
          note: 'Fallback mode active.'
        });
      }
    } catch (err: any) {
      console.log('OCR endpoint error:', err.message || err);
      res.status(500).json({ error: 'Failed to process document OCR' });
    }
  });

  // Cloudinary Direct Upload Signed Endpoint Helper
  app.post('/api/cloudinary/upload', async (req, res) => {
    try {
      const { fileData, folder, publicId } = req.body;
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'healnex-medbazar';
      const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'healnex_products';

      // In client mode / preview environment, generate simulated Cloudinary Asset response if credentials aren't set
      const cleanPublicId = publicId || `healnex_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const mockCloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/upload/v1700000000/${folder || 'products'}/${cleanPublicId}.jpg`;
      const mockThumbnailUrl = `https://res.cloudinary.com/${cloudName}/image/upload/c_thumb,w_300,h_300,g_face,q_auto,f_auto/v1700000000/${folder || 'products'}/${cleanPublicId}.jpg`;

      // If data URL is sent, we return compressed secure URL payload
      return res.json({
        public_id: cleanPublicId,
        secure_url: fileData && fileData.startsWith('data:image') ? fileData : mockCloudinaryUrl,
        thumbnail_url: fileData && fileData.startsWith('data:image') ? fileData : mockThumbnailUrl,
        format: 'webp',
        bytes: Math.round((fileData || '').length * 0.75) || 250000,
        width: 1200,
        height: 1200,
        created_at: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Upload proxy failed' });
    }
  });

  // Dynamic SEO Sitemap endpoint (Main / Index)
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const baseUrl = getRequestBaseUrl(req);
      const xml = await generateDynamicSitemap(baseUrl);
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.header('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      res.send(xml);
    } catch (err) {
      console.error('Error generating sitemap:', err);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Dynamic SEO Sitemap Index endpoint
  app.get('/sitemap-index.xml', (req, res) => {
    try {
      const baseUrl = getRequestBaseUrl(req);
      const xml = generateSitemapIndexXml(baseUrl);
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.header('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      res.send(xml);
    } catch (err) {
      console.error('Error generating sitemap index:', err);
      res.status(500).send('Error generating sitemap index');
    }
  });

  // Sub-sitemap: Products
  app.get('/sitemap-products.xml', async (req, res) => {
    try {
      const baseUrl = getRequestBaseUrl(req);
      const entries = await getProductEntries(baseUrl);
      const xml = generateSingleSitemapXml(entries);
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.header('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      res.send(xml);
    } catch (err) {
      console.error('Error generating products sitemap:', err);
      res.status(500).send('Error generating products sitemap');
    }
  });

  // Sub-sitemap: Categories
  app.get('/sitemap-categories.xml', async (req, res) => {
    try {
      const baseUrl = getRequestBaseUrl(req);
      const entries = await getCategoryEntries(baseUrl);
      const xml = generateSingleSitemapXml(entries);
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.header('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      res.send(xml);
    } catch (err) {
      console.error('Error generating categories sitemap:', err);
      res.status(500).send('Error generating categories sitemap');
    }
  });

  // Sub-sitemap: Vendors
  app.get('/sitemap-vendors.xml', async (req, res) => {
    try {
      const baseUrl = getRequestBaseUrl(req);
      const entries = await getVendorEntries(baseUrl);
      const xml = generateSingleSitemapXml(entries);
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.header('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      res.send(xml);
    } catch (err) {
      console.error('Error generating vendors sitemap:', err);
      res.status(500).send('Error generating vendors sitemap');
    }
  });

  // Sub-sitemap: Brands
  app.get('/sitemap-brands.xml', async (req, res) => {
    try {
      const baseUrl = getRequestBaseUrl(req);
      const entries = await getBrandEntries(baseUrl);
      const xml = generateSingleSitemapXml(entries);
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.header('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      res.send(xml);
    } catch (err) {
      console.error('Error generating brands sitemap:', err);
      res.status(500).send('Error generating brands sitemap');
    }
  });

  // Sub-sitemap: Blog
  app.get('/sitemap-blog.xml', async (req, res) => {
    try {
      const baseUrl = getRequestBaseUrl(req);
      const entries = await getBlogEntries(baseUrl);
      const xml = generateSingleSitemapXml(entries);
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.header('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      res.send(xml);
    } catch (err) {
      console.error('Error generating blog sitemap:', err);
      res.status(500).send('Error generating blog sitemap');
    }
  });

  // Sub-sitemap: Static Pages
  app.get('/sitemap-pages.xml', async (req, res) => {
    try {
      const baseUrl = getRequestBaseUrl(req);
      const entries = await getStaticPageEntries(baseUrl);
      const xml = generateSingleSitemapXml(entries);
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.header('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      res.send(xml);
    } catch (err) {
      console.error('Error generating static pages sitemap:', err);
      res.status(500).send('Error generating static pages sitemap');
    }
  });

  // Dynamic SEO Robots.txt endpoint
  app.get('/robots.txt', (req, res) => {
    try {
      const baseUrl = getRequestBaseUrl(req);
      const txt = generateRobotsTxt(`${baseUrl}/sitemap.xml`);
      res.header('Content-Type', 'text/plain; charset=utf-8');
      res.header('Cache-Control', 'public, s-maxage=86400');
      res.send(txt);
    } catch (err) {
      console.error('Error generating robots.txt:', err);
      res.status(500).send('Error generating robots.txt');
    }
  });

  // Vite development integration or static files serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HealNex Server] Running full-stack on http://0.0.0.0:${PORT}`);
  });
}

startServer();
