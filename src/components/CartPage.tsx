import { CartItem } from '../types';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface CartPageProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onViewChange: (view: string) => void;
}

export default function CartPage({ 
  cartItems, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart, 
  onViewChange 
}: CartPageProps) {
  const totalPrice = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center" id="empty-cart-view">
        <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="font-display font-bold text-2xl text-gray-900">Your shopping cart is empty</h2>
        <p className="text-gray-500 mt-2 max-w-sm mx-auto text-sm">
          Browse our catalogue synced directly from Telegram channels to find amazing products!
        </p>
        <button
          onClick={() => onViewChange('products')}
          className="mt-8 inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md shadow-indigo-100 transition-colors cursor-pointer"
          id="cart-empty-browse-button"
        >
          <span>Start Browsing</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" id="cart-view-container">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-5">
        <div>
          <h1 className="font-display font-bold text-3xl text-gray-900 tracking-tight">Shopping Cart</h1>
          <p className="text-gray-500 text-sm mt-1">Review the items you want to order</p>
        </div>
        <button
          onClick={onClearCart}
          className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors flex items-center space-x-1"
          id="clear-cart-button"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Item List */}
        <div className="lg:col-span-2 space-y-4" id="cart-items-list">
          {cartItems.map((item) => {
            const product = item.product;
            const itemImage = product.images && product.images.length > 0 && product.images[0]
              ? product.images[0]
              : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

            return (
              <div 
                key={product.id}
                className="flex items-center space-x-4 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm"
                id={`cart-item-${product.id}`}
              >
                {/* Product Image */}
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                  <img src={itemImage} alt={product.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>

                {/* Details */}
                <div className="flex-grow min-w-0">
                  <h3 className="font-sans font-semibold text-gray-900 text-sm sm:text-base line-clamp-1">
                    {product.title}
                  </h3>
                  <p className="text-gray-500 text-xs sm:text-sm font-medium mt-0.5">
                    ${Number(product.price).toFixed(2)} each
                  </p>
                  
                  {/* Quantity adjustment & Delete */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-1 border border-gray-100 rounded-lg p-0.5 bg-gray-50">
                      <button
                        onClick={() => onUpdateQuantity(product.id, item.quantity - 1)}
                        className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-md transition-all"
                        id={`quantity-minus-${product.id}`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-sans font-semibold text-gray-900 text-xs px-2.5">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(product.id, item.quantity + 1)}
                        className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-md transition-all"
                        id={`quantity-plus-${product.id}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(product.id)}
                      className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors"
                      id={`remove-item-${product.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Total Item Price */}
                <div className="text-right flex-shrink-0 pl-2">
                  <span className="font-display font-bold text-sm sm:text-base text-gray-900 block">
                    ${(product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cart Summary */}
        <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 h-fit" id="cart-summary-panel">
          <h2 className="font-display font-bold text-lg text-gray-900 mb-4">Order Summary</h2>
          
          <div className="space-y-3 pb-4 border-b border-gray-200/50 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span className="font-sans font-semibold text-gray-900">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Shipping</span>
              <span className="text-emerald-600 font-semibold uppercase text-xs">Free Delivery</span>
            </div>
          </div>

          <div className="flex justify-between items-center py-4 text-base font-bold text-gray-900">
            <span>Total Price</span>
            <span className="font-display text-xl text-indigo-600">${totalPrice.toFixed(2)}</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewChange('checkout')}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-indigo-100 transition-colors cursor-pointer text-sm sm:text-base"
            id="cart-checkout-button"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>

          <button
            onClick={() => onViewChange('products')}
            className="w-full mt-3 text-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors py-2"
            id="continue-shopping-button"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
