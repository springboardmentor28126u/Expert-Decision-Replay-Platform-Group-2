import { createContext, useCallback, useContext, useRef, useState } from "react";
import { X } from "lucide-react";

const ToastContext = createContext(null);
let idCounter = 0;

// Replacement for alert(): showToast("message", { tone: "error" }) surfaces
// a dismissible, non-blocking notification instead of a blocking native
// dialog. Auto-dismisses after `duration`ms (default 4s); pass duration: 0
// to require manual dismissal.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const showToast = useCallback(
    (message, options = {}) => {
      const id = ++idCounter;
      const tone = options.tone || "info"; // success | error | info
      const duration = options.duration ?? 4000;
      setToasts((prev) => [...prev, { id, message, tone }]);
      if (duration > 0) {
        timers.current[id] = setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="ui-toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`ui-toast ui-toast-${t.tone}`} role="status">
            <span className="ui-toast-message">{t.message}</span>
            <button
              type="button"
              className="ui-toast-close"
              aria-label="Dismiss notification"
              onClick={() => dismiss(t.id)}
            >
              <X size={13} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
