import { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import ProductDetail from './components/ProductDetail';
import CartPage from './components/CartPage';
import CheckoutPage from './components/CheckoutPage';
import AdminPanel from './components/AdminPanel';
import WishlistPage from './components/WishlistPage';
import { Product, CartItem } from './types';
import { useToast } from './components/Toast';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, ShoppingBag, Terminal, ShieldAlert, ChevronDown, Search, X } from 'lucide-react';

export default function App() {
  const toast = useToast();

  // Navigation & Routing state
  const [currentView, setCurrentView] = useState<string>('products');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Products and Cart list
  const [products, setProducts] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  // Shopping Cart state with Local Storage persistence
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('telegram_shop_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  // Wishlist state with Local Storage persistence
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const savedWishlist = localStorage.getItem('telegram_shop_wishlist');
      return savedWishlist ? JSON.parse(savedWishlist) : [];
    } catch {
      return [];
    }
  });

  // Sync cart to local storage
  useEffect(() => {
    localStorage.setItem('telegram_shop_cart', JSON.stringify(cart));
  }, [cart]);

  // Sync wishlist to local storage
  useEffect(() => {
    localStorage.setItem('telegram_shop_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Fetch all products on initial render and view changes
  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to load catalog products');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
        setError('Received invalid data format from the server.');
      }
    } catch (err: any) {
      setProducts([]);
      setError(err.message || 'Error connecting to the backend service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Cart operations
  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
    toast.success(`${product.title} has been added to your shopping cart.`, "Added to Cart");
  };

  const handleQuickBuy = (product: Product) => {
    if (product.stockCount !== undefined && product.stockCount === 0) {
      toast.error(`"${product.title}" is currently sold out.`, "Cannot Quick Buy");
      return;
    }
    // Add item to cart
    handleAddToCart(product);
    // Direct redirect to checkout
    handleViewChange('checkout');
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    const itemToRemove = cart.find((item) => item.product.id === productId);
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
    if (itemToRemove) {
      toast.info(`${itemToRemove.product.title} was removed from your cart.`, "Item Removed");
    }
  };

  const handleClearCart = () => {
    setCart([]);
    toast.info("All items cleared from your shopping cart.", "Cart Cleared");
  };

  const handleWishlistToggle = (product: Product) => {
    setWishlist((prevWishlist) => {
      const isWishlisted = prevWishlist.includes(product.id);
      if (isWishlisted) {
        toast.info(`${product.title} has been removed from your wishlist.`, "Removed from Wishlist");
        return prevWishlist.filter((id) => id !== product.id);
      } else {
        toast.success(`${product.title} has been added to your wishlist.`, "Added to Wishlist");
        return [...prevWishlist, product.id];
      }
    });
  };

  const wishlistProducts = useMemo(() => {
    return products.filter((p) => wishlist.includes(p.id));
  }, [products, wishlist]);

  const handleOrderSuccess = () => {
    // Clear the shopping basket on success
    setCart([]);
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    // Scroll to top on view changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Unique list of product categories
  const categories = useMemo(() => {
    const list = new Set<string>();
    products.forEach((p) => {
      if (p.category) {
        const cat = p.category.trim();
        if (cat) {
          list.add(cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase());
        }
      }
    });
    return ['All', ...Array.from(list).sort()];
  }, [products]);

  // Count products in each category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: products.length };
    products.forEach((p) => {
      if (p.category) {
        const cat = p.category.trim();
        if (cat) {
          const formattedCat = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
          counts[formattedCat] = (counts[formattedCat] || 0) + 1;
        }
      }
    });
    return counts;
  }, [products]);

  // Filtered products list by selected category and search query
  const filteredProducts = useMemo(() => {
    let list = products;

    // Category Filter
    if (selectedCategory.toLowerCase() !== 'all') {
      list = list.filter(
        (p) => p.category && p.category.trim().toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Search Filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const titleMatch = p.title?.toLowerCase().includes(query) || false;
        const descMatch = p.description?.toLowerCase().includes(query) || false;
        const categoryMatch = p.category?.toLowerCase().includes(query) || false;
        return titleMatch || descMatch || categoryMatch;
      });
    }

    return list;
  }, [products, selectedCategory, searchQuery]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (sortBy === 'price-low-high') {
        return a.price - b.price;
      } else if (sortBy === 'price-high-low') {
        return b.price - a.price;
      } else {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }
    });
  }, [filteredProducts, sortBy]);

  // Render view helpers
  const renderCurrentView = () => {
    switch (currentView) {
      case 'products':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="browse-view">
            {/* Banner Section */}
            <div className="bg-indigo-600 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-lg shadow-indigo-100 mb-12">
              <div className="relative z-10 max-w-xl">
                <span className="text-xs font-bold tracking-widest uppercase bg-indigo-500 text-indigo-100 px-3 py-1 rounded-full border border-indigo-400">
                  Instant Synced Catalogue
                </span>
                <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl mt-4 leading-tight">
                  Seamless Shopping Straight from Telegram
                </h1>
                <p className="mt-4 text-indigo-100 text-sm sm:text-base leading-relaxed font-sans">
                  Browse products uploaded and managed via Telegram channels in real-time. Secure checkout, quick delivery, and instant seller notifications.
                </p>
              </div>
              
              {/* Abstract decorative elements */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-60 h-60 bg-indigo-400/20 rounded-full mr-10 -mb-20 blur-xl pointer-events-none" />
            </div>

            {/* Catalogue Grid */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
              <div>
                <h2 className="font-display font-bold text-2xl text-gray-900">Featured Catalogue</h2>
                <p className="text-gray-500 text-xs sm:text-sm">Real-time listing of available products</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                {/* Search Input Bar */}
                <div className="relative flex-grow sm:flex-grow-0 sm:w-64 animate-fade-in">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-gray-400 shadow-sm"
                    id="search-input"
                  />
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                    <Search className="w-4 h-4" />
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-2.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {products.length > 0 && (
                    <div className="relative flex-grow sm:flex-grow-0">
                      <select
                        id="sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none w-full bg-white border border-gray-200 rounded-xl px-4 py-2 pr-10 text-xs sm:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer transition-all shadow-sm"
                      >
                        <option value="newest">Newest</option>
                        <option value="price-low-high">Price: Low to High</option>
                        <option value="price-high-low">Price: High to Low</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                  <button
                    onClick={fetchProducts}
                    className="p-2 border border-gray-100 bg-white rounded-xl hover:bg-gray-50 text-gray-500 transition-colors cursor-pointer flex-shrink-0 shadow-sm"
                    title="Refresh listings"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Filters */}
            {!loading && !error && products.length > 0 && categories.length > 1 && (
              <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-8 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none" id="categories-filter">
                {categories.map((category) => {
                  const isActive = selectedCategory.toLowerCase() === category.toLowerCase();
                  const count = categoryCounts[category] ?? 0;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`flex-shrink-0 px-4.5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {category} <span className={`text-[10px] ml-1 font-mono font-medium ${isActive ? 'text-indigo-200' : 'text-gray-400'}`}>({count})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {loading ? (
              <div className="py-20 text-center text-gray-400">
                <div className="w-10 h-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium">Synchronizing Telegram catalogue...</p>
              </div>
            ) : error ? (
              <div className="py-16 text-center text-red-600 max-w-md mx-auto bg-red-50/50 rounded-3xl border border-red-100 p-8">
                <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-red-500" />
                <p className="text-sm font-semibold">{error}</p>
                <button 
                  onClick={fetchProducts}
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2 rounded-xl"
                >
                  Retry Connection
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center text-gray-400 border border-dashed border-gray-200 rounded-3xl bg-gray-50/30">
                <ShoppingBag className="w-14 h-14 mx-auto mb-4 text-gray-300" />
                <h3 className="font-sans font-bold text-gray-700 text-base">Your catalogue is currently empty</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  Go to the <span className="text-indigo-600 font-semibold">Seller Portal</span> to configure your bot credentials or simulate channel posts to fill this store immediately!
                </p>
                <button
                  onClick={() => handleViewChange('admin-login')}
                  className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md transition-colors"
                >
                  Configure Seller Portal
                </button>
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="py-20 text-center text-gray-400 border border-dashed border-gray-200 rounded-3xl bg-gray-50/30 animate-fade-in">
                <Search className="w-14 h-14 mx-auto mb-4 text-gray-300" />
                <h3 className="font-sans font-bold text-gray-700 text-base">No products match your search</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  We couldn't find anything matching "<span className="text-indigo-600 font-semibold">{searchQuery}</span>". Try checking for spelling mistakes or searching for something else.
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Clear Search Query
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" id="products-grid">
                {sortedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isWishlisted={wishlist.includes(product.id)}
                    onWishlistToggle={() => handleWishlistToggle(product)}
                    onQuickBuy={() => handleQuickBuy(product)}
                    onClick={() => {
                      setSelectedProduct(product);
                      handleViewChange('product-detail');
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 'product-detail':
        return selectedProduct ? (
          <ProductDetail
            product={selectedProduct}
            onBack={() => handleViewChange('products')}
            onAddToCart={handleAddToCart}
            isWishlisted={wishlist.includes(selectedProduct.id)}
            onWishlistToggle={() => handleWishlistToggle(selectedProduct)}
          />
        ) : (
          <div className="py-20 text-center text-gray-500">No product selected</div>
        );

      case 'wishlist':
        return (
          <WishlistPage
            wishlistProducts={wishlistProducts}
            onWishlistToggle={handleWishlistToggle}
            onProductClick={(product) => {
              setSelectedProduct(product);
              handleViewChange('product-detail');
            }}
            onViewChange={handleViewChange}
            onQuickBuy={handleQuickBuy}
          />
        );

      case 'cart':
        return (
          <CartPage
            cartItems={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onViewChange={handleViewChange}
          />
        );

      case 'checkout':
        return (
          <CheckoutPage
            cartItems={cart}
            onOrderSuccess={handleOrderSuccess}
            onViewChange={handleViewChange}
          />
        );

      case 'admin-login':
      case 'admin-dashboard':
        return (
          <AdminPanel
            currentView={currentView}
            onViewChange={handleViewChange}
            onProductUpdated={fetchProducts}
          />
        );

      default:
        return <div className="py-20 text-center">Page not found</div>;
    }
  };

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans flex flex-col justify-between" id="app-root">
      <div>
        {/* Navigation Bar */}
        <Navbar
          currentView={currentView}
          onViewChange={handleViewChange}
          cartItemCount={totalCartItems}
          wishlistItemCount={wishlist.length}
        />

        {/* Main Viewport Container */}
        <main className="pb-16" id="main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderCurrentView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Modern, Simple, Non-intrusive Footer */}
      <footer className="border-t border-gray-100 bg-gray-50 py-8" id="footer">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-400 font-medium">
            &copy; 2026 Telegram E-commerce Platform. Powered by Firebase & Gemini AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
