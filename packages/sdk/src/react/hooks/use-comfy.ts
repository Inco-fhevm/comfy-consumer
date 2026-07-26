"use client";
import { useContext } from "react";
import { ComfyReactContext } from "../context";
import type { ComfyClient } from "../../core/client";

export function useComfy(): ComfyClient {
  const client = useContext(ComfyReactContext);
  if (!client) throw new Error("useComfy must be used within <ComfyProvider>.");
  return client;
}
