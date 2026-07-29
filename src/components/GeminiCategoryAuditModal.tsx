import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, RefreshCw, X, ShieldCheck, Tag, ArrowRight, Wand2, Layers, FileCheck, Check, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { dbLocal } from '../db';
import { CatalogCategoryAuditReport, ProductCategoryAuditResult } from '../utils/medicalCategorizer';

interface GeminiCategoryAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuditCompleted?: () => void;
}

export const GeminiCategoryAuditModal: React.FC<GeminiCategoryAuditModalProps> = ({
  isOpen,
  onClose,
  onAuditCompleted
}) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<CatalogCategoryAuditReport | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'MISCLASSIFIED' | 'UNCATEGORIZED' | 'TAX_HSN' | 'COMPLIANT'>('ALL');
  const [appliedFixes, setAppliedFixes] = useState<Set<string>>(new Set());
  const [isApplyingAll, setIsApplyingAll] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      runCategoryAudit();
    }
  }, [isOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const runCategoryAudit = async () => {
    try {
      setIsAuditing(true);
      const allProducts = dbLocal.getProducts();

      const res = await fetch('/api/gemini/category-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: allProducts })
      });

      if (res.ok) {
        const report: CatalogCategoryAuditReport = await res.json();
        setAuditReport(report);
      } else {
        showToast('Audit API returned fallback data.');
      }
    } catch (err) {
      console.error('Error running Gemini Category Audit:', err);
      showToast('Error executing audit. Switched to local taxonomy engine.');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleApplySingleFix = (res: ProductCategoryAuditResult) => {
    const products = dbLocal.getProducts();
    const target = products.find(p => p.id === res.productId);
    if (!target) return;

    const updated = {
      ...target,
      category: res.recommendedCategory,
      subcategory: res.recommendedSubcategory,
      hsnCode: res.recommendedHsnCode || target.hsnCode,
      gstRate: res.recommendedGstRate || target.gstRate,
      updatedAt: new Date().toISOString()
    };

    dbLocal.updateProduct(target.id, updated);
    setAppliedFixes(prev => new Set(prev).add(res.productId));
    window.dispatchEvent(new Event('healnex_db_update'));

    showToast(`Updated "${res.productName}" to "${res.recommendedCategory} -> ${res.recommendedSubcategory}"`);
    if (onAuditCompleted) onAuditCompleted();
  };

  const handleApplyAllFixes = async () => {
    if (!auditReport) return;
    setIsApplyingAll(true);

    try {
      const pendingFixes = auditReport.auditResults.filter(
        r => r.issueType !== 'COMPLIANT' && !appliedFixes.has(r.productId)
      );

      const products = dbLocal.getProducts();
      let fixCount = 0;

      pendingFixes.forEach(res => {
        const target = products.find(p => p.id === res.productId);
        if (target) {
          const updated = {
            ...target,
            category: res.recommendedCategory,
            subcategory: res.recommendedSubcategory,
            hsnCode: res.recommendedHsnCode || target.hsnCode,
            gstRate: res.recommendedGstRate || target.gstRate,
            updatedAt: new Date().toISOString()
          };
          dbLocal.updateProduct(target.id, updated);
          fixCount++;
        }
      });

      const newFixes = new Set(appliedFixes);
      pendingFixes.forEach(r => newFixes.add(r.productId));
      setAppliedFixes(newFixes);

      window.dispatchEvent(new Event('healnex_db_update'));
      showToast(`Successfully corrected ${fixCount} products across catalog using Gemini AI!`);
      if (onAuditCompleted) onAuditCompleted();
    } catch (err) {
      console.error('Error applying batch fixes:', err);
    } finally {
      setIsApplyingAll(false);
    }
  };

  if (!isOpen) return null;

  const results = auditReport?.auditResults || [];
  const filteredResults = results.filter(r => {
    if (activeFilter === 'MISCLASSIFIED') return r.issueType === 'MISCLASSIFIED_CATEGORY' || r.issueType === 'MISSING_SUBCATEGORY';
    if (activeFilter === 'UNCATEGORIZED') return r.issueType === 'UNCATEGORIZED';
    if (activeFilter === 'TAX_HSN') return r.issueType === 'TAX_HSN_MISMATCH';
    if (activeFilter === 'COMPLIANT') return r.issueType === 'COMPLIANT';
    return true;
  });

  const pendingIssuesCount = results.filter(r => r.issueType !== 'COMPLIANT' && !appliedFixes.has(r.productId)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white p-6 flex items-center justify-between border-b border-teal-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 rounded-2xl shadow-lg font-bold">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">Gemini AI Automated Category Audit</h2>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full uppercase">
                  B2B Taxonomy Compliance
                </span>
              </div>
              <p className="text-xs text-teal-200 font-medium mt-0.5">
                Evaluates catalog products against certified clinical medical equipment categories, HSN tax codes &amp; subcategories.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runCategoryAudit}
              disabled={isAuditing}
              className="p-2.5 bg-teal-800/60 hover:bg-teal-700 text-teal-200 rounded-xl transition flex items-center gap-1.5 text-xs font-bold border border-teal-600/40"
              title="Re-run Gemini AI Audit"
            >
              <RefreshCw className={`w-4 h-4 ${isAuditing ? 'animate-spin text-amber-300' : ''}`} />
              <span className="hidden sm:inline">Re-Audit Catalog</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-amber-500 text-slate-950 font-bold px-6 py-2.5 text-xs flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {isAuditing ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-teal-50 border-2 border-teal-500 rounded-full flex items-center justify-center mx-auto text-teal-600 animate-bounce">
                <Wand2 className="w-8 h-8 text-amber-500 animate-spin" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Gemini AI Audit Engine Scanning Catalog...</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Auditing product titles, medical specifications, tax HSN classifications, and subcategory alignments.
                </p>
              </div>
            </div>
          ) : auditReport ? (
            <>
              {/* Summary Metrics Bar */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Audited</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{auditReport.totalAudited}</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">Catalog products</div>
                </div>

                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Compliant</div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">{auditReport.compliantCount}</div>
                  <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Accurate taxonomy</div>
                </div>

                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200">
                  <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Misclassified</div>
                  <div className="text-2xl font-black text-rose-700 mt-1">{auditReport.misclassifiedCount}</div>
                  <div className="text-[10px] text-rose-600 font-medium mt-0.5">Category conflicts</div>
                </div>

                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                  <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Uncategorized</div>
                  <div className="text-2xl font-black text-amber-700 mt-1">{auditReport.uncategorizedCount}</div>
                  <div className="text-[10px] text-amber-600 font-medium mt-0.5">Needs main category</div>
                </div>

                <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200">
                  <div className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Tax / HSN Fixes</div>
                  <div className="text-2xl font-black text-indigo-700 mt-1">{auditReport.taxHsnFixCount}</div>
                  <div className="text-[10px] text-indigo-600 font-medium mt-0.5">GST code alignment</div>
                </div>
              </div>

              {/* Gemini AI Clinical Summary Banner */}
              <div className="p-4 bg-gradient-to-r from-teal-50 to-indigo-50 border border-teal-200/80 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider">Gemini Executive Insight</h4>
                  <p className="text-xs text-slate-700 mt-0.5 leading-relaxed font-medium">
                    {auditReport.summaryInsight}
                  </p>
                </div>
                {pendingIssuesCount > 0 && (
                  <button
                    onClick={handleApplyAllFixes}
                    disabled={isApplyingAll}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-extrabold rounded-xl shadow transition flex items-center gap-1.5 shrink-0"
                  >
                    <Wand2 className={`w-4 h-4 ${isApplyingAll ? 'animate-spin' : ''}`} />
                    <span>Auto-Apply All AI Fixes ({pendingIssuesCount})</span>
                  </button>
                )}
              </div>

              {/* Interactive Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setActiveFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Items ({results.length})
                </button>
                <button
                  onClick={() => setActiveFilter('MISCLASSIFIED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeFilter === 'MISCLASSIFIED'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                  }`}
                >
                  Category Misclassifications ({auditReport.misclassifiedCount})
                </button>
                <button
                  onClick={() => setActiveFilter('UNCATEGORIZED')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeFilter === 'UNCATEGORIZED'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  Uncategorized ({auditReport.uncategorizedCount})
                </button>
                <button
                  onClick={() => setActiveFilter('TAX_HSN')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeFilter === 'TAX_HSN'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
                  }`}
                >
                  Tax / HSN Fixes ({auditReport.taxHsnFixCount})
                </button>
                <button
                  onClick={() => setActiveFilter('COMPLIANT')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeFilter === 'COMPLIANT'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  Compliant ({auditReport.compliantCount})
                </button>
              </div>

              {/* Audit Findings Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 text-[11px] uppercase tracking-wider font-extrabold border-b border-slate-200">
                      <th className="py-3 px-4">Product Details</th>
                      <th className="py-3 px-4">Current Category</th>
                      <th className="py-3 px-4">Gemini Recommended Fix</th>
                      <th className="py-3 px-4">Audit Status &amp; Reason</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs font-medium text-slate-800">
                    {filteredResults.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400">
                          <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-600">No audit findings for selected filter category.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredResults.map(res => {
                        const isFixed = appliedFixes.has(res.productId);

                        return (
                          <tr key={res.productId} className="hover:bg-slate-50/80 transition">
                            {/* Product Details */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{res.productName}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">SKU: {res.sku}</div>
                            </td>

                            {/* Current Category */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  res.currentCategory === 'Uncategorized' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {res.currentCategory}
                                </span>
                                <div className="text-[10px] text-slate-500">{res.currentSubcategory}</div>
                              </div>
                            </td>

                            {/* Gemini Recommended Fix */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 font-bold text-teal-800">
                                  <span>{res.recommendedCategory}</span>
                                  <ArrowRight className="w-3 h-3 text-amber-500 shrink-0" />
                                  <span className="text-emerald-700">{res.recommendedSubcategory}</span>
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  HSN: <span className="font-mono font-bold text-slate-700">{res.recommendedHsnCode}</span> ({res.recommendedGstRate}% GST)
                                </div>
                              </div>
                            </td>

                            {/* Audit Status & Reason */}
                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="space-y-1">
                                {res.issueType === 'COMPLIANT' ? (
                                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    Compliant ({res.confidenceScore}%)
                                  </span>
                                ) : res.issueType === 'MISCLASSIFIED_CATEGORY' ? (
                                  <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    Misclassified ({res.confidenceScore}%)
                                  </span>
                                ) : res.issueType === 'UNCATEGORIZED' ? (
                                  <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                    <AlertCircle className="w-3 h-3 text-amber-600" />
                                    Uncategorized ({res.confidenceScore}%)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                    <FileSpreadsheet className="w-3 h-3 text-indigo-600" />
                                    Tax HSN Fix ({res.confidenceScore}%)
                                  </span>
                                )}

                                <p className="text-[10px] text-slate-600 leading-tight">
                                  {res.auditNotes}
                                </p>
                              </div>
                            </td>

                            {/* Action */}
                            <td className="py-3.5 px-4 text-right">
                              {isFixed || res.issueType === 'COMPLIANT' ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2.5 py-1 rounded-lg">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Passed</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleApplySingleFix(res)}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 ml-auto"
                                >
                                  <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                                  <span>Apply Fix</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <p className="text-xs font-bold">No audit report available.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Audits match official CDSCO / ISO 13485 B2B medical equipment nomenclature rules.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition"
          >
            Close Audit View
          </button>
        </div>

      </div>
    </div>
  );
};
