import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export default function ImageLightbox({ images, initialIndex, isOpen, onClose, title }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Update index if initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
    resetZoom();
  }, [initialIndex, isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, scale]);

  const handleNext = () => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
    resetZoom();
  };

  const handlePrev = () => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    resetZoom();
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleDoubleTap = () => {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2.5);
    }
  };

  if (!isOpen) return null;

  const currentImage = images[currentIndex] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-md select-none"
        id="image-lightbox-modal"
      >
        {/* Top bar with image info and controls */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/60 to-transparent text-white">
          <div className="truncate max-w-[60%]">
            <h3 className="font-display font-semibold text-sm sm:text-base truncate">{title}</h3>
            {images.length > 1 && (
              <p className="text-xxs sm:text-xs text-gray-400 font-mono mt-0.5">
                Image {currentIndex + 1} of {images.length}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-300 hover:text-white disabled:opacity-40"
              title="Zoom Out"
              id="lightbox-zoom-out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-xs font-mono min-w-[32px] text-center text-gray-300">
              {scale.toFixed(1)}x
            </span>
            <button
              onClick={handleZoomIn}
              disabled={scale >= 4}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-300 hover:text-white disabled:opacity-40"
              title="Zoom In"
              id="lightbox-zoom-in"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={resetZoom}
              disabled={scale === 1 && position.x === 0 && position.y === 0}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-300 hover:text-white disabled:opacity-40"
              title="Reset Zoom"
              id="lightbox-zoom-reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="h-5 w-px bg-white/20" />
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-300 hover:text-white"
              title="Close"
              id="lightbox-close"
            >
              <X className="w-5.5 h-5.5" />
            </button>
          </div>
        </div>

        {/* Main Workspace Area */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden px-4">
          {/* Left Navigation Arrow */}
          {images.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-4 sm:left-6 z-10 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer backdrop-blur-xs active:scale-95"
              id="lightbox-prev-btn"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Zoomable / Draggable Container */}
          <div className="relative w-full h-full max-w-4xl max-h-[75vh] flex items-center justify-center">
            <motion.div
              drag={scale > 1}
              dragElastic={0.15}
              dragMomentum={false}
              onDragEnd={(_, info) => {
                if (scale > 1) {
                  setPosition((prev) => ({
                    x: prev.x + info.offset.x,
                    y: prev.y + info.offset.y,
                  }));
                }
              }}
              className="relative cursor-grab active:cursor-grabbing max-w-full max-h-full flex items-center justify-center"
              style={{ x: position.x, y: position.y }}
            >
              <motion.img
                src={currentImage}
                alt={title}
                referrerPolicy="no-referrer"
                animate={{ scale }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                onDoubleClick={handleDoubleTap}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl pointer-events-none select-none"
                id="lightbox-main-image"
              />
            </motion.div>
          </div>

          {/* Right Navigation Arrow */}
          {images.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 sm:right-6 z-10 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 hover:border-white/20 transition-all cursor-pointer backdrop-blur-xs active:scale-95"
              id="lightbox-next-btn"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Bottom indicator strip */}
        <div className="py-4 bg-gradient-to-t from-black/60 to-transparent flex flex-col items-center justify-center gap-2">
          <p className="text-xxs sm:text-xs text-gray-400">
            Double-click or double-tap to zoom. {scale > 1 ? 'Drag image to pan.' : ''}
          </p>

          {/* Mini thumbnails strip */}
          {images.length > 1 && (
            <div className="flex items-center justify-center gap-2 px-6 max-w-full overflow-x-auto pb-1 mt-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    resetZoom();
                  }}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    idx === currentIndex ? 'border-indigo-500 scale-105' : 'border-white/10 opacity-60 hover:opacity-100'
                  }`}
                  id={`lightbox-thumbnail-${idx}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
