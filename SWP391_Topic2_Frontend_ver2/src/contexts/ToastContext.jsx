import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

let idCounter = 0;
const genId = () => `${Date.now()}_${++idCounter}`;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const tm = timers.current.get(id);
    if (tm) {
      clearTimeout(tm);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback((opts) => {
    const toast = {
      id: genId(),
      title: opts.title || '',
      description: opts.description || '',
      type: opts.type || 'success',
      duration: typeof opts.duration === 'number' ? opts.duration : 3000,
    };
    setToasts((prev) => [...prev, toast]);
    const tm = setTimeout(() => remove(toast.id), toast.duration);
    timers.current.set(toast.id, tm);
    return toast.id;
  }, [remove]);

  const value = useMemo(() => ({ show, remove }), [show, remove]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[1000] space-y-3 w-80 max-w-[90vw]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              `pointer-events-auto rounded-lg shadow-lg border p-4 bg-white animate-in fade-in slide-in-from-top-2 ` +
              (t.type === 'success' ? 'border-green-200' : t.type === 'error' ? 'border-red-200' : 'border-gray-200')
            }
          >
            <div className="flex items-start">
              <div className={
                'h-2 w-2 rounded-full mt-2 mr-3 ' +
                (t.type === 'success' ? 'bg-green-500' : t.type === 'error' ? 'bg-red-500' : 'bg-gray-400')
              } />
              <div className="flex-1">
                {t.title && <div className="text-sm font-semibold text-gray-900">{t.title}</div>}
                {t.description && <div className="text-sm text-gray-600 mt-0.5">{t.description}</div>}
              </div>
              <button onClick={() => remove(t.id)} className="ml-3 text-gray-400 hover:text-gray-600">✕</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
