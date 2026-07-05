import { Product } from '../types';
import { Tag, ExternalLink, Heart, ShoppingBag, Plus, Share2 } from 'lucide-react';
import { MouseEvent } from 'react';
import { motion } from 'motion/react';
import { useToast } from './Toast';
import { useTranslation } from '../lib/i18n';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  isWishlisted?: boolean;
  onWishlistToggle?: (e: MouseEvent) => void;
  onQuickBuy?: () => void;
  onAddToCart?: () => void;
  key?: string | number;
}

export default function ProductCard({ 
  product, 
  onClick, 
  isWishlisted = false, 
  onWishlistToggle,
  onQuickBuy,
  onAddToCart
 }: ProductCardProps) {
  const toast = useToast();
  const { t } = useTranslation();

  // Use a professional product placeholder if no images are present or image fails to load
  const imageSrc = product.images && product.images.length > 0 && product.images[0]
    ? product.images[0]
    : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

  const isSoldOut = product.stockCount !== undefined && product.stockCount === 0;
  const isLowStock = product.stockCount !== undefined && product.stockCount > 0 && product.stockCount <= 5;
  const hasDiscount = product.discountedPrice !== undefined && product.discountedPrice > 0 && product.discountedPrice < product.price;

  const handleShare = async (e: MouseEvent) => {
    e.stopPropagation();
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?product=${product.id}`;
    const shareData = {
      title: product.title,
      text: `Check out ${product.title} on our Telegram E-commerce shop!`,
      url: shareUrl
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast.success(`"${product.title}" ${t('sharedSuccess')}`, t('share'));
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          copyToClipboard(shareUrl);
        }
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('copiedToClipboard'), t('copied'));
    } catch (err) {
      toast.error(t('copyFailed'), "Error");
    }
  };

  return (
    <motion.div 
      whileHover={isSoldOut ? undefined : { 
        y: -6, 
        scale: 1.012,
        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.08)",
        borderColor: "rgb(238 242 255)"
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer flex flex-col h-full relative ${isSoldOut ? 'opacity-75' : ''}`}
      onClick={onClick}
      id={`product-card-${product.id}`}
    >
      {/* Product Image Stage */}
      <div className="relative aspect-square w-full bg-gray-50 overflow-hidden">
        <img
          src={imageSrc}
          alt={product.title}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isSoldOut ? 'grayscale contrast-75 brightness-75' : ''}`}
          onError={(e) => {
            // Fallback if image fails to load
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Sold Out Visual Overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-20">
            <div className="bg-red-600/95 text-white font-sans text-xs font-extrabold uppercase tracking-widest px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-2 border border-red-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>{t('soldOut')}</span>
            </div>
          </div>
        )}
        
        {/* Dynamic Top-Left Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.telegramChannel && (
            <span className="bg-indigo-600/90 text-white font-mono text-[10px] tracking-wider px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm">
              {product.telegramChannel}
            </span>
          )}
          {hasDiscount && !isSoldOut && (
            <span className="bg-rose-600 text-white font-sans text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1.5 w-max">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>{t('sale')}</span>
            </span>
          )}
        </div>

        {/* Stock Status Badge */}
        <div className="absolute bottom-3 left-3 z-10">
          {isSoldOut ? (
            <span className="bg-red-500/90 text-white font-sans text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>{t('soldOut')}</span>
            </span>
          ) : isLowStock ? (
            <span className="bg-amber-500/95 text-white font-sans text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm flex items-center gap-1.5 border border-amber-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>{t('lowStock')} ({product.stockCount})</span>
            </span>
          ) : (
            <span className="bg-emerald-500/90 text-white font-sans text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>{t('inStock')} {product.stockCount !== undefined ? `(${product.stockCount})` : ''}</span>
            </span>
          )}
        </div>

        {/* Action Tray (Wishlist & Share) */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
          {onWishlistToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onWishlistToggle(e);
              }}
              className="p-2 bg-white/90 hover:bg-white text-gray-400 hover:text-red-500 rounded-full backdrop-blur-sm shadow-sm transition-all cursor-pointer flex items-center justify-center"
              title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              id={`product-card-wishlist-${product.id}`}
            >
              <Heart className={`w-4 h-4 transition-transform active:scale-125 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
            </button>
          )}

          <button
            onClick={handleShare}
            className="p-2 bg-white/90 hover:bg-white text-gray-400 hover:text-indigo-600 rounded-full backdrop-blur-sm shadow-sm transition-all cursor-pointer flex items-center justify-center"
            title="Share Product"
            id={`product-card-share-${product.id}`}
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Add To Cart Button */}
        {onAddToCart && (
          <button
            id={`product-card-quick-add-${product.id}`}
            disabled={isSoldOut}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart();
            }}
            className={`absolute bottom-3 right-3 h-10 w-10 sm:h-11 sm:w-11 rounded-full shadow-lg border backdrop-blur-sm transition-all duration-300 z-20 flex items-center justify-center ${
              isSoldOut
                ? 'bg-gray-100/80 text-gray-400 border-gray-200 cursor-not-allowed opacity-50 pointer-events-none'
                : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700 hover:scale-110 active:scale-95 shadow-indigo-100 cursor-pointer'
            }`}
            title="Add to Cart"
          >
            <Plus className="w-5 h-5 font-bold" />
          </button>
        )}
      </div>

      {/* Product Details */}
      <div className="p-5 flex flex-col flex-grow">
        {product.category && (
          <span className="text-[10px] font-bold text-indigo-500 tracking-wider uppercase mb-1 block">
            {product.category}
          </span>
        )}
        <h3 className="font-sans font-semibold text-gray-900 text-base line-clamp-1 group-hover:text-indigo-600 transition-colors">
          {product.title}
        </h3>
        
        <p className="mt-1 text-sm text-gray-500 line-clamp-2 flex-grow">
          {product.description || 'No description available.'}
        </p>

        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Tag className="w-4 h-4 text-indigo-500" />
            {hasDiscount ? (
              <div className="flex items-baseline space-x-2">
                <span className="font-display font-extrabold text-lg text-rose-600">
                  ${Number(product.discountedPrice).toFixed(2)}
                </span>
                <span className="text-xs text-gray-400 line-through">
                  ${Number(product.price).toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="font-display font-bold text-lg text-gray-900">
                ${Number(product.price).toFixed(2)}
              </span>
            )}
          </div>
          
          <span className="text-xs font-semibold text-indigo-600 group-hover:underline flex items-center space-x-0.5">
            <span>{t('viewDetails')}</span>
            <ExternalLink className="w-3 h-3" />
          </span>
        </div>

        {onQuickBuy && (
          <div className="mt-3">
            <button
              disabled={isSoldOut}
              onClick={(e) => {
                e.stopPropagation();
                onQuickBuy();
              }}
              className={`w-full py-2 px-3 rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer flex items-center justify-center space-x-1.5 ${
                isSoldOut
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98] shadow-sm shadow-indigo-100'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{isSoldOut ? t('soldOut') : t('quickBuy')}</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
