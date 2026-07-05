import { ShoppingBag, Lock, Home, Terminal, Heart } from 'lucide-react';
import { useTranslation, LanguageSelect } from '../lib/i18n';

interface NavbarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  cartItemCount: number;
  wishlistItemCount: number;
}

export default function Navbar({ currentView, onViewChange, cartItemCount, wishlistItemCount }: NavbarProps) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm" id="main-header">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand Name */}
          <div 
            className="flex items-center space-x-1.5 sm:space-x-2 cursor-pointer group flex-shrink-0"
            onClick={() => onViewChange('products')}
            id="logo-button"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:bg-indigo-700 transition-colors">
              <ShoppingBag className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </div>
            <span className="font-display font-bold text-lg sm:text-xl text-gray-900 tracking-tight hidden min-[440px]:inline-block">
              Telegram<span className="text-indigo-600 font-medium font-sans">Shop</span>
            </span>
            <span className="font-display font-bold text-lg text-gray-900 tracking-tight min-[440px]:hidden inline-block">
              TG<span className="text-indigo-600 font-medium font-sans">Shop</span>
            </span>
          </div>

          {/* Nav Elements */}
          <div className="flex items-center space-x-1 sm:space-x-4" id="nav-actions">
            {/* Language Switcher */}
            <LanguageSelect />

            <button
              onClick={() => onViewChange('products')}
              className={`flex items-center space-x-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                currentView === 'products' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              id="nav-home"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">{t('browse')}</span>
            </button>

            {/* Shopping Cart Indicator */}
            <button
              onClick={() => onViewChange('cart')}
              className={`relative flex items-center space-x-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                currentView === 'cart'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              id="nav-cart"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">{t('cart')}</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white font-sans font-bold text-xxs w-5 h-5 rounded-full flex items-center justify-center scale-90 border-2 border-white animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Wishlist Indicator */}
            <button
              onClick={() => onViewChange('wishlist')}
              className={`relative flex items-center space-x-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                currentView === 'wishlist'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              id="nav-wishlist"
            >
              <Heart className={`w-4 h-4 ${wishlistItemCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
              <span className="hidden sm:inline">{t('wishlist')}</span>
              {wishlistItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white font-sans font-bold text-xxs w-5 h-5 rounded-full flex items-center justify-center scale-90 border-2 border-white">
                  {wishlistItemCount}
                </span>
              )}
            </button>

            {/* Admin Access Link */}
            <button
              onClick={() => onViewChange(localStorage.getItem('adminToken') ? 'admin-dashboard' : 'admin-login')}
              className={`flex items-center space-x-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                currentView.startsWith('admin')
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              id="nav-admin"
            >
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">{t('sellerPortal')}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
