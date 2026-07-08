import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { generateSitemapXml, generateRobotsTxt } from './src/seo/generator';

dotenv.config();

// Safe lazy retrieval of the Groq API Key
const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'MY_GROQ_API_KEY') {
    return null;
  }
  return apiKey;
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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

  // State tracker for Groq circuit breaker to gracefully handle limited quota or high demand limits silently
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
      console.log(`[Groq Circuit Breaker] High demand or quota delay detected during ${context}. Entering quiet local fallback mode for 3 minutes.`);
    } else {
      console.log(`[Groq Fallback Mode] Switching to local engine for ${context}.`);
    }
  };

  async function generateGroqContentResilient(apiKey: string, contents: string[], systemInstruction: string) {
    const userMessage = contents.join('\n');
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userMessage }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      if (response.status === 401) {
        throw new Error('Unauthorized: Invalid or revoked GROQ_API_KEY.');
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API error status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '{}';
      return JSON.parse(content);
    } catch (err: any) {
      throw err;
    }
  }

  // AI-Powered Semantic Search API
  const handleSearch = async (req: express.Request, res: express.Response) => {
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

      const apiKey = getGroqClient();
      if (!apiKey) {
        console.log('GROQ_API_KEY is missing. Falling back to local scoring.');
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
You MUST respond with a valid JSON object matching this schema:
{
  "matches": [
    {
      "productId": "The matching product ID string",
      "relevanceScore": number (1 to 100),
      "aiInsight": "Concise, high-fidelity B2B procurement insight explaining why this medical item fits their search."
    }
  ]
}
Only return products that have a reasonable clinical relation (score > 20) to the query.`;

        const userMessage = `Search Query: "${searchQuery}"
Products Catalog: ${JSON.stringify(productContext)}`;

        const parsedData = await generateGroqContentResilient(apiKey, [userMessage], systemPrompt);
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
  };

  app.post('/api/groq/search', handleSearch);
  app.post('/api/gemini/search', handleSearch); // backward compatibility alias

  // AI-Powered Companion Recommendations API
  const handleRecommend = async (req: express.Request, res: express.Response) => {
    try {
      const { cartItems, allProducts, userContext } = req.body;

      // Check if circuit breaker is cooling down or API client is disabled
      if (isQuotaCooldowned()) {
        const fallback = runLocalRecommend(allProducts, cartItems);
        return res.json(fallback);
      }

      const apiKey = getGroqClient();

      if (!apiKey) {
        const fallback = runLocalRecommend(allProducts, cartItems);
        return res.json({
          recommendations: fallback.recommendations,
          clinicalTip: 'Configure your GROQ_API_KEY to unlock advanced deep-clinical copilot recommendations.'
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
You MUST respond with a valid JSON object matching this schema:
{
  "recommendations": [
    {
      "productId": "The catalog product ID to recommend",
      "recommendationReason": "A highly convincing, clinically accurate explanation for this complementary B2B setup."
    }
  ],
  "clinicalTip": "A valuable 1-2 sentence medical procurement compliance or operation tip."
}
Provide 1 to 2 smart, professional recommendations. Include actionable clinical advice (e.g., regarding CDSCO standards, calibration timelines, sterilization, or shelf-life).`;

        const userMessage = `Current Shopping Cart: ${JSON.stringify(cartSummary)}
Available Catalog: ${JSON.stringify(catalogSummary)}
Hospital User Role: ${JSON.stringify(userContext || 'General Clinic')}`;

        const parsedData = await generateGroqContentResilient(apiKey, [userMessage], systemPrompt);
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
  };

  app.post('/api/groq/recommend', handleRecommend);
  app.post('/api/gemini/recommend', handleRecommend); // backward compatibility alias

  // Verify Groq integration with a simple test prompt
  app.get('/api/groq/test', async (req, res) => {
    try {
      const apiKey = getGroqClient();
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'GROQ_API_KEY environment variable is missing.'
        });
      }

      const systemPrompt = 'You are a helpful verification assistant. Respond with a JSON object containing the message: "Groq integration verified successfully." under the key "status".';
      const userMessage = 'Verify connection.';

      const parsedData = await generateGroqContentResilient(apiKey, [userMessage], systemPrompt);
      return res.json({
        success: true,
        response: parsedData
      });
    } catch (error: any) {
      console.error('Groq test endpoint failed:', error);
      return res.status(500).json({
        success: false,
        error: error.message || String(error)
      });
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

    // Auto-run startup test if GROQ_API_KEY is present to verify integration
    const apiKey = getGroqClient();
    if (apiKey) {
      console.log('[Groq Integration] Running startup validation test...');
      fetch(`http://0.0.0.0:${PORT}/api/groq/test`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log('[Groq Integration] SUCCESS: Startup test passed!', data.response);
          } else {
            console.error('[Groq Integration] ERROR: Startup validation test failed.', data.error);
          }
        })
        .catch(err => {
          // Ignore connection errors if server is still starting up
          console.log('[Groq Integration] Note: Startup test ping scheduled.');
        });
    } else {
      console.log('[Groq Integration] Warning: GROQ_API_KEY environment variable is not set. Local fallback engine active.');
    }
  });
}

startServer();
