import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'am';

export interface Translations {
  // Navigation
  browse: string;
  cart: string;
  wishlist: string;
  sellerPortal: string;
  
  // Search & Filter
  searchPlaceholder: string;
  sortBy: string;
  sortDefault: string;
  sortPriceLowHigh: string;
  sortPriceHighLow: string;
  sortDiscount: string;
  noProductsFound: string;
  clearSearch: string;
  emptyCatalog: string;
  emptyCatalogDesc: string;
  configureSellerPortal: string;
  syncCatalog: string;

  // Product Card / Details
  sale: string;
  soldOut: string;
  addToCart: string;
  addedToCart: string;
  quickBuy: string;
  cannotQuickBuy: string;
  contactSeller: string;
  share: string;
  sharedSuccess: string;
  copiedToClipboard: string;
  copied: string;
  copyFailed: string;
  backToCatalog: string;
  reviews: string;
  writeReview: string;
  noReviews: string;
  addReview: string;
  rating: string;
  name: string;
  comment: string;
  submit: string;
  category: string;
  telegramPostId: string;
  inStock: string;
  viewDetails: string;
  verifiedTelegramPost: string;
  clickToZoom: string;
  description: string;
  messageSeller: string;
  addedToCartExcl: string;
  addtoShoppingCart: string;
  syncedFrom: string;
  startBrowsing: string;
  continueShopping: string;
  cartReviewDesc: string;
  clearAll: string;
  orderSummary: string;
  subtotal: string;
  shipping: string;
  freeDelivery: string;
  totalPrice: string;
  each: string;

  // Cart
  yourCart: string;
  emptyCart: string;
  emptyCartDesc: string;
  total: string;
  quantity: string;
  proceedToCheckout: string;
  remove: string;

  // Checkout
  checkout: string;
  customerInfo: string;
  fullName: string;
  telegramUsername: string;
  phoneNumber: string;
  shippingMethod: string;
  deliveryAddress: string;
  paymentMethod: string;
  confirmOrder: string;
  orderNotes: string;
  submitting: string;
  cashOnDelivery: string;
  bankTransfer: string;
  crypto: string;
  localPickup: string;
  standardDelivery: string;
  expressDelivery: string;
  orderSuccess: string;
  orderSuccessDesc: string;
  contactInfoPlace: string;
  fillRequired: string;
  orderPlacedSuccess: string;
  orderThankYou: string;
  orderIdLabel: string;
  customerLabel: string;
  deliveryAddressLabel: string;
  totalChargedLabel: string;
  immediateNotify: string;
  notifyFailed: string;
  notifyFailedDesc: string;
  checkSellerPortal: string;
  deliveryContactHeader: string;
  contactInfoLabel: string;
  processingOrder: string;
  placeOrderBtn: string;
  basketSummary: string;
  freeCourier: string;

  // Wishlist
  yourWishlist: string;
  emptyWishlist: string;
  emptyWishlistDesc: string;
  lowStock: string;
}

const dictionaries: Record<Language, Translations> = {
  en: {
    browse: 'Browse',
    cart: 'Cart',
    wishlist: 'Wishlist',
    sellerPortal: 'Seller Portal',
    searchPlaceholder: 'Search products...',
    sortBy: 'Sort by',
    sortDefault: 'Default',
    sortPriceLowHigh: 'Price: Low to High',
    sortPriceHighLow: 'Price: High to Low',
    sortDiscount: 'Discount',
    noProductsFound: 'No products match your search',
    clearSearch: 'Clear Search Query',
    emptyCatalog: 'Your catalogue is currently empty',
    emptyCatalogDesc: 'Go to the Seller Portal to configure your bot credentials or simulate channel posts to fill this store immediately!',
    configureSellerPortal: 'Configure Seller Portal',
    syncCatalog: 'Synchronizing Telegram catalogue...',
    sale: 'Sale',
    soldOut: 'Sold Out',
    addToCart: 'Add to Cart',
    addedToCart: 'Added to Cart',
    quickBuy: 'Quick Buy',
    cannotQuickBuy: 'Cannot Quick Buy',
    contactSeller: 'Contact Seller on Telegram',
    share: 'Share',
    sharedSuccess: 'Product shared successfully!',
    copiedToClipboard: 'Link copied to clipboard!',
    copied: 'Copied',
    copyFailed: 'Failed to copy link to clipboard.',
    backToCatalog: 'Back to Catalog',
    reviews: 'Reviews',
    writeReview: 'Write a Review',
    noReviews: 'No reviews yet. Be the first to review this product!',
    addReview: 'Add a Review',
    rating: 'Rating',
    name: 'Your Name',
    comment: 'Your Review',
    submit: 'Submit Review',
    category: 'Category',
    telegramPostId: 'Telegram Post ID',
    inStock: 'In Stock',
    viewDetails: 'View Details',
    verifiedTelegramPost: 'Verified Telegram Post',
    clickToZoom: 'Click to expand & zoom',
    description: 'Description',
    messageSeller: 'Message Seller on Telegram',
    addedToCartExcl: 'Added to Cart!',
    addtoShoppingCart: 'Add to Shopping Cart',
    syncedFrom: 'Synced from',
    startBrowsing: 'Start Browsing',
    continueShopping: 'Continue Shopping',
    cartReviewDesc: 'Review the items you want to order',
    clearAll: 'Clear All',
    orderSummary: 'Order Summary',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    freeDelivery: 'Free Delivery',
    totalPrice: 'Total Price',
    each: 'each',
    yourCart: 'Your Cart',
    emptyCart: 'Your cart is empty',
    emptyCartDesc: 'Add some products from the browse page to get started!',
    total: 'Total',
    quantity: 'Quantity',
    proceedToCheckout: 'Proceed to Checkout',
    remove: 'Remove',
    checkout: 'Checkout',
    customerInfo: 'Customer Information',
    fullName: 'Full Name',
    telegramUsername: 'Telegram Username',
    phoneNumber: 'Phone Number',
    shippingMethod: 'Shipping Method',
    deliveryAddress: 'Delivery Address',
    paymentMethod: 'Payment Method',
    confirmOrder: 'Confirm Order',
    orderNotes: 'Order Notes (Optional)',
    submitting: 'Submitting Order...',
    cashOnDelivery: 'Cash on Delivery (COD)',
    bankTransfer: 'Bank Transfer / Telebirr',
    crypto: 'Crypto Payment',
    localPickup: 'Local Pickup (Free)',
    standardDelivery: 'Standard Delivery',
    expressDelivery: 'Express Delivery',
    orderSuccess: 'Order Placed Successfully!',
    orderSuccessDesc: 'Your order has been submitted to our backend. We will contact you via Telegram to confirm the shipment.',
    contactInfoPlace: 'Contact Info (Phone / Email / Telegram)',
    fillRequired: 'Please fill out all the fields in the form.',
    orderPlacedSuccess: 'Order Placed Successfully!',
    orderThankYou: 'Thank you for shopping with us. Your order has been securely recorded.',
    orderIdLabel: 'Order ID',
    customerLabel: 'Customer',
    deliveryAddressLabel: 'Delivery Address',
    totalChargedLabel: 'Total Charged',
    immediateNotify: 'Seller has been immediately notified via Telegram Bot!',
    notifyFailed: 'Order saved, but seller notification failed.',
    notifyFailedDesc: 'The Telegram Bot token or Admin Chat ID may not be fully configured yet. You can set them up in the Seller Portal.',
    checkSellerPortal: 'Check Seller Portal',
    deliveryContactHeader: 'Delivery & Contact Information',
    contactInfoLabel: 'Contact Info (Phone / Email / Telegram)',
    processingOrder: 'Processing Order...',
    placeOrderBtn: 'Place Order',
    basketSummary: 'Basket Summary',
    freeCourier: 'Free Courier',
    yourWishlist: 'Your Wishlist',
    emptyWishlist: 'Your wishlist is empty',
    emptyWishlistDesc: 'Tap the heart icon on any product to save it here for later!',
    lowStock: 'Low Stock'
  },
  am: {
    browse: 'ፈልግ',
    cart: 'ቅርጫት',
    wishlist: 'የወደድኳቸው',
    sellerPortal: 'የሻጭ ፖርታል',
    searchPlaceholder: 'ምርቶችን ይፈልጉ...',
    sortBy: 'ደርድር በ',
    sortDefault: 'ነባሪ',
    sortPriceLowHigh: 'ዋጋ፡ ከዝቅተኛ ወደ ከፍተኛ',
    sortPriceHighLow: 'ዋጋ፡ ከከፍተኛ ወደ ዝቅተኛ',
    sortDiscount: 'ቅናሽ',
    noProductsFound: 'ለፍለጋዎ የሚስማማ ምርት አልተገኘም',
    clearSearch: 'ፍለጋውን ሰርዝ',
    emptyCatalog: 'ካታሎግዎ በአሁኑ ጊዜ ባዶ ነው',
    emptyCatalogDesc: 'ይህን ሱቅ ወዲያውኑ ለመሙላት የቦት ምስክርነቶችዎን ለማዋቀር ወይም የሰርጥ ልጥፎችን ለመምሰል ወደ ሻጭ ፖርታል ይሂዱ!',
    configureSellerPortal: 'የሻጭ ፖርታልን ያዋቅሩ',
    syncCatalog: 'የቴሌግራም ካታሎግን በማመሳሰል ላይ...',
    sale: 'ቅናሽ',
    soldOut: 'ተሽጦ ያለቀ',
    addToCart: 'ወደ ቅርጫት ጨምር',
    addedToCart: 'ቅርጫት ውስጥ ተጨምሯል',
    quickBuy: 'ፈጣን ግዢ',
    cannotQuickBuy: 'ፈጣን ግዢ አይቻልም',
    contactSeller: 'ሻጩን በቴሌግራም ያግኙ',
    share: 'አጋራ',
    sharedSuccess: 'ምርቱ በተሳካ ሁኔታ ተጋርቷል!',
    copiedToClipboard: 'ሊንኩ ኮፒ ተደርጓል!',
    copied: 'ኮፒ ተደርጓል',
    copyFailed: 'ሊንኩን ኮፒ ማድረግ አልተቻለም።',
    backToCatalog: 'ወደ ካታሎግ ተመለስ',
    reviews: 'አስተያየቶች',
    writeReview: 'አስተያየት ይጻፉ',
    noReviews: 'ምንም አስተያየቶች አልተሰጡም። የመጀመሪያው ይሁኑ!',
    addReview: 'አስተያየት ጨምር',
    rating: 'ደረጃ',
    name: 'ስምዎ',
    comment: 'አስተያየትዎ',
    submit: 'አስተያየት አስገባ',
    category: 'ምድብ',
    telegramPostId: 'የቴሌግራም ልጥፍ መለያ ቁጥር',
    inStock: 'ክምችት አለ',
    viewDetails: 'ዝርዝር ይመልከቱ',
    verifiedTelegramPost: 'የተረጋገጠ የቴሌግራም ልጥፍ',
    clickToZoom: 'ለማስፋት እና ለማጉላት ይጫኑ',
    description: 'መግለጫ',
    messageSeller: 'ሻጩን በቴሌግራም ያግኙ',
    addedToCartExcl: 'ቅርጫት ውስጥ ተጨምሯል!',
    addtoShoppingCart: 'ወደ መገበያያ ቅርጫት ጨምር',
    syncedFrom: 'የተመሳሰለው ከ',
    startBrowsing: 'መፈለግ ጀምር',
    continueShopping: 'ግዢ ለመቀጠል',
    cartReviewDesc: 'ለመግዛት የፈለጉትን ምርቶች እዚህ ያረጋግጡ',
    clearAll: 'ሁሉንም አጽዳ',
    orderSummary: 'የትዕዛዝ ማጠቃለያ',
    subtotal: 'ንዑስ ድምር',
    shipping: 'ማድረሻ',
    freeDelivery: 'ነጻ ማድረሻ',
    totalPrice: 'ጠቅላላ ዋጋ',
    each: 'በነጠላ',
    yourCart: 'የእርስዎ ቅርጫት',
    emptyCart: 'ቅርጫትዎ ባዶ ነው',
    emptyCartDesc: 'ለመጀመር አንዳንድ ምርቶችን ከካታሎግ ገጽ ላይ ይጨምሩ!',
    total: 'ጠቅላላ',
    quantity: 'ብዛት',
    proceedToCheckout: 'ለመግዛት ይቀጥሉ',
    remove: 'አስወግድ',
    checkout: 'ክፍያ',
    customerInfo: 'የደንበኛ መረጃ',
    fullName: 'ሙሉ ስም',
    telegramUsername: 'የቴሌግራም ተጠቃሚ ስም',
    phoneNumber: 'ስልክ ቁጥር',
    shippingMethod: 'የማረከቢያ መንገድ',
    deliveryAddress: 'የማረከቢያ አድራሻ',
    paymentMethod: 'የክፍያ አማራጭ',
    confirmOrder: 'ትዕዛዝ አረጋግጥ',
    orderNotes: 'ተጨማሪ ማሳሰቢያ (አማራጭ)',
    submitting: 'ትዕዛዝ በመላክ ላይ...',
    cashOnDelivery: 'ሲረከቡ የሚከፈል (COD)',
    bankTransfer: 'በባንክ ማስተላለፍ / በቴሌብር',
    crypto: 'በክሪፕቶ መክፈያ',
    localPickup: 'በራስ መውሰድ (ነጻ)',
    standardDelivery: 'መደበኛ ማድረሻ',
    expressDelivery: 'ፈጣን ማድረሻ',
    orderSuccess: 'ትዕዛዝዎ በተሳካ ሁኔታ ተልኳል!',
    orderSuccessDesc: 'ትዕዛዝዎ በተሳካ ሁኔታ ደርሶናል። ትዕዛዙን ለማረጋገጥ በቴሌግራም እናገኝዎታለን።',
    contactInfoPlace: 'የመገናኛ መረጃ (ስልክ / ኢሜይል / ቴሌግራም)',
    fillRequired: 'እባክዎን ሁሉንም የፎርሙን ክፍሎች ይሙሉ::',
    orderPlacedSuccess: 'ትዕዛዝዎ በተሳካ ሁኔታ ተጠናቋል!',
    orderThankYou: 'ከእኛ ጋር ስለገበዩ እናመሰግናለን:: ትዕዛዝዎ በደህንነት ተመዝግቧል::',
    orderIdLabel: 'የትዕዛዝ መለያ',
    customerLabel: 'ደንበኛ',
    deliveryAddressLabel: 'የማረከቢያ አድራሻ',
    totalChargedLabel: 'ጠቅላላ ክፍያ',
    immediateNotify: 'ሻጩ ወዲያውኑ በቴሌግራም ቦት ተነግሮታል!',
    notifyFailed: 'ትዕዛዙ ተቀምጧል ነገር ግን ለሻጩ ማሳወቂያ አልተላከም::',
    notifyFailedDesc: 'የቴሌግራም ቦት ቶከን ወይም የአስተዳዳሪ ቻት መለያ ሙሉ በሙሉ አልተዋቀረም ይሆናል:: በሻጭ ፖርታል ላይ ማዋቀር ይችላሉ::',
    checkSellerPortal: 'ሻጭ ፖርታልን ይመልከቱ',
    deliveryContactHeader: 'የማድረሻ እና መገናኛ መረጃ',
    contactInfoLabel: 'የመገናኛ መረጃ (ስልክ / ኢሜይል / ቴሌግራም)',
    processingOrder: 'ትዕዛዝ በመስራት ላይ...',
    placeOrderBtn: 'ትዕዛዝ ይዘዙ',
    basketSummary: 'የቅርጫት ማጠቃለያ',
    freeCourier: 'ነጻ ማድረሻ',
    yourWishlist: 'የወደድኳቸው ምርቶች',
    emptyWishlist: 'የወደድኳቸው ምርቶች ዝርዝር ባዶ ነው',
    emptyWishlistDesc: 'ምርቶችን እዚህ ለማስቀመጥ የልብ ምልክቱን ይጫኑ!',
    lowStock: 'አነስተኛ ክምችት'
  }
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('appLanguage');
    return (saved === 'am' || saved === 'en') ? (saved as Language) : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('appLanguage', lang);
  };

  const t = (key: keyof Translations): string => {
    const translation = dictionaries[language][key];
    if (translation !== undefined) {
      return translation;
    }
    // Fallback to English
    const fallback = dictionaries['en'][key];
    return fallback !== undefined ? fallback : (key as string);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};

// Language Selection Toggle Component for embedding
export const LanguageSelect: React.FC = () => {
  const { language, setLanguage } = useTranslation();

  const options: { value: Language; label: string; code: string; flag: string }[] = [
    { value: 'en', label: 'English', code: 'EN', flag: '🇺🇸' },
    { value: 'am', label: 'አማርኛ', code: 'AM', flag: '🇪🇹' }
  ];

  return (
    <div className="flex items-center bg-gray-100/80 p-1 rounded-xl border border-gray-200/50 shadow-inner" id="language-switcher">
      {options.map((opt) => {
        const isActive = language === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setLanguage(opt.value)}
            className={`px-1.5 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1 ${
              isActive
                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5 font-extrabold scale-[1.03]'
                : 'text-gray-500 hover:text-gray-800 hover:bg-white/30'
            }`}
            title={opt.label}
          >
            <span className="text-sm sm:text-base leading-none">{opt.flag}</span>
            <span className="hidden sm:inline text-[10px] uppercase tracking-wider font-bold">{opt.code}</span>
          </button>
        );
      })}
    </div>
  );
};
