import React, { useState, useEffect } from 'react';
import { 
  Lock, KeyRound, LayoutDashboard, Settings, Layers, ShoppingBag, 
  Terminal, Bot, RefreshCw, Trash2, Plus, LogOut, CheckCircle, 
  AlertCircle, Send, PlusCircle, ExternalLink, Image, List, ShieldCheck,
  BarChart3, TrendingUp, DollarSign, Calendar, Percent, Activity
} from 'lucide-react';
import { Product, Order, TelegramSettings } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './Toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AdminPanelProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onProductUpdated?: () => void;
}

export default function AdminPanel({ currentView, onViewChange, onProductUpdated }: AdminPanelProps) {
  const toast = useToast();
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [postingId, setPostingId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Registration portal states
  const [username, setUsername] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerSuccessMessage, setRegisterSuccessMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'orders' | 'settings' | 'simulator'>('analytics');

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<TelegramSettings>({ botToken: '', channelId: '', chatId: '' });
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState({ type: '', text: '' });
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);

  // Telegram bot connection status state
  const [telegramStatus, setTelegramStatus] = useState<{
    connected: boolean;
    botUsername?: string;
    botFirstName?: string;
    channelId?: string;
    channelStatus?: 'connected' | 'not_found_or_no_access' | 'fetch_failed' | 'not_configured' | null;
    channelTitle?: string;
    reason?: string;
  } | null>(null);
  const [checkingTelegramStatus, setCheckingTelegramStatus] = useState(false);

  // Simulator state
  const [simText, setSimText] = useState('');
  const [simImageUrl, setSimImageUrl] = useState('');
  const [simChannel, setSimChannel] = useState('@my_tech_channel');
  const [simulating, setSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState({ type: '', text: '' });

  // Load backend data if logged in
  useEffect(() => {
    if (token) {
      fetchProducts();
      fetchOrders();
      fetchSettings();
      fetchWebhookLogs();
      if (activeTab === 'settings') {
        checkBotConnectionStatus();
      }
    }
  }, [token, activeTab]);

  const checkBotConnectionStatus = async () => {
    if (!token) return;
    setCheckingTelegramStatus(true);
    try {
      const response = await fetch('/api/admin/telegram-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTelegramStatus(data);
      } else {
        setTelegramStatus({ connected: false, reason: 'Failed to retrieve connection status' });
      }
    } catch (err: any) {
      console.error('Failed to verify Telegram connection status', err);
      setTelegramStatus({ connected: false, reason: err.message || 'Network error occurred' });
    } finally {
      setCheckingTelegramStatus(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setRegisterSuccessMessage('');
    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('adminToken', data.token);
      setToken(data.token);
      onViewChange('admin-dashboard');
      toast.success(`Welcome back, ${data.username || 'Admin'}!`, 'Logged In');
    } catch (err: any) {
      setLoginError(err.message || 'Invalid credentials');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setRegisterSuccessMessage('');

    if (password !== confirmPassword) {
      setLoginError('Passwords do not match');
      return;
    }

    setIsRegistering(true);

    try {
      const response = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setRegisterSuccessMessage(data.message || 'Registration successful! You can now log in.');
      toast.success('Admin registered successfully!', 'Registration Complete');
      // Switch back to login, clear password fields but keep username
      setPassword('');
      setConfirmPassword('');
      setIsRegisterMode(false);
    } catch (err: any) {
      setLoginError(err.message || 'Registration error');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken('');
    onViewChange('products');
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to load products');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await fetch('/api/admin/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('Failed to load orders');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Failed to fetch orders', err);
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const response = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSettings({
        botToken: data.botToken || '',
        channelId: data.channelId || '',
        chatId: data.chatId || ''
      });
      setWebhookUrl(data.webhookUrl || '');
    } catch (err) {
      console.error('Failed to fetch settings', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchWebhookLogs = async () => {
    try {
      const response = await fetch('/api/admin/webhook-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('Failed to load logs');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setWebhookLogs(data);
      } else {
        setWebhookLogs([]);
      }
    } catch (err) {
      console.error('Failed to fetch logs', err);
      setWebhookLogs([]);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...settings,
          webhookUrl
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      if (data.webhookStatus === 'webhook_registered') {
        setSettingsMessage({ 
          type: 'success', 
          text: 'Settings saved and Webhook successfully registered with Telegram!' 
        });
      } else if (data.webhookStatus && data.webhookStatus.startsWith('webhook_error')) {
        setSettingsMessage({ 
          type: 'warning', 
          text: `Settings saved locally. Webhook registration alert: ${data.webhookStatus}` 
        });
      } else {
        setSettingsMessage({ 
          type: 'success', 
          text: 'Settings saved successfully.' 
        });
      }
      fetchWebhookLogs();
      checkBotConnectionStatus();
    } catch (err: any) {
      setSettingsMessage({ type: 'error', text: err.message || 'Error saving settings' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteProductClick = (product: Product) => {
    setProductToDelete(product);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setProducts(products.filter(p => p.id !== productToDelete.id));
        toast.success(`Successfully deleted "${productToDelete.title}" from the catalog.`, 'Product Deleted');
        if (onProductUpdated) onProductUpdated();
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete product.');
      }
    } catch (err: any) {
      console.error('Failed to delete product', err);
      toast.error(err.message || 'An error occurred while deleting the product.', 'Delete Failed');
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  const handlePostToTelegram = async (id: string) => {
    setPostingId(id);
    try {
      const response = await fetch(`/api/admin/products/${id}/post-telegram`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to post product to Telegram');
      }

      toast.success('Successfully posted this product to your Telegram channel!', 'Posted to Telegram');
      fetchProducts();
      fetchWebhookLogs();
      if (onProductUpdated) onProductUpdated();
    } catch (err: any) {
      toast.error(err.message || 'Failed to post to Telegram', 'Post Failed');
    } finally {
      setPostingId(null);
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: 'completed' | 'cancelled') => {
    try {
      const response = await fetch(`/api/admin/orders/${id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order status');
      }

      toast.success(`Successfully updated order status to ${status}.`, 'Order Updated');
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order status', 'Update Failed');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.title) return;

    setIsSavingProduct(true);
    try {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingProduct)
      });

      if (response.ok) {
        setEditingProduct(null);
        fetchProducts();
        if (onProductUpdated) onProductUpdated();
      }
    } catch (err) {
      console.error('Error saving product', err);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simText.trim()) {
      setSimMessage({ type: 'error', text: 'Please enter channel post text to simulate.' });
      return;
    }

    setSimulating(true);
    setSimMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/admin/simulate-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: simText,
          imageUrl: simImageUrl,
          channelName: simChannel
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Simulation failed');
      }

      setSimMessage({
        type: 'success',
        text: `Success! Synced simulated product: "${data.parsedProduct.title}" (Price: $${data.parsedProduct.price})`
      });
      fetchProducts();
      fetchWebhookLogs();
      if (onProductUpdated) onProductUpdated();
    } catch (err: any) {
      setSimMessage({ type: 'error', text: err.message || 'Simulation error' });
    } finally {
      setSimulating(false);
    }
  };

  const loadSamplePost = () => {
    setSimChannel('@retro_gadgets_shop');
    setSimImageUrl('https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80');
    setSimText(`
🔥 Retro IBM Model M Keyboard 🔥
Price: $189.99

Rare 1987 vintage keyboard in pristine mechanical condition. Includes the original coiled PS/2 cable. Unbelievable tactile bucking-spring feedback!

💬 Contact support: @retro_tech_guy
🎁 Order link: https://t.me/retro_tech_guy
    `.trim());
  };

  // Calculations for last 7 days analytics
  const last7DaysData = React.useMemo(() => {
    const data = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // e.g. "Jul 3"
      
      const dayOrders = orders.filter((o) => {
        if (!o.createdAt) return false;
        return o.createdAt.split('T')[0] === dateStr;
      });
      
      const revenue = dayOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
      const salesCount = dayOrders.length;
      
      data.push({
        dateStr,
        name: dayLabel,
        revenue: Number(revenue.toFixed(2)),
        sales: salesCount,
      });
    }
    return data;
  }, [orders]);

  const stats = React.useMemo(() => {
    const last7DaysRevenue = last7DaysData.reduce((sum, d) => sum + d.revenue, 0);
    const last7DaysOrders = last7DaysData.reduce((sum, d) => sum + d.sales, 0);
    const last7DaysAOV = last7DaysOrders > 0 ? last7DaysRevenue / last7DaysOrders : 0;
    
    const allTimeRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const allTimeOrders = orders.length;
    const allTimeAOV = allTimeOrders > 0 ? allTimeRevenue / allTimeOrders : 0;

    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;

    const bestDay = [...last7DaysData].sort((a, b) => b.revenue - a.revenue)[0];

    return {
      last7DaysRevenue,
      last7DaysOrders,
      last7DaysAOV,
      allTimeRevenue,
      allTimeOrders,
      allTimeAOV,
      completedOrders,
      pendingOrders,
      bestDayName: bestDay && bestDay.revenue > 0 ? bestDay.name : 'N/A',
      bestDayRevenue: bestDay ? bestDay.revenue : 0,
    };
  }, [last7DaysData, orders]);

  // ==================== RENDERING LOGIN/REGISTRATION PAGE ====================
  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-16" id="admin-login-view">
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <KeyRound className="w-8 h-8" />
          </div>

          <h1 className="font-display font-bold text-2xl text-gray-900 text-center">
            {isRegisterMode ? 'Create Seller Account' : 'Seller Portal Login'}
          </h1>
          <p className="text-gray-500 mt-2 text-sm text-center">
            {isRegisterMode 
              ? 'Register a personalized administrator account to manage your store.' 
              : 'Authenticate to manage products, settings, and view customer orders.'}
          </p>

          {/* Registration / Login Mode Switcher Tabs */}
          <div className="mt-6 flex bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setLoginError('');
                setRegisterSuccessMessage('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                !isRegisterMode 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setLoginError('');
                setRegisterSuccessMessage('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                isRegisterMode 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Register Portal
            </button>
          </div>

          {/* Developers Tip (Only shown in Sign In mode) */}
          {!isRegisterMode && (
            <div className="mt-5 p-3.5 bg-indigo-50 text-indigo-800 rounded-2xl border border-indigo-100 text-xs flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-semibold">Developer Access Tip:</span>
                <p className="mt-0.5 text-indigo-700 font-medium">Use the password <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-mono font-bold text-xs text-indigo-900">admin123</code> (and leave Username blank) to enter immediately.</p>
              </div>
            </div>
          )}

          {loginError && (
            <div className="mt-5 p-3.5 bg-red-50 text-red-700 rounded-xl border border-red-100 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 animate-pulse" />
              <span>{loginError}</span>
            </div>
          )}

          {registerSuccessMessage && (
            <div className="mt-5 p-3.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-xs flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{registerSuccessMessage}</span>
            </div>
          )}

          <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="mt-6 space-y-4">
            <div>
              <label htmlFor="adminUsername" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Username {!isRegisterMode && <span className="text-gray-400 font-normal">(Optional)</span>}
              </label>
              <input
                type="text"
                id="adminUsername"
                placeholder={isRegisterMode ? "e.g. store_manager" : "Enter username (or leave blank)"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                disabled={isLoggingIn || isRegistering}
                required={isRegisterMode}
              />
            </div>

            <div>
              <label htmlFor="adminPassword" className="block text-sm font-semibold text-gray-700 mb-1.5">
                {isRegisterMode ? 'Choose Password' : 'Portal Security Key / Password'}
              </label>
              <input
                type="password"
                id="adminPassword"
                placeholder={isRegisterMode ? "Min. 6 characters" : "Enter password..."}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                disabled={isLoggingIn || isRegistering}
                required
              />
            </div>

            {isRegisterMode && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  disabled={isRegistering}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn || isRegistering}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center justify-center space-x-2 cursor-pointer text-sm"
              id="admin-auth-submit"
            >
              {isLoggingIn || isRegistering ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{isRegisterMode ? 'Register & Create Account' : 'Enter Portal'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==================== RENDERING ADMIN DASHBOARD ====================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="admin-dashboard-view">
      {/* Dashboard Topbar */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-gray-100 pb-6 mb-8 gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-gray-900 tracking-tight flex items-center space-x-2.5">
            <LayoutDashboard className="w-8 h-8 text-indigo-600" />
            <span>Seller & Bot Workspace</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Configure bot triggers, synchronize posts, and track orders</p>
        </div>
        
        <button
          onClick={handleLogout}
          className="inline-flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-red-600 hover:text-red-700 border border-red-100 bg-red-50/50 hover:bg-red-50 rounded-xl transition-colors cursor-pointer w-fit"
          id="admin-logout-button"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Workspace</span>
        </button>
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar Menu */}
        <div className="lg:col-span-3 flex flex-col space-y-2">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-4.5 h-4.5" />
            <span>Analytics Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'products'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Layers className="w-4.5 h-4.5" />
            <span>Products List ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'orders'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <ShoppingBag className="w-4.5 h-4.5" />
            <span>Orders List ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-4.5 h-4.5" />
            <span>Telegram Bot Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center space-x-2.5 px-4 py-3 rounded-xl text-sm font-semibold border transition-all ${
              activeTab === 'simulator'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'border-transparent text-amber-600 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            <Terminal className="w-4.5 h-4.5" />
            <span>Telegram Channel Simulator</span>
          </button>
        </div>

        {/* Right Tab Content Stage */}
        <div className="lg:col-span-9 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm">
          
          {/* TAB 0: ANALYTICS DASHBOARD */}
          {activeTab === 'analytics' && (
            <div id="tab-analytics" className="animate-fade-in space-y-8">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-50 pb-4 gap-4">
                <div>
                  <h2 className="font-display font-bold text-xl text-gray-900">Analytics Dashboard</h2>
                  <p className="text-xs text-gray-400 mt-1">Key metrics and visualizations of sales performance over the past week</p>
                </div>
                <button
                  onClick={fetchOrders}
                  disabled={loadingOrders}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                  <span>Sync Metrics</span>
                </button>
              </div>

              {loadingOrders ? (
                <div className="py-20 text-center text-gray-400">
                  <div className="w-8 h-8 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm">Recalculating sales and revenue models...</p>
                </div>
              ) : (
                <>
                  {/* KPI Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: 7d Revenue */}
                    <div className="bg-gradient-to-br from-emerald-50/50 to-emerald-100/10 border border-emerald-100 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:shadow-sm transition-all">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-4 translate-x-4 group-hover:scale-110 transition-transform" />
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">7D Revenue</span>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                          <DollarSign className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="font-display font-black text-2xl text-emerald-950">${stats.last7DaysRevenue.toFixed(2)}</h3>
                      <div className="mt-2 flex items-center space-x-1 text-xxs font-semibold text-emerald-700 bg-emerald-50 w-max px-2 py-0.5 rounded border border-emerald-100">
                        <TrendingUp className="w-3 h-3" />
                        <span>All-time: ${stats.allTimeRevenue.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Card 2: 7d Orders */}
                    <div className="bg-gradient-to-br from-indigo-50/50 to-indigo-100/10 border border-indigo-100 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:shadow-sm transition-all">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -translate-y-4 translate-x-4 group-hover:scale-110 transition-transform" />
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">7D Sales</span>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="font-display font-black text-2xl text-indigo-950">{stats.last7DaysOrders} {stats.last7DaysOrders === 1 ? 'order' : 'orders'}</h3>
                      <div className="mt-2 flex items-center space-x-1 text-xxs font-semibold text-indigo-700 bg-indigo-50 w-max px-2 py-0.5 rounded border border-indigo-100">
                        <Calendar className="w-3 h-3" />
                        <span>All-time: {stats.allTimeOrders} total</span>
                      </div>
                    </div>

                    {/* Card 3: 7d AOV */}
                    <div className="bg-gradient-to-br from-violet-50/50 to-violet-100/10 border border-violet-100 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:shadow-sm transition-all">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full -translate-y-4 translate-x-4 group-hover:scale-110 transition-transform" />
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-violet-800 uppercase tracking-wider">7D Avg Basket</span>
                        <div className="p-2 bg-violet-50 text-violet-600 rounded-xl border border-violet-100">
                          <Percent className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="font-display font-black text-2xl text-violet-950">${stats.last7DaysAOV.toFixed(2)}</h3>
                      <div className="mt-2 flex items-center space-x-1 text-xxs font-semibold text-violet-700 bg-violet-50 w-max px-2 py-0.5 rounded border border-violet-100">
                        <Activity className="w-3 h-3" />
                        <span>All-time AOV: ${stats.allTimeAOV.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Card 4: Store Power Day */}
                    <div className="bg-gradient-to-br from-amber-50/50 to-amber-100/10 border border-amber-100 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:shadow-sm transition-all">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -translate-y-4 translate-x-4 group-hover:scale-110 transition-transform" />
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">7D Best Day</span>
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="font-display font-black text-2xl text-amber-950">{stats.bestDayName}</h3>
                      <div className="mt-2 flex items-center space-x-1 text-xxs font-semibold text-amber-700 bg-amber-50 w-max px-2 py-0.5 rounded border border-emerald-100">
                        <DollarSign className="w-3 h-3" />
                        <span>Peak: ${stats.bestDayRevenue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="bg-gray-50/50 border border-gray-100 rounded-3xl p-5 sm:p-6 shadow-xxs">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-3">
                      <div>
                        <h3 className="font-sans font-bold text-gray-800 text-sm">Weekly Sales & Revenue Trend</h3>
                        <p className="text-xxs text-gray-400 mt-0.5">Dual-axis view of performance trajectory over the last 7 days</p>
                      </div>
                      <div className="flex items-center space-x-4 text-xxs text-gray-500 font-medium">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                          <span>Revenue ($)</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                          <span>Orders Count</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-[320px]" id="revenue-sales-chart">
                      {stats.allTimeOrders === 0 ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 py-12">
                          <BarChart3 className="w-12 h-12 text-gray-300 mb-2 stroke-1" />
                          <p className="text-sm font-semibold text-gray-600">No chart data generated yet</p>
                          <p className="text-xxs text-gray-400 mt-1">Data will populate automatically once orders are completed by customers.</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={last7DaysData} margin={{ top: 10, right: 5, left: -15, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                            <XAxis 
                              dataKey="name" 
                              tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 500 }} 
                              axisLine={false} 
                              tickLine={false} 
                            />
                            <YAxis 
                              yAxisId="left" 
                              tick={{ fontSize: 10, fill: '#10b981', fontWeight: 600 }} 
                              axisLine={false} 
                              tickLine={false} 
                              tickFormatter={(value) => `$${value}`}
                            />
                            <YAxis 
                              yAxisId="right" 
                              orientation="right" 
                              tick={{ fontSize: 10, fill: '#6366f1', fontWeight: 600 }} 
                              axisLine={false} 
                              tickLine={false} 
                              allowDecimals={false}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                background: 'rgba(255, 255, 255, 0.98)', 
                                borderRadius: '14px', 
                                border: '1px solid #f3f4f6', 
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
                                fontSize: '11px'
                              }} 
                              labelStyle={{ fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}
                            />
                            <Bar yAxisId="left" dataKey="revenue" name="Revenue ($)" fill="#10b981" radius={[5, 5, 0, 0]} maxBarSize={32} />
                            <Bar yAxisId="right" dataKey="sales" name="Orders Count" fill="#6366f1" radius={[5, 5, 0, 0]} maxBarSize={32} />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Daily Breakdowns Table */}
                  <div className="border border-gray-100 rounded-3xl overflow-hidden shadow-xxs">
                    <div className="bg-gray-50/50 px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">7D Tabular Performance</span>
                      <span className="text-xxs text-gray-400 font-semibold">Ordered Chronologically</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50/30 text-gray-500 font-bold border-b border-gray-100">
                          <tr>
                            <th className="px-6 py-3.5 font-semibold">Date</th>
                            <th className="px-6 py-3.5 font-semibold text-center">Orders Count</th>
                            <th className="px-6 py-3.5 font-semibold text-right">Revenue</th>
                            <th className="px-6 py-3.5 font-semibold text-right">Avg Order Basket</th>
                            <th className="px-6 py-3.5 font-semibold text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-medium text-gray-600">
                          {last7DaysData.map((d, index) => {
                            const avgValue = d.sales > 0 ? d.revenue / d.sales : 0;
                            return (
                              <tr key={index} className="hover:bg-gray-50/40 transition-colors">
                                <td className="px-6 py-3.5 text-gray-900 font-semibold">{d.name}</td>
                                <td className="px-6 py-3.5 text-center font-mono">{d.sales}</td>
                                <td className="px-6 py-3.5 text-right font-mono text-emerald-600 font-semibold">${d.revenue.toFixed(2)}</td>
                                <td className="px-6 py-3.5 text-right font-mono text-gray-500">${avgValue.toFixed(2)}</td>
                                <td className="px-6 py-3.5 text-center">
                                  <span className={`inline-block w-2 h-2 rounded-full ${d.sales > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 1: PRODUCTS LIST */}
          {activeTab === 'products' && (
            <div id="tab-products">
              <div className="flex justify-between items-center mb-6 border-b border-gray-50 pb-4">
                <h2 className="font-display font-bold text-xl text-gray-900">Manage Catalog</h2>
                <button
                  onClick={() => setEditingProduct({ title: '', price: 0, description: '', images: [''], contactLink: '', category: '' })}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center space-x-1 shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Manual Add</span>
                </button>
              </div>

              {loadingProducts ? (
                <div className="py-12 text-center text-gray-400">
                  <div className="w-8 h-8 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm">Loading catalogue...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="py-16 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="font-sans font-semibold text-gray-700 text-sm">No products in catalogue yet</h3>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1 leading-relaxed">
                    Connect your Telegram Channel in settings to automatically sync posts, or use the Simulator to mock channel entries!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {products.map((p) => (
                    <div key={p.id} className="border border-gray-100 rounded-2xl overflow-hidden shadow-xs hover:shadow-sm transition-all flex flex-col">
                      <div className="aspect-square relative bg-gray-50">
                        <img 
                          src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'} 
                          alt="" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                        {p.telegramPostId && (
                          <span className="absolute bottom-2 right-2 bg-black/60 text-white font-mono text-[9px] px-1.5 py-0.5 rounded">
                            Post ID: {p.telegramPostId}
                          </span>
                        )}
                        {p.telegramChannel && (
                          <span className="absolute top-2 left-2 bg-indigo-600 text-white font-mono text-[9px] px-2 py-0.5 rounded-full">
                            {p.telegramChannel}
                          </span>
                        )}
                      </div>
                      <div className="p-4 flex-grow flex flex-col justify-between">
                        <div>
                          <h4 className="font-sans font-bold text-gray-900 text-sm line-clamp-1">{p.title}</h4>
                          <span className="text-xs text-indigo-600 font-extrabold font-display block mt-1">${Number(p.price).toFixed(2)}</span>
                          <p className="text-gray-500 text-xs line-clamp-2 mt-1.5 leading-relaxed">{p.description}</p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-50 flex space-x-2">
                          <button
                            onClick={() => handlePostToTelegram(p.id)}
                            disabled={postingId === p.id}
                            className="bg-indigo-50 hover:bg-indigo-100 disabled:bg-gray-100 text-indigo-600 hover:text-indigo-700 disabled:text-gray-400 p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                            title={p.telegramPostId ? "Repost to Telegram Channel" : "Post to Telegram Channel"}
                          >
                            <Send className={`w-4 h-4 ${postingId === p.id ? 'animate-pulse' : ''}`} />
                          </button>
                          <button
                            onClick={() => setEditingProduct(p)}
                            className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProductClick(p)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ORDERS LIST */}
          {activeTab === 'orders' && (
            <div id="tab-orders">
              <h2 className="font-display font-bold text-xl text-gray-900 mb-6 border-b border-gray-50 pb-4">Customer Orders</h2>

              {loadingOrders ? (
                <div className="py-12 text-center text-gray-400">
                  <div className="w-8 h-8 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm">Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-16 text-center text-gray-400 border border-dashed border-gray-200 rounded-2xl">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="font-sans font-semibold text-gray-700 text-sm">No orders recorded yet</h3>
                  <p className="text-xs text-gray-400 mt-1">Orders placed by customers will be displayed here securely.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((o) => (
                    <div key={o.id} className="border border-gray-100 rounded-2xl p-5 shadow-sm bg-gray-50/30">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-200/50 pb-3 mb-4 gap-2">
                        <div>
                          <span className="font-mono text-xs text-indigo-600 font-semibold uppercase">Order #{o.id.substring(0, 8)}</span>
                          <span className="text-xs text-gray-400 font-medium block mt-0.5">{new Date(o.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-display font-bold text-base text-gray-900 block">${o.totalPrice?.toFixed(2)}</span>
                          <span className={`inline-flex items-center text-xxs font-semibold px-2 py-0.5 rounded border mt-0.5 uppercase ${
                            o.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : o.status === 'cancelled'
                              ? 'bg-rose-50 text-rose-700 border-rose-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {o.status || 'pending'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
                        <div className="space-y-1">
                          <div><span className="font-bold text-gray-800">Customer Name:</span> {o.customerName}</div>
                          <div><span className="font-bold text-gray-800">Contact:</span> {o.contactInfo}</div>
                          <div><span className="font-bold text-gray-800">Address:</span> {o.deliveryAddress}</div>
                        </div>
                        <div className="bg-white border border-gray-100 p-3 rounded-xl">
                          <span className="font-bold text-gray-800 block mb-1.5 uppercase tracking-wider text-[10px]">Items Summary</span>
                          <div className="divide-y divide-gray-100 max-h-24 overflow-y-auto">
                            {o.items?.map((item: any, idx: number) => (
                              <div key={idx} className="py-1 flex justify-between">
                                <span className="line-clamp-1 text-gray-700 font-medium">{item.title} (x{item.quantity})</span>
                                <span className="font-semibold text-gray-800 flex-shrink-0 ml-2">${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {(o.status === 'pending' || !o.status) && (
                        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(o.id, 'completed')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xxs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                          >
                            Accept & Complete
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(o.id, 'cancelled')}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xxs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                          >
                            Cancel Order
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TELEGRAM BOT SETTINGS */}
          {activeTab === 'settings' && (
            <div id="tab-settings">
              <h2 className="font-display font-bold text-xl text-gray-900 mb-6 border-b border-gray-50 pb-4">Telegram Bot Credentials</h2>

              {/* TELEGRAM BOT CONNECTION STATUS */}
              <div className="mb-8 bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-xs" id="telegram-status-panel">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl ${
                      checkingTelegramStatus 
                        ? 'bg-indigo-50 text-indigo-600'
                        : telegramStatus?.connected && telegramStatus?.channelStatus === 'connected'
                        ? 'bg-emerald-50 text-emerald-600'
                        : telegramStatus?.connected
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-red-50 text-red-600'
                    }`}>
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm text-gray-900">Telegram Connection Status</h3>
                      <p className="text-xxs text-gray-500 mt-0.5">
                        {checkingTelegramStatus 
                          ? 'Analyzing API connections...' 
                          : telegramStatus?.connected 
                          ? `Connected to Telegram as @${telegramStatus.botUsername}` 
                          : 'Not connected to Telegram'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={checkBotConnectionStatus}
                    disabled={checkingTelegramStatus}
                    className="self-start sm:self-center bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold px-3.5 py-2 rounded-xl border border-gray-200 transition-colors shadow-xs cursor-pointer flex items-center space-x-1.5 disabled:opacity-55"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingTelegramStatus ? 'animate-spin' : ''}`} />
                    <span>{checkingTelegramStatus ? 'Testing...' : 'Test Connection'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 pt-5 border-t border-slate-200/60 text-xs">
                  {/* Step 1: Bot API Verification */}
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">
                      {checkingTelegramStatus ? (
                        <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                      ) : telegramStatus?.connected ? (
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-gray-800 block">Bot API Verification</span>
                      {checkingTelegramStatus ? (
                        <span className="text-xxs text-gray-400">Verifying Telegram Token...</span>
                      ) : telegramStatus?.connected ? (
                        <div className="mt-1 space-y-0.5">
                          <span className="inline-flex items-center text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                            ACTIVE
                          </span>
                          <span className="text-xxs text-gray-500 block">
                            Bot: <strong>{telegramStatus.botFirstName}</strong> (@{telegramStatus.botUsername})
                          </span>
                        </div>
                      ) : (
                        <div className="mt-1 space-y-0.5">
                          <span className="inline-flex items-center text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-md">
                            DISCONNECTED
                          </span>
                          <span className="text-xxs text-red-500 block">
                            Reason: {telegramStatus?.reason || 'Token is missing or invalid'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 2: Channel Membership */}
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">
                      {checkingTelegramStatus ? (
                        <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                      ) : telegramStatus?.channelStatus === 'connected' ? (
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                      ) : telegramStatus?.channelStatus === 'not_configured' ? (
                        <AlertCircle className="w-5 h-5 text-gray-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-gray-800 block">Channel Access Verification</span>
                      {checkingTelegramStatus ? (
                        <span className="text-xxs text-gray-400">Checking channel membership...</span>
                      ) : telegramStatus?.channelStatus === 'connected' ? (
                        <div className="mt-1 space-y-0.5">
                          <span className="inline-flex items-center text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                            AUTHORIZED
                          </span>
                          <span className="text-xxs text-gray-500 block">
                            Channel: <strong>{telegramStatus.channelTitle}</strong> ({telegramStatus.channelId})
                          </span>
                        </div>
                      ) : telegramStatus?.channelStatus === 'not_configured' ? (
                        <div className="mt-1 space-y-0.5">
                          <span className="inline-flex items-center text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                            NOT CONFIGURED
                          </span>
                          <span className="text-xxs text-gray-400 block">
                            Please configure a Listener Channel ID to track.
                          </span>
                        </div>
                      ) : (
                        <div className="mt-1 space-y-0.5">
                          <span className="inline-flex items-center text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                            ACCESS DENIED
                          </span>
                          <span className="text-xxs text-amber-600 block">
                            {telegramStatus?.channelTitle || 'Bot must be added as an Admin in the channel.'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {settingsMessage.text && (
                <div className={`mb-6 p-4 rounded-xl border flex items-start space-x-2 text-xs sm:text-sm ${
                  settingsMessage.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                    : settingsMessage.type === 'warning'
                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                    : 'bg-red-50 text-red-700 border-red-100'
                }`} id="settings-message">
                  {settingsMessage.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  )}
                  <span>{settingsMessage.text}</span>
                </div>
              )}

              {loadingSettings ? (
                <div className="py-12 text-center text-gray-400">
                  <div className="w-8 h-8 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm">Loading config...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  {/* Settings Form */}
                  <form onSubmit={handleSaveSettings} className="lg:col-span-7 space-y-6" id="settings-form">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        1. Telegram Bot Token
                      </label>
                      <input
                        type="password"
                        placeholder="1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                        value={settings.botToken}
                        onChange={(e) => setSettings({ ...settings, botToken: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                      />
                      <p className="text-xxs text-gray-400 mt-1 leading-relaxed">
                        Obtain this token from Telegram's <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">@BotFather</a>. This bot handles auto-listening to posts and sending your order notifications.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        2. Listener Channel ID
                      </label>
                      <input
                        type="text"
                        placeholder="@my_store_channel or -100xxxxxxxxxx"
                        value={settings.channelId}
                        onChange={(e) => setSettings({ ...settings, channelId: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                      />
                      <p className="text-xxs text-gray-400 mt-1 leading-relaxed">
                        The public username or numeric ID of the Telegram Channel you post products in. Ensure your Bot is added as an administrator to this channel.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        3. Order Notifications Admin Chat ID
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 987654321 or @my_admin_group"
                        value={settings.chatId}
                        onChange={(e) => setSettings({ ...settings, chatId: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                      />
                      <p className="text-xxs text-gray-400 mt-1 leading-relaxed">
                        Where order logs are sent. Can be your personal Telegram user ID (get it from <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">@userinfobot</a>) or a group ID where your bot is added.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                        4. App Webhook URL
                      </label>
                      <input
                        type="text"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://my-app.run.app/api/telegram-webhook"
                        className="w-full bg-gray-100 border border-gray-200 text-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none font-mono cursor-not-allowed"
                        disabled
                      />
                      <p className="text-xxs text-gray-400 mt-1">
                        Automatically derived endpoint that Telegram triggers whenever a channel post is made.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2 cursor-pointer text-sm"
                      id="save-settings-submit"
                    >
                      {savingSettings ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>Save Config & Set Webhook</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Webhook Activity Feed */}
                  <div className="lg:col-span-5 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <h3 className="font-sans font-bold text-gray-800 text-xs uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                      <Terminal className="w-4 h-4 text-indigo-500" />
                      <span>Webhook Log Feed</span>
                    </h3>

                    {webhookLogs.length === 0 ? (
                      <div className="py-8 text-center text-xs text-gray-400">
                        No webhook activities logged yet. Trigger some events to view active logs.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-1" id="webhook-logs-container">
                        {webhookLogs.map((log) => (
                          <div key={log.id} className="bg-white border border-gray-200/60 rounded-xl p-3 font-mono text-[10px] text-gray-600 shadow-xxs">
                            <div className="flex justify-between items-center text-xxs font-semibold mb-1 pb-1 border-b border-gray-100">
                              <span className={log.type === 'simulated_webhook' ? 'text-amber-600' : 'text-indigo-600'}>
                                {log.type === 'simulated_webhook' ? '[SIMULATED]' : '[TELEGRAM]'}
                              </span>
                              <span className="text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <pre className="max-h-24 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                              {log.payload}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TELEGRAM CHANNEL SIMULATOR */}
          {activeTab === 'simulator' && (
            <div id="tab-simulator">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 border-b border-gray-50 pb-4 gap-2">
                <div>
                  <h2 className="font-display font-bold text-xl text-gray-900 flex items-center space-x-2">
                    <Bot className="w-5 h-5 text-amber-500" />
                    <span>Instant Telegram Post Simulator</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">Mock and test parsing logic without configuring real bots</p>
                </div>
                <button
                  type="button"
                  onClick={loadSamplePost}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer w-fit"
                >
                  Load Sample Post
                </button>
              </div>

              {simMessage.text && (
                <div className={`mb-6 p-4 rounded-xl border flex items-start space-x-2 text-xs sm:text-sm ${
                  simMessage.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                    : 'bg-red-50 text-red-700 border-red-100'
                }`} id="simulator-message">
                  {simMessage.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  )}
                  <span>{simMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleSimulateWebhook} className="space-y-5" id="simulator-form">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Telegram Channel handle
                    </label>
                    <input
                      type="text"
                      placeholder="@my_premium_gadgets"
                      value={simChannel}
                      onChange={(e) => setSimChannel(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Simulated Product Image URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/keyboard.jpg"
                      value={simImageUrl}
                      onChange={(e) => setSimImageUrl(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex justify-between">
                    <span>Channel Post Message Text</span>
                    <span className="text-indigo-600 font-semibold lowercase tracking-normal">Parsed by Gemini AI!</span>
                  </label>
                  <textarea
                    rows={6}
                    placeholder="🌟 Premium Wireless Headphones 🌟&#10;Price: $149.99&#10;&#10;Incredible noise cancelling headphones with deep bass and a 30-hour battery life.&#10;&#10;Contact Support: @headphone_support"
                    value={simText}
                    onChange={(e) => setSimText(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono resize-none"
                  />
                  <p className="text-xxs text-gray-400 mt-1 leading-relaxed">
                    Write anything you like. The backend uses Google Gemini AI to analyze, identify, and extract the Product title, description, numerical price, and contact links automatically!
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={simulating}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3.5 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2 cursor-pointer text-sm"
                  id="simulator-submit"
                >
                  {simulating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Simulate Channel Post Syncing</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* MANUAL PRODUCT ADD / EDIT DIALOG */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4" id="product-editor-modal">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingProduct(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 w-full max-w-2xl relative shadow-2xl z-10 overflow-y-auto max-h-[90vh]"
            >
              <h3 className="font-display font-bold text-xl text-gray-950 mb-6">
                {editingProduct.id ? 'Modify Catalogue Entry' : 'Manual Catalogue Addition'}
              </h3>

              <form onSubmit={handleSaveProduct} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Product Title</label>
                    <input
                      type="text"
                      value={editingProduct.title || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Product Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.price || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Product Description</label>
                  <textarea
                    rows={4}
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Electronics, Retro"
                      value={editingProduct.category || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Telegram Contact link</label>
                    <input
                      type="text"
                      placeholder="e.g. https://t.me/support_user"
                      value={editingProduct.contactLink || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, contactLink: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Image URL</label>
                    <input
                      type="text"
                      placeholder="Paste image address..."
                      value={editingProduct.images?.[0] || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, images: [e.target.value] })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Stock Count</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="10"
                      value={editingProduct.stockCount !== undefined ? editingProduct.stockCount : ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stockCount: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProduct}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    {isSavingProduct ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION DIALOG */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4" id="delete-confirm-modal">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProductToDelete(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-gray-100 rounded-3xl p-6 w-full max-w-md relative shadow-2xl z-10"
            >
              <div className="flex items-center space-x-3 mb-4 text-red-600">
                <div className="p-2 bg-red-50 rounded-xl">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-gray-950">
                  Delete Catalog Item?
                </h3>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed mb-6">
                Are you absolutely sure you want to delete <strong className="text-gray-900">"{productToDelete.title}"</strong>? This action will permanently remove the item from the catalog and cannot be undone.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-xs font-semibold text-gray-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteProduct}
                  disabled={isDeleting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center space-x-1"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Delete Permanently</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
