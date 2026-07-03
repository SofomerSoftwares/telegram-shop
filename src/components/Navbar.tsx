import { ShoppingBag, Lock, Home, Terminal, Heart } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  cartItemCount: number;
  wishlistItemCount: number;
}

export default function Navbar({ currentView, onViewChange, cartItemCount, wishlistItemCount }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm" id="main-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand Name */}
          <div 
            className="flex items-center space-x-2 cursor-pointer group"
            onClick={() => onViewChange('products')}
            id="logo-button"
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-100 group-hover:bg-indigo-700 transition-colors">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl text-gray-900 tracking-tight">
              Telegram<span className="text-indigo-600 font-medium font-sans">Shop</span>
            </span>
          </div>

          {/* Nav Elements */}
          <div className="flex items-center space-x-4" id="nav-actions">
            <button
              onClick={() => onViewChange('products')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'products' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              id="nav-home"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Browse</span>
            </button>

            {/* Shopping Cart Indicator */}
            <button
              onClick={() => onViewChange('cart')}
              className={`relative flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'cart'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              id="nav-cart"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white font-sans font-bold text-xxs w-5 h-5 rounded-full flex items-center justify-center scale-90 border-2 border-white animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Wishlist Indicator */}
            <button
              onClick={() => onViewChange('wishlist')}
              className={`relative flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'wishlist'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              id="nav-wishlist"
            >
              <Heart className={`w-4 h-4 ${wishlistItemCount > 0 ? 'fill-red-500 text-red-500' : ''}`} />
              <span className="hidden sm:inline">Wishlist</span>
              {wishlistItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white font-sans font-bold text-xxs w-5 h-5 rounded-full flex items-center justify-center scale-90 border-2 border-white">
                  {wishlistItemCount}
                </span>
              )}
            </button>

            {/* Admin Access Link */}
            <button
              onClick={() => onViewChange(localStorage.getItem('adminToken') ? 'admin-dashboard' : 'admin-login')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView.startsWith('admin')
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              id="nav-admin"
            >
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Seller Portal</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
