"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useComfy } from "./use-comfy";
import type { DepositArgs } from "../../core/wrap";
import type { Hex } from "../../core/types";
import type { WriteOptions } from "./shared";

export function useDeposit(options?: WriteOptions<{ hash: Hex; amount: bigint }, DepositArgs>) {
  const comfy = useComfy();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: DepositArgs) => comfy.deposit(args),
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ["comfy"] });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
}
