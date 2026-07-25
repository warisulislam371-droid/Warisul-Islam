import React, { useState } from 'react';
import { ZoomIn, Eye, X, ChevronLeft, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';
import { ProductImageAsset } from '../types';

interface ProductImageViewerProps {
  images: ProductImageAsset[];
  fallbackImage?: string;
  productName?: string;
}

export const ProductImageViewer: React.FC<ProductImageViewerProps> = ({
  images,
  fallbackImage = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
  productName = 'Medical Device'
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);

  // If no images array or empty, use fallback
  const displayImages = images.length > 0 ? images : [
    {
      id: 'fallback_1',
      productId: 'p1',
      vendorId: 'v1',
      cloudinaryPublicId: 'pub_fallback',
      secureUrl: fallbackImage,
      thumbnailUrl: fallbackImage,
      fileName: 'Product Image',
      fileSize: 100000,
      originalSize: 100000,
      compressedSize: 100000,
      format: 'jpg',
      isPrimary: true,
      sortOrder: 1,
      status: 'Approved',
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Vendor'
    } as ProductImageAsset
  ];

  const activeImage = displayImages[activeImageIndex] || displayImages[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="space-y-4" id="product-image-viewer">
      {/* Primary Display Card */}
      <div 
        className="relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm aspect-square group cursor-crosshair flex items-center justify-center p-4"
        onMouseEnter={() => setShowMagnifier(true)}
        onMouseLeave={() => setShowMagnifier(false)}
        onMouseMove={handleMouseMove}
        onClick={() => setIsZoomModalOpen(true)}
      >
        {/* Primary Image */}
        <img
          src={activeImage.secureUrl}
          alt={productName}
          loading="lazy"
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
        />

        {/* Magnifier Lens on Hover */}
        {showMagnifier && (
          <div
            className="absolute w-40 h-40 border-2 border-emerald-500 rounded-full pointer-events-none shadow-2xl bg-no-repeat z-20"
            style={{
              backgroundImage: `url("${activeImage.secureUrl}")`,
              backgroundSize: '300%',
              backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
              left: `calc(${mousePos.x}% - 80px)`,
              top: `calc(${mousePos.y}% - 80px)`,
            }}
          />
        )}

        {/* Zoom Hint Badge */}
        <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-lg group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
          <ZoomIn className="w-3.5 h-3.5" />
          <span>Click to Zoom</span>
        </div>

        {/* Verified Product Badge */}
        {activeImage.status === 'Approved' && (
          <div className="absolute top-3 left-3 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>CDSCO Verified Asset</span>
          </div>
        )}
      </div>

      {/* Thumbnails Carousel */}
      {displayImages.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {displayImages.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setActiveImageIndex(idx)}
              className={`w-16 h-16 rounded-xl border overflow-hidden shrink-0 transition-all ${
                activeImageIndex === idx
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 scale-105 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={img.thumbnailUrl || img.secureUrl}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Zoom Modal */}
      {isZoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl h-[80vh] flex flex-col items-center justify-center space-y-4">
            <button
              onClick={() => setIsZoomModalOpen(false)}
              className="absolute top-0 right-0 p-2 text-white/80 hover:text-white bg-slate-800/80 rounded-full"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Previous Image Button */}
            {displayImages.length > 1 && (
              <button
                onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : displayImages.length - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Next Image Button */}
            {displayImages.length > 1 && (
              <button
                onClick={() => setActiveImageIndex((prev) => (prev < displayImages.length - 1 ? prev + 1 : 0))}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <img
              src={activeImage.secureUrl}
              alt={productName}
              className="max-h-full max-w-full object-contain rounded-xl"
            />

            <div className="text-white text-xs text-center space-y-1">
              <p className="font-bold">{productName}</p>
              <p className="text-slate-400">
                Image {activeImageIndex + 1} of {displayImages.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
