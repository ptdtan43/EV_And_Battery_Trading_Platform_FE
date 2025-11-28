import { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ToastContext = createContext(null);

// Toast Item Component with progress bar and pause on hover
const ToastItem = ({ toast, onRemove }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(toast.duration);

  useEffect(() => {
    if (toast.duration <= 0) return; // No auto-dismiss

    let animationFrame;
    let lastTime = Date.now();

    const animate = () => {
      if (!isPaused) {
        const now = Date.now();
        const elapsed = now - lastTime;
        remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
        
        const progressPercent = (remainingTimeRef.current / toast.duration) * 100;
        setProgress(progressPercent);

        if (remainingTimeRef.current <= 0) {
          onRemove(toast.id);
          return;
        }
        
        lastTime = now;
      }
      
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [toast.id, toast.duration, isPaused, onRemove]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={
        `pointer-events-auto rounded-lg shadow-lg border bg-white animate-in fade-in slide-in-from-top-2 overflow-hidden transition-all duration-200 hover:shadow-xl ` +
        (toast.type === 'success' ? 'border-green-200' : toast.type === 'error' ? 'border-red-200' : 'border-gray-200')
      }
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className={
            'h-2 w-2 rounded-full mt-2 mr-3 ' +
            (toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-gray-400')
          } />
          <div className="flex-1">
            {toast.title && <div className="text-sm font-semibold text-gray-900">{toast.title}</div>}
            {toast.description && <div className="text-sm text-gray-600 mt-0.5">{toast.description}</div>}
          </div>
          <button 
            onClick={() => onRemove(toast.id)} 
            className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
      
      {/* Progress bar - only show if auto-dismiss is enabled */}
      {toast.duration > 0 && (
        <div className="h-1 bg-gray-100">
          <div
            className={
              'h-full transition-all duration-100 ' +
              (toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-gray-400')
            }
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

let idCounter = 0;
const genId = () => `${Date.now()}_${++idCounter}`;

export const ToastProvider = ({ children }) => {
  const location = useLocation();
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  // Check if we're on admin page - don't show toasts there
  const isAdminPage = location.pathname.startsWith('/admin');

  // Clear all toasts when entering admin page
  useEffect(() => {
    if (isAdminPage) {
      // Clear all existing toasts
      setToasts([]);
      // Clear all timers
      timers.current.forEach((tm) => clearTimeout(tm));
      timers.current.clear();
    }
  }, [isAdminPage]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const tm = timers.current.get(id);
    if (tm) {
      clearTimeout(tm);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback((opts) => {
    // Don't show toast if on admin page
    if (location.pathname.startsWith('/admin')) {
      return null;
    }
    
    const toast = {
      id: genId(),
      title: opts.title || '',
      description: opts.description || '',
      type: opts.type || 'success',
      // Default: auto-dismiss after 3 seconds (3000ms)
      // Set duration=0 to disable auto-dismiss
      duration: typeof opts.duration === 'number' ? opts.duration : 3000,
    };
    setToasts((prev) => [...prev, toast]);
    if (toast.duration > 0) {
      const tm = setTimeout(() => remove(toast.id), toast.duration);
      timers.current.set(toast.id, tm);
    }
    return toast.id;
  }, [remove, location.pathname]);

  const value = useMemo(() => ({ show, remove }), [show, remove]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Don't render toast container on admin pages */}
      {!isAdminPage && (
        <div className="fixed top-4 right-4 z-[1000] space-y-3 w-80 max-w-[90vw]">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onRemove={remove} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
