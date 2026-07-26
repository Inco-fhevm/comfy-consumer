"use client";
import { motion } from "motion/react";
import { SuccessCheck } from "../motion/success-check";
import { ExternalLinkIcon } from "./icons";

export interface SuccessResultProps {
  label: string;
  hash?: string;
  explorerUrl?: string;
  onDone: () => void;
}

export function SuccessResult({ label, hash, explorerUrl, onDone }: SuccessResultProps) {
  const link = hash && explorerUrl ? `${explorerUrl}/tx/${hash}` : null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="comfy-result">
      <SuccessCheck />
      <div>
        <p style={{ fontWeight: 600 }}>{label}</p>
        {link && (
          <a className="comfy-link" href={link} target="_blank" rel="noopener noreferrer">
            View transaction <ExternalLinkIcon />
          </a>
        )}
      </div>
      <button
        className="comfy-btn comfy-btn-secondary"
        style={{ width: "auto", height: "2.5rem" }}
        onClick={onDone}
      >
        Done
      </button>
    </motion.div>
  );
}
