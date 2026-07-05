import { Product } from '../types';
import ProductCard from './ProductCard';
import { Heart, ArrowLeft, ShoppingBag } from 'lucide-react';

interface WishlistPageProps {
  wishlistProducts: Product[];
  onWishlistToggle: (product: Product) => void;
  onProductClick: (product: Product) => void;
  onViewChange: (view: string) => void;
  onQuickBuy?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export default function WishlistPage({
  wishlistProducts,
  onWishlistToggle,
  onProductClick,
  onViewChange,
  onQuickBuy,
  onAddToCart,
}: WishlistPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id="wishlist-view">
      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <button
            onClick={() => onViewChange('products')}
            className="inline-flex items-center space-x-1 text-xs font-bold text-gray-500 hover:text-indigo-600 uppercase tracking-wider mb-2 transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Browse</span>
          </button>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 tracking-tight flex items-center gap-2">
            <Heart className="w-7 h-7 text-red-500 fill-red-500" />
            <span>My Wishlist</span>
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            Your curated collection of favorite products saved to this browser
          </p>
        </div>
      </div>

      {wishlistProducts.length === 0 ? (
        <div className="py-20 text-center text-gray-400 border border-dashed border-gray-200 rounded-3xl bg-gray-50/30">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
            <Heart className="w-8 h-8 fill-red-100" />
          </div>
          <h3 className="font-sans font-bold text-gray-700 text-base">Your wishlist is empty</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto leading-relaxed">
            Explore our collection and click the heart icon on any product card to save it here for later!
          </p>
          <button
            onClick={() => onViewChange('products')}
            className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md transition-colors cursor-pointer"
          >
            Explore Catalogue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" id="wishlist-grid">
          {wishlistProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={true}
              onWishlistToggle={() => onWishlistToggle(product)}
              onClick={() => onProductClick(product)}
              onQuickBuy={onQuickBuy ? () => onQuickBuy(product) : undefined}
              onAddToCart={onAddToCart ? () => onAddToCart(product) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
