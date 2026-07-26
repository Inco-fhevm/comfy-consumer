"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useComfy } from "./use-comfy";
import type { SendArgs } from "../../core/transfer";
import type { Hex } from "../../core/types";
import type { WriteOptions } from "./shared";

export function useConfidentialSend(options?: WriteOptions<{ hash: Hex }, SendArgs>) {
  const comfy = useComfy();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: SendArgs) => comfy.confidentialSend(args),
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ["comfy"] });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
}
