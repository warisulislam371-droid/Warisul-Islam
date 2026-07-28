import React, { useState, useEffect, useRef } from 'react';
import { 
  X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, 
  Maximize2, Minimize2, ShieldCheck, Tag, FileText, Check, 
  Info, Sparkles, Building2, Layers, Flame
} from 'lucide-react';
import { Product } from '../types';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  initialImageIndex?: number;
  onAddToCart?: (product: Product) => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  product,
  initialImageIndex = 0,
  onAddToCart
}) => {
  const [activeIdx, setActiveIdx] = useState<number>(initialImageIndex);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSpecs, setShowSpecs] = useState<boolean>(true);

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveIdx(initialImageIndex);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  }, [product, initialImageIndex, isOpen]);

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIdx, product, zoomLevel]);

  if (!isOpen || !product) return null;

  const imagesList = (product.images && product.images.length > 0)
    ? product.images 
    : ['https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=600'];

  const currentImage = imagesList[activeIdx] || imagesList[0];

  const handlePrev = () => {
    setActiveIdx((prev) => (prev > 0 ? prev - 1 : imagesList.length - 1));
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleNext = () => {
    setActiveIdx((prev) => (prev < imagesList.length - 1 ? prev + 1 : 0));
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const toggleDoubleTapZoom = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      handleResetZoom();
    } else {
      setZoomLevel(2.5);
    }
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Drag pan when zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between select-none animate-fade-in overflow-hidden">
      {/* Top Bar */}
      <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between z-20 gap-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 tracking-wider">
                CDSCO Verified Medical Equipment
              </span>
              <span className="text-[10px] text-slate-400 font-mono">SKU: {product.sku}</span>
            </div>
            <h3 className="text-sm md:text-base font-bold text-white truncate mt-0.5">
              {product.name}
            </h3>
          </div>
        </div>

        {/* Top Control Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowSpecs(!showSpecs)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              showSpecs 
                ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/20' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle Specs & Information Drawer"
          >
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">Details &amp; Specs</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-xl transition"
            title="Toggle Fullscreen View"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded-xl transition cursor-pointer"
            title="Close Lightbox (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        ref={containerRef}
        className="flex-1 relative flex overflow-hidden items-center justify-center bg-slate-950"
      >
        {/* Main Canvas Viewport */}
        <div 
          className={`relative w-full h-full flex items-center justify-center p-6 ${
            zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
          }`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Main Image */}
          <img
            ref={imageRef}
            src={currentImage}
            alt={product.name}
            onDoubleClick={toggleDoubleTapZoom}
            style={{
              transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
              transition: isDragging ? 'none' : 'transform 0.25s ease-out'
            }}
            className="max-h-[75vh] max-w-[85vw] object-contain drop-shadow-2xl rounded-lg pointer-events-auto"
            draggable={false}
          />

          {/* Floating Image Zoom Indicator */}
          {zoomLevel > 1 && (
            <div className="absolute top-4 left-4 bg-slate-900/90 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs font-mono font-extrabold shadow-xl flex items-center gap-1.5 backdrop-blur-md">
              <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>{Math.round(zoomLevel * 100)}% Zoom</span>
              <span className="text-[10px] text-slate-400 font-sans ml-1">(Drag to pan)</span>
            </div>
          )}

          {/* Previous Image Button */}
          {imagesList.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3.5 bg-slate-900/80 hover:bg-emerald-500 text-white hover:text-slate-950 border border-slate-700/60 rounded-full transition-all shadow-2xl backdrop-blur-md z-10 cursor-pointer"
              title="Previous Image (Left Arrow)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next Image Button */}
          {imagesList.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3.5 bg-slate-900/80 hover:bg-emerald-500 text-white hover:text-slate-950 border border-slate-700/60 rounded-full transition-all shadow-2xl backdrop-blur-md z-10 cursor-pointer"
              title="Next Image (Right Arrow)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Floating Zoom Action Toolbar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 z-20">
            <button
              onClick={handleZoomOut}
              disabled={zoomLevel <= 1}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl transition"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono font-extrabold text-emerald-400 min-w-[3.5rem] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>

            <button
              onClick={handleZoomIn}
              disabled={zoomLevel >= 4}
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-xl transition"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-slate-800 mx-1" />

            <button
              onClick={handleResetZoom}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"
              title="Reset Zoom (0)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Right Info Drawer (Medical Specs & Quick Actions) */}
        {showSpecs && (
          <div className="w-80 md:w-96 bg-slate-900/95 border-l border-slate-800 p-5 flex flex-col justify-between overflow-y-auto scrollbar-thin z-20 shrink-0 shadow-2xl">
            <div className="space-y-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                  {product.category} {product.subcategory ? `• ${product.subcategory}` : ''}
                </span>
                <h2 className="text-lg font-black text-white mt-2 leading-snug">{product.name}</h2>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Brand: <strong className="text-slate-200">{product.brand}</strong></span>
                </p>
              </div>

              {/* Pricing Box */}
              <div className="p-3.5 bg-slate-800/80 border border-slate-700/60 rounded-2xl space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Verified Marketplace Price</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    ₹{product.salePrice.toLocaleString('en-IN')}
                  </span>
                  {product.price > product.salePrice && (
                    <span className="text-xs text-slate-500 line-through font-mono">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                {((product.stockQuantity !== undefined ? product.stockQuantity : 15) < 20) && (
                  <div className="pt-2 border-t border-slate-700/50 mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-amber-400 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                        Only {product.stockQuantity !== undefined ? product.stockQuantity : 15} left in stock!
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        {product.stockQuantity !== undefined ? product.stockQuantity : 15}/20
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-700">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          (product.stockQuantity !== undefined ? product.stockQuantity : 15) <= 5
                            ? 'bg-rose-500'
                            : (product.stockQuantity !== undefined ? product.stockQuantity : 15) <= 10
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.max(8, Math.min(100, ((product.stockQuantity !== undefined ? product.stockQuantity : 15) / 20) * 100))}%` }}
                      />
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-slate-400">Inclusive of all taxes ({product.gstRate}% GST) | HSN: {product.hsnCode}</p>
              </div>

              {/* Technical Specifications & Compliance */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  Clinical &amp; Commercial Specs
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Min. Order Qty (MOQ)</span>
                    <span className="font-bold text-slate-200">{product.moq} {product.moq > 1 ? 'Units' : 'Unit'}</span>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Warranty Period</span>
                    <span className="font-bold text-slate-200">{product.warranty || '1 Year Standard'}</span>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Country of Origin</span>
                    <span className="font-bold text-slate-200">{product.countryOfOrigin || 'India'}</span>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Stock Availability</span>
                    <span className={`font-bold ${product.stockQuantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {product.stockQuantity > 0 ? `${product.stockQuantity} Units In Stock` : 'Out of Stock'}
                    </span>
                  </div>
                </div>

                {product.specifications && product.specifications.length > 0 && (
                  <div className="pt-2 space-y-1.5 border-t border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Technical Specs</span>
                    <div className="space-y-1">
                      {product.specifications.slice(0, 4).map((s, idx) => (
                        <div key={idx} className="flex justify-between text-[11px]">
                          <span className="text-slate-400">{s.key}:</span>
                          <span className="font-semibold text-slate-200">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {product.description && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Description</span>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-3">
                      {product.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            {onAddToCart && (
              <div className="pt-4 border-t border-slate-800 mt-4">
                <button
                  onClick={() => {
                    onAddToCart(product);
                  }}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Add to Procurement Cart</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Thumbnail Navigation Strip */}
      {imagesList.length > 0 && (
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-center gap-3 z-20">
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 scrollbar-thin">
            {imagesList.map((imgUrl, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveIdx(idx);
                  handleResetZoom();
                }}
                className={`w-14 h-14 rounded-xl border-2 overflow-hidden transition-all shrink-0 bg-slate-950 p-0.5 cursor-pointer ${
                  activeIdx === idx
                    ? 'border-emerald-400 ring-4 ring-emerald-500/20 scale-105 shadow-xl'
                    : 'border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={imgUrl}
                  alt={`Angle ${idx + 1}`}
                  className="w-full h-full object-contain rounded-lg"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
