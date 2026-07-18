import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { generateSitemapXml, generateRobotsTxt } from './src/seo/generator';

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

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

  // Dynamic SEO Sitemap endpoint
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const host = req.get('host') || 'medbazarhelnex.shop';
      const proto = req.protocol || 'https';
      const baseUrl = `${proto}://${host}`;
      const xml = await generateSitemapXml(baseUrl);
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.header('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
      res.send(xml);
    } catch (err) {
      console.error('Error generating sitemap:', err);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Dynamic SEO Robots.txt endpoint
  app.get('/robots.txt', (req, res) => {
    try {
      const host = req.get('host') || 'medbazarhelnex.shop';
      const proto = req.protocol || 'https';
      const baseUrl = `${proto}://${host}`;
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
