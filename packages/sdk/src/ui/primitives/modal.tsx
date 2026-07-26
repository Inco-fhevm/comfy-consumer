"use client";
import { useEffect, type ReactNode } from "react";
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
  children: ReactNode;
}

// Portal dialog — overlay + escape + scroll-lock. Scoped under `.comfy`.
export function Modal({ open, onClose, title, onBack, footer, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="comfy comfy-overlay"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="comfy-modal"
            role="dialog"
            aria-modal="true"
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
                  <span className="comfy-modal-title">{title}</span>
                </div>
                <button className="comfy-icon-btn" onClick={onClose} aria-label="Close">
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
