"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useComfy } from "./use-comfy";
import type { ApproveArgs } from "../../core/wrap";
import type { Hex } from "../../core/types";
import type { WriteOptions } from "./shared";

export function useApprove(options?: WriteOptions<{ hash: Hex }, ApproveArgs>) {
  const comfy = useComfy();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: ApproveArgs) => comfy.approve(args),
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ["comfy"] });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
}
