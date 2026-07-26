"use client";
import { useContext } from "react";
import { ComfyTokensContext } from "../context";
import type { TokenConfig } from "../../core/types";

export function useTokens(): TokenConfig[] {
  return useContext(ComfyTokensContext);
}
