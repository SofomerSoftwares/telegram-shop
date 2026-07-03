import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'info', title?: string, duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, message, type, title, duration };
      
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string, duration?: number) => toast(message, 'success', title, duration),
    [toast]
  );

  const error = useCallback(
    (message: string, title?: string, duration?: number) => toast(message, 'error', title, duration),
    [toast]
  );

  const info = useCallback(
    (message: string, title?: string, duration?: number) => toast(message, 'info', title, duration),
    [toast]
  );

  const warning = useCallback(
    (message: string, title?: string, duration?: number) => toast(message, 'warning', title, duration),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0"
      id="toast-container"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const { type, message, title } = toast;

  // Icon and theme config based on ToastType
  const config = {
    success: {
      bg: 'bg-emerald-50 border-emerald-100',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
      titleColor: 'text-emerald-800',
      msgColor: 'text-emerald-700/90',
      progressBar: 'bg-emerald-500',
      defaultTitle: 'Success',
    },
    error: {
      bg: 'bg-rose-50 border-rose-100',
      icon: <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
      titleColor: 'text-rose-800',
      msgColor: 'text-rose-700/90',
      progressBar: 'bg-rose-500',
      defaultTitle: 'Error',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-100',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
      titleColor: 'text-amber-800',
      msgColor: 'text-amber-700/90',
      progressBar: 'bg-amber-500',
      defaultTitle: 'Warning',
    },
    info: {
      bg: 'bg-indigo-50 border-indigo-100',
      icon: <Info className="w-5 h-5 text-indigo-600 flex-shrink-0" />,
      titleColor: 'text-indigo-800',
      msgColor: 'text-indigo-700/90',
      progressBar: 'bg-indigo-500',
      defaultTitle: 'Information',
    },
  }[type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`pointer-events-auto flex w-full overflow-hidden rounded-2xl border ${config.bg} p-4 shadow-lg shadow-gray-100/40 backdrop-blur-sm relative`}
      role="alert"
      id={`toast-${toast.id}`}
    >
      <div className="flex gap-3 items-start w-full pr-6">
        <div className="mt-0.5">{config.icon}</div>
        <div className="flex-grow flex flex-col">
          <span className={`font-sans font-bold text-sm leading-tight ${config.titleColor}`}>
            {title || config.defaultTitle}
          </span>
          <span className={`font-sans text-xs mt-1 leading-relaxed ${config.msgColor}`}>
            {message}
          </span>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors cursor-pointer"
        aria-label="Close notification"
        id={`toast-close-${toast.id}`}
      >
        <X className="w-4 h-4" />
      </button>

      {/* Premium subtle visual loading bar */}
      {toast.duration && toast.duration > 0 && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
          className={`absolute bottom-0 left-0 h-1 ${config.progressBar}`}
        />
      )}
    </motion.div>
  );
};
