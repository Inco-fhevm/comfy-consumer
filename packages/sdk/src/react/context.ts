"use client";
import { createContext } from "react";
import type { ComfyClient } from "../core/client";
import type { TokenConfig } from "../core/types";

export const ComfyReactContext = createContext<ComfyClient | null>(null);

// Dev-configured token list shared with the widgets.
export const ComfyTokensContext = createContext<TokenConfig[]>([]);
