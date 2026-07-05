import { useState } from 'react';
import { Product } from '../types';
import { ArrowLeft, ShoppingCart, MessageSquare, Check, Tag, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import ReviewSection from './ReviewSection';
import ImageLightbox from './ImageLightbox';
import { useTranslation } from '../lib/i18n';

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product) => void;
  isWishlisted?: boolean;
  onWishlistToggle?: () => void;
}

export default function ProductDetail({ product, onBack, onAddToCart, isWishlisted = false, onWishlistToggle }: ProductDetailProps) {
  const { t } = useTranslation();
  const [activeImage, setActiveImage] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const images = product.images && product.images.length > 0 
    ? product.images 
    : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'];

  const handleAddToCart = () => {
    onAddToCart(product);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  const isSoldOut = product.stockCount !== undefined && product.stockCount === 0;
  const isLowStock = product.stockCount !== undefined && product.stockCount > 0 && product.stockCount <= 5;
  const hasDiscount = product.discountedPrice !== undefined && product.discountedPrice > 0 && product.discountedPrice < product.price;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="product-detail-view">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center space-x-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 mb-8 transition-colors group"
        id="detail-back-button"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>{t('backToCatalog')}</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm">
        {/* Left Side: Images */}
        <div className="flex flex-col space-y-4">
          <div 
            className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 cursor-zoom-in group/image"
            onClick={() => setIsLightboxOpen(true)}
            id="detail-main-image-container"
          >
            <img
              src={images[activeImage]}
              alt={product.title}
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-105 ${isSoldOut ? 'grayscale contrast-75 opacity-80' : ''}`}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
              }}
            />
            {product.telegramChannel && (
              <span className="absolute top-4 left-4 bg-indigo-600/90 text-white font-mono text-xs tracking-wider px-3 py-1 rounded-full shadow-sm backdrop-blur-sm">
                {t('syncedFrom')} {product.telegramChannel}
              </span>
            )}
            {/* Click to Zoom Overlay Indicator */}
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
              <span className="bg-black/60 text-white text-xs font-semibold px-4 py-2 rounded-xl backdrop-blur-xs flex items-center gap-1.5 shadow-md">
                {t('clickToZoom')}
              </span>
            </div>
          </div>

          {/* Image Thumbnail Selector */}
          {images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-1" id="thumbnail-container">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    idx === activeImage ? 'border-indigo-600' : 'border-gray-100 hover:border-gray-300'
                  }`}
                  id={`thumbnail-${idx}`}
                >
                  <img src={img} alt="" className={`w-full h-full object-cover ${isSoldOut ? 'grayscale opacity-80' : ''}`} referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Product Details */}
        <div className="flex flex-col justify-between" id="product-detail-info">
          <div>
            <div className="flex flex-wrap gap-2 items-center mb-3">
              <div className="flex items-center space-x-1.5 text-indigo-600 text-xs font-bold tracking-wider uppercase">
                <Tag className="w-3.5 h-3.5" />
                <span>{t('verifiedTelegramPost')}</span>
              </div>
              {product.category && (
                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-indigo-100 uppercase tracking-wider">
                  {product.category}
                </span>
              )}
            </div>

            <h1 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 tracking-tight leading-tight">
              {product.title}
            </h1>

            {/* Price & Stock info row */}
            <div className="mt-4 flex flex-wrap gap-3 items-center">
              {hasDiscount ? (
                <>
                  <div className="inline-flex items-center bg-rose-50 px-4 py-2 rounded-2xl border border-rose-100">
                    <span className="font-display font-extrabold text-2xl text-rose-600">
                      ${Number(product.discountedPrice).toFixed(2)}
                    </span>
                  </div>
                  <div className="inline-flex items-center bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 line-through text-gray-400 font-display font-semibold text-sm">
                    ${Number(product.price).toFixed(2)}
                  </div>
                  <span className="bg-rose-600 text-white font-sans text-xs font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span>{t('sale')}</span>
                  </span>
                </>
              ) : (
                <div className="inline-flex items-center bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
                  <span className="font-display font-extrabold text-2xl text-indigo-700">
                    ${Number(product.price).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Stock status badge */}
              {isSoldOut ? (
                <span className="bg-red-50 text-red-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-red-100 uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span>{t('soldOut')}</span>
                </span>
              ) : isLowStock ? (
                <span className="bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-amber-200 uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>{t('lowStock')} {product.stockCount !== undefined ? `(${product.stockCount} left)` : ''}</span>
                </span>
              ) : (
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-100 uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{t('inStock')} {product.stockCount !== undefined ? `(${product.stockCount} left)` : ''}</span>
                </span>
              )}
            </div>

            <div className="mt-8 border-t border-gray-100 pt-6">
              <h2 className="font-sans font-semibold text-gray-900 text-lg mb-3">{t('description')}</h2>
              <div className="text-gray-600 space-y-4 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {product.description || 'No description available for this product.'}
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4 pt-6 border-t border-gray-100" id="detail-actions">
            {/* Direct Telegram Link if available */}
            {product.contactLink && (
              <a
                href={product.contactLink}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center space-x-2 bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold py-3.5 px-6 rounded-2xl border border-sky-100 transition-all text-sm sm:text-base cursor-pointer"
                id="telegram-contact-link"
              >
                <MessageSquare className="w-5 h-5 text-sky-500" />
                <span>{t('messageSeller')}</span>
              </a>
            )}

            {/* Add to Cart Button & Wishlist Toggle */}
            <div className="flex gap-3">
              <motion.button
                whileTap={isSoldOut ? undefined : { scale: 0.98 }}
                onClick={isSoldOut ? undefined : handleAddToCart}
                disabled={isSoldOut}
                className={`flex-grow flex items-center justify-center space-x-2 font-semibold py-4 px-6 rounded-2xl shadow-lg shadow-indigo-100 transition-all text-sm sm:text-base ${
                  isSoldOut
                    ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none'
                    : isAdded 
                      ? 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
                id="add-to-cart-button"
              >
                {isSoldOut ? (
                  <>
                    <span>{t('soldOut')}</span>
                  </>
                ) : isAdded ? (
                  <>
                    <Check className="w-5 h-5 animate-scale" />
                    <span>{t('addedToCartExcl')}</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>{t('addtoShoppingCart')}</span>
                  </>
                )}
              </motion.button>

              {onWishlistToggle && (
                <button
                  onClick={onWishlistToggle}
                  className={`flex-shrink-0 p-4 rounded-2xl border transition-all flex items-center justify-center cursor-pointer ${
                    isWishlisted
                      ? 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
                      : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                  title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                  id="detail-wishlist-button"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ReviewSection productId={product.id} />

      <ImageLightbox
        images={images}
        initialIndex={activeImage}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        title={product.title}
      />
    </div>
  );
}
