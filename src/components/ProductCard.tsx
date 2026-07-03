import { Product } from '../types';
import { Tag, ExternalLink, Heart, ShoppingBag } from 'lucide-react';
import { MouseEvent } from 'react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  isWishlisted?: boolean;
  onWishlistToggle?: (e: MouseEvent) => void;
  onQuickBuy?: () => void;
  key?: string | number;
}

export default function ProductCard({ 
  product, 
  onClick, 
  isWishlisted = false, 
  onWishlistToggle,
  onQuickBuy 
}: ProductCardProps) {
  // Use a professional product placeholder if no images are present or image fails to load
  const imageSrc = product.images && product.images.length > 0 && product.images[0]
    ? product.images[0]
    : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

  const isSoldOut = product.stockCount !== undefined && product.stockCount === 0;

  return (
    <motion.div 
      whileHover={{ scale: 1.025 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer flex flex-col h-full relative"
      onClick={onClick}
      id={`product-card-${product.id}`}
    >
      {/* Product Image Stage */}
      <div className="relative aspect-square w-full bg-gray-50 overflow-hidden">
        <img
          src={imageSrc}
          alt={product.title}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isSoldOut ? 'grayscale contrast-75 opacity-80' : ''}`}
          onError={(e) => {
            // Fallback if image fails to load
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
          }}
        />
        {product.telegramChannel && (
          <span className="absolute top-3 left-3 bg-indigo-600/90 text-white font-mono text-[10px] tracking-wider px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm z-10">
            {product.telegramChannel}
          </span>
        )}

        {/* Stock Status Badge */}
        <div className="absolute bottom-3 left-3 z-10">
          {isSoldOut ? (
            <span className="bg-red-500/90 text-white font-sans text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>Sold Out</span>
            </span>
          ) : (
            <span className="bg-emerald-500/90 text-white font-sans text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>In Stock {product.stockCount !== undefined ? `(${product.stockCount})` : ''}</span>
            </span>
          )}
        </div>

        {/* Wishlist toggle heart icon floating */}
        {onWishlistToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWishlistToggle(e);
            }}
            className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white text-gray-400 hover:text-red-500 rounded-full backdrop-blur-sm shadow-sm transition-all z-20 cursor-pointer"
            title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <Heart className={`w-4 h-4 transition-transform active:scale-125 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
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
          <div className="flex items-center space-x-1">
            <Tag className="w-4 h-4 text-indigo-500" />
            <span className="font-display font-bold text-lg text-gray-900">
              ${Number(product.price).toFixed(2)}
            </span>
          </div>
          
          <span className="text-xs font-semibold text-indigo-600 group-hover:underline flex items-center space-x-0.5">
            <span>View Details</span>
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
              <span>{isSoldOut ? 'Sold Out' : 'Quick Buy'}</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
