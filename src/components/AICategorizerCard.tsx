import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, RefreshCw, Globe, ChevronRight, Layers, Tag, ShieldCheck, Check, ArrowRight } from 'lucide-react';
import { CategorizationResult, CategorizationCandidate, categorizeProductLocally } from '../utils/medicalCategorizer';
import { db } from '../firebase';
import { collection, getDocs, limit, query, orderBy } from 'firebase/firestore';

interface AICategorizerCardProps {
  productData: {
    name: string;
    brand?: string;
    description?: string;
    keywords?: string[];
    specifications?: any[];
    sku?: string;
  };
  onCategorySelected: (result: {
    category: string;
    subcategory: string;
    confidenceScore: number;
    needsAdminReview: boolean;
    seoCategoryUrl: string;
    seoSubcategoryUrl: string;
    seoProductUrl: string;
  }) => void;
  initialCategory?: string;
  initialSubcategory?: string;
}

export const AICategorizerCard: React.FC<AICategorizerCardProps> = ({
  productData,
  onCategorySelected,
  initialCategory,
  initialSubcategory
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [categorization, setCategorization] = useState<CategorizationResult | null>(null);
  const [selectedMainCat, setSelectedMainCat] = useState<string>(initialCategory || '');
  const [selectedSubCat, setSelectedSubCat] = useState<string>(initialSubcategory || '');

  // Triggers categorization when productData changes (debounced)
  useEffect(() => {
    if (!productData.name || productData.name.trim().length < 2) {
      return;
    }

    const timer = setTimeout(() => {
      runCategorization();
    }, 600);

    return () => clearTimeout(timer);
  }, [productData.name, productData.brand, productData.description]);

  const runCategorization = async () => {
    try {
      setIsAnalyzing(true);

      // Fetch learned feedback from Firestore to pass into Gemini
      let learnedFeedback: any[] = [];
      try {
        const feedbackSnap = await getDocs(
          query(collection(db, 'categorization_feedback'), orderBy('timestamp', 'desc'), limit(15))
        );
        feedbackSnap.forEach(d => learnedFeedback.push(d.data()));
      } catch (err) {
        console.log('No prior feedback loaded:', err);
      }

      const res = await fetch('/api/gemini/categorize-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productData,
          learnedFeedback
        })
      });

      if (res.ok) {
        const data: CategorizationResult = await res.json();
        setCategorization(data);
        setSelectedMainCat(data.mainCategory);
        setSelectedSubCat(data.subcategory);

        onCategorySelected({
          category: data.mainCategory,
          subcategory: data.subcategory,
          confidenceScore: data.confidenceScore,
          needsAdminReview: data.needsAdminReview,
          seoCategoryUrl: data.seoCategoryUrl,
          seoSubcategoryUrl: data.seoSubcategoryUrl,
          seoProductUrl: data.seoProductUrl
        });
      } else {
        // Local fallback
        const local = categorizeProductLocally(productData);
        setCategorization(local);
        setSelectedMainCat(local.mainCategory);
        setSelectedSubCat(local.subcategory);

        onCategorySelected({
          category: local.mainCategory,
          subcategory: local.subcategory,
          confidenceScore: local.confidenceScore,
          needsAdminReview: local.needsAdminReview,
          seoCategoryUrl: local.seoCategoryUrl,
          seoSubcategoryUrl: local.seoSubcategoryUrl,
          seoProductUrl: local.seoProductUrl
        });
      }
      setIsAnalyzing(false);
    } catch (err) {
      setIsAnalyzing(false);
      const local = categorizeProductLocally(productData);
      setCategorization(local);
      setSelectedMainCat(local.mainCategory);
      setSelectedSubCat(local.subcategory);
    }
  };

  const handleSelectCandidate = (candidate: CategorizationCandidate) => {
    setSelectedMainCat(candidate.category);
    setSelectedSubCat(candidate.subcategory);

    if (categorization) {
      const updated = {
        ...categorization,
        mainCategory: candidate.category,
        subcategory: candidate.subcategory,
        confidenceScore: Math.max(categorization.confidenceScore, candidate.confidence)
      };
      setCategorization(updated);

      onCategorySelected({
        category: candidate.category,
        subcategory: candidate.subcategory,
        confidenceScore: updated.confidenceScore,
        needsAdminReview: updated.needsAdminReview,
        seoCategoryUrl: updated.seoCategoryUrl,
        seoSubcategoryUrl: updated.seoSubcategoryUrl,
        seoProductUrl: updated.seoProductUrl
      });
    }
  };

  if (!productData.name || productData.name.trim().length === 0) {
    return (
      <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>Type a Product Name above to trigger automatic AI medical categorization...</span>
      </div>
    );
  }

  const confidence = categorization?.confidenceScore || 0;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 text-white rounded-2xl p-5 space-y-4 shadow-xl border border-emerald-500/20" id="ai-categorizer-card">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>HealNex AI Taxonomy Classifier</span>
              {isAnalyzing && <RefreshCw className="w-3 h-3 text-emerald-400 animate-spin" />}
            </h4>
            <p className="text-[10px] text-slate-400">Medical dictionary & synonym detection engine</p>
          </div>
        </div>

        <button
          type="button"
          onClick={runCategorization}
          disabled={isAnalyzing}
          className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all"
        >
          <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>Re-Analyze</span>
        </button>
      </div>

      {categorization && (
        <div className="space-y-4">
          {/* Main Confidence Badge & Status */}
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Classification Score</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                  confidence >= 90
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : confidence >= 60
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {confidence >= 90 ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Auto-Selected ({confidence}%)</span>
                  </>
                ) : confidence >= 60 ? (
                  <>
                    <Sparkles className="w-3 h-3 text-sky-400" />
                    <span>Top 3 Suggested ({confidence}%)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    <span>Needs Admin Review ({confidence}%)</span>
                  </>
                )}
              </span>
            </div>

            {/* Confidence Progress Meter */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  confidence >= 90
                    ? 'bg-emerald-500'
                    : confidence >= 60
                    ? 'bg-sky-400'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${confidence}%` }}
              />
            </div>

            {/* Assigned Category Tags */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <div className="px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>{selectedMainCat || categorization.mainCategory}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              <div className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-sky-400" />
                <span>{selectedSubCat || categorization.subcategory}</span>
              </div>
            </div>
          </div>

          {/* Reasoning Insights */}
          <p className="text-[11px] text-slate-300 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/80">
            <strong className="text-emerald-400">AI Clinical Match:</strong> {categorization.reasoning}
          </p>

          {/* Top 3 Candidate Options Pill Bar */}
          {categorization.suggestions && categorization.suggestions.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Top 3 Most Likely Categories (1-Click Selection)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {categorization.suggestions.map((cand, idx) => {
                  const isSelected = selectedMainCat === cand.category && selectedSubCat === cand.subcategory;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectCandidate(cand)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold ring-1 ring-emerald-500/30'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold text-emerald-400">{cand.confidence}% Match</span>
                        {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                      </div>
                      <span className="font-semibold block truncate">{cand.category}</span>
                      <span className="text-[10px] text-slate-400 truncate">{cand.subcategory}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Low Confidence Warning Notice */}
          {categorization.needsAdminReview && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                Low categorization confidence (&lt;60%). This product will be flagged for Admin Compliance Review prior to marketplace listing.
              </span>
            </div>
          )}

          {/* SEO URL Preview */}
          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2 truncate">
              <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-400 font-mono text-[10px] truncate">
                {categorization.seoProductUrl}
              </span>
            </div>
            <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-bold shrink-0">
              SEO URL
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
