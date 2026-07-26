"use client";
import { useMutation } from "@tanstack/react-query";
import { useComfy } from "./use-comfy";
import type { DecryptArgs } from "../../core/decrypt";

// Reveal an arbitrary handle.
export function useDecrypt() {
  const comfy = useComfy();
  return useMutation({ mutationFn: (args: DecryptArgs) => comfy.decrypt(args) });
}
