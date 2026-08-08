import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Button from "./Button";

const ConfirmContext = createContext(null);

// Promise-based replacement for window.confirm(): `await confirm("...")`
// resolves to true/false exactly like the native dialog did, so existing
// `if (!window.confirm(...)) return;` call sites only need the confirm()
// call itself swapped, not their surrounding logic.
export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolverRef = useRef(null);
  const cancelBtnRef = useRef(null);

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        message,
        title: options.title || null,
        confirmLabel: options.confirmLabel || "Confirm",
        cancelLabel: options.cancelLabel || "Cancel",
        danger: options.danger ?? false,
      });
    });
  }, []);

  const close = useCallback((result) => {
    setDialog(null);
    resolverRef.current?.(result);
    resolverRef.current = null;
  }, []);

  useEffect(() => {
    if (!dialog) return;
    cancelBtnRef.current?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") close(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [dialog, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div className="ui-modal-overlay" onMouseDown={() => close(false)}>
          <div
            className="ui-modal"
            role="alertdialog"
            aria-modal="true"
            aria-label={dialog.title || "Confirm action"}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {dialog.title && <p className="ui-modal-title">{dialog.title}</p>}
            <p className="ui-modal-message">{dialog.message}</p>
            <div className="ui-modal-actions">
              <Button ref={cancelBtnRef} variant="secondary" onClick={() => close(false)}>
                {dialog.cancelLabel}
              </Button>
              <Button variant={dialog.danger ? "danger" : "primary"} onClick={() => close(true)}>
                {dialog.confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
  return ctx;
}
