"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { CloseIcon, BackIcon } from "./icons";
import { SPRING } from "../motion/springs";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  onBack?: () => void;
  footer?: ReactNode;
  // Blocks escape / overlay dismissal while a transaction is in flight.
  dismissDisabled?: boolean;
  children: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Portal dialog — overlay, escape, scroll-lock, focus trap. Scoped under `.comfy`.
export function Modal({
  open,
  onClose,
  title,
  onBack,
  footer,
  dismissDisabled,
  children,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;

    // Remember what opened us so focus can go home.
    restoreRef.current = document.activeElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    panel?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!dismissDisabled) onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      // Trap: cycle within the dialog.
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      );
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault();
        last.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      (restoreRef.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose, dismissDisabled]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="comfy comfy-overlay"
          onClick={() => !dismissDisabled && onClose()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            ref={panelRef}
            className="comfy-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(2px)" }}
            transition={SPRING}
          >
            {title && (
              <div className="comfy-modal-header">
                <div className="comfy-row">
                  {onBack && (
                    <button className="comfy-icon-btn" onClick={onBack} aria-label="Back">
                      <BackIcon size={16} />
                    </button>
                  )}
                  <span className="comfy-modal-title" id={titleId}>
                    {title}
                  </span>
                </div>
                <button
                  className="comfy-icon-btn"
                  onClick={onClose}
                  disabled={dismissDisabled}
                  aria-label="Close"
                >
                  <CloseIcon />
                </button>
              </div>
            )}
            <div className="comfy-modal-body">{children}</div>
            {footer && <div className="comfy-modal-footer">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
