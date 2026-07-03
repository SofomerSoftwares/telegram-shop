import { useState, FormEvent } from 'react';
import { CartItem } from '../types';
import { ArrowLeft, ShoppingBag, Send, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast } from './Toast';

interface CheckoutPageProps {
  cartItems: CartItem[];
  onOrderSuccess: () => void;
  onViewChange: (view: string) => void;
}

export default function CheckoutPage({ cartItems, onOrderSuccess, onViewChange }: CheckoutPageProps) {
  const toast = useToast();
  const [customerName, setCustomerName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Successful order state
  const [orderId, setOrderId] = useState('');
  const [notificationSent, setNotificationSent] = useState(false);

  const totalPrice = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim() || !contactInfo.trim() || !deliveryAddress.trim()) {
      setError('Please fill out all the fields in the form.');
      return;
    }

    setIsSubmitting(true);

    const itemsPayload = cartItems.map(item => ({
      productId: item.product.id,
      title: item.product.title,
      price: item.product.price,
      quantity: item.quantity,
      imageUrl: item.product.images?.[0] || ''
    }));

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          contactInfo,
          deliveryAddress,
          items: itemsPayload,
          totalPrice
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      setOrderId(data.orderId);
      setNotificationSent(data.notificationSent);
      
      if (data.notificationSent) {
        toast.success(`Order placed! Seller has been notified on Telegram.`, "Order Successful");
      } else {
        toast.warning(`Order saved, but seller notification failed.`, "Order Saved");
      }
      
      // Clear local cart via handler
      onOrderSuccess();
    } catch (err: any) {
      const errorMsg = err.message || 'Server error. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg, "Checkout Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Order Confirmation Success Screen
  if (orderId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16" id="order-success-screen">
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm text-center">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12" />
          </div>

          <h1 className="font-display font-bold text-2xl text-gray-900">Order Placed Successfully!</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Thank you for shopping with us. Your order has been securely recorded.
          </p>

          <div className="my-6 bg-gray-50 rounded-2xl p-4 text-left space-y-2 border border-gray-100 font-mono text-xs text-gray-600">
            <div><span className="font-semibold text-gray-800">Order ID:</span> #{orderId}</div>
            <div><span className="font-semibold text-gray-800">Customer:</span> {customerName}</div>
            <div><span className="font-semibold text-gray-800">Delivery Address:</span> {deliveryAddress}</div>
            <div><span className="font-semibold text-gray-800">Total Charged:</span> ${totalPrice.toFixed(2)}</div>
          </div>

          {notificationSent ? (
            <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100 text-xs sm:text-sm text-left">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>Seller has been immediately notified via Telegram Bot!</span>
            </div>
          ) : (
            <div className="flex items-start space-x-2 text-amber-700 bg-amber-50 px-4 py-3 rounded-xl border border-amber-100 text-xs sm:text-sm text-left">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Order saved, but seller notification failed.</span>
                <p className="text-[11px] mt-0.5 text-amber-600">
                  The Telegram Bot token or Admin Chat ID may not be fully configured yet. You can set them up in the Seller Portal.
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 space-y-3">
            <button
              onClick={() => onViewChange('products')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-2xl transition-all shadow-md shadow-indigo-100 cursor-pointer"
              id="success-home-button"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => onViewChange('admin-login')}
              className="w-full text-indigo-600 hover:text-indigo-800 font-semibold py-2.5 rounded-2xl text-xs sm:text-sm transition-colors cursor-pointer"
              id="success-admin-button"
            >
              Check Seller Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" id="checkout-view-container">
      {/* Back to Cart */}
      <button
        onClick={() => onViewChange('cart')}
        className="inline-flex items-center space-x-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 mb-8 transition-colors group"
        id="checkout-back-button"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Shopping Cart</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Form Column */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm">
          <h1 className="font-display font-bold text-2xl text-gray-900 mb-6">Delivery & Contact Information</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm" id="checkout-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" id="checkout-form">
            <div>
              <label htmlFor="customerName" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="customerName"
                placeholder="John Doe"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label htmlFor="contactInfo" className="block text-sm font-semibold text-gray-700 mb-2">
                Contact Info (Phone / Email / Telegram)
              </label>
              <input
                type="text"
                id="contactInfo"
                placeholder="+1 (555) 019-2834 or @johndoe"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label htmlFor="deliveryAddress" className="block text-sm font-semibold text-gray-700 mb-2">
                Delivery Address
              </label>
              <textarea
                id="deliveryAddress"
                rows={4}
                placeholder="123 Shopping Avenue, Suite 10, City, Country"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                disabled={isSubmitting}
                required
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-indigo-100 transition-all cursor-pointer text-sm sm:text-base ${
                isSubmitting ? 'opacity-85 cursor-not-allowed' : ''
              }`}
              id="place-order-button"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Order...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Place Order (${totalPrice.toFixed(2)})</span>
                </>
              )}
            </motion.button>
          </form>
        </div>

        {/* Right Summary Column */}
        <div className="lg:col-span-5 bg-gray-50 border border-gray-100 rounded-3xl p-6 h-fit" id="checkout-items-summary">
          <h2 className="font-display font-bold text-lg text-gray-900 mb-4 flex items-center space-x-2">
            <ShoppingBag className="w-4.5 h-4.5 text-indigo-600" />
            <span>Basket Summary ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</span>
          </h2>

          <div className="divide-y divide-gray-200/50 max-h-80 overflow-y-auto mb-6 pr-1">
            {cartItems.map((item) => {
              const product = item.product;
              return (
                <div key={product.id} className="py-4 flex items-center justify-between text-sm">
                  <div className="min-w-0 pr-3">
                    <span className="font-semibold text-gray-900 block line-clamp-1">{product.title}</span>
                    <span className="text-gray-500 text-xs mt-0.5">Qty: {item.quantity} × ${Number(product.price).toFixed(2)}</span>
                  </div>
                  <span className="font-display font-bold text-gray-900 flex-shrink-0">
                    ${(product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-200/80 pt-4 space-y-3">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Delivery</span>
              <span className="text-emerald-600 font-semibold uppercase text-xs">Free Courier</span>
            </div>
            <div className="flex justify-between items-center text-base font-bold text-gray-900 pt-2 border-t border-dashed border-gray-200">
              <span>Total Price</span>
              <span className="font-display text-xl text-indigo-600">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
