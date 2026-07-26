"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useComfy } from "./use-comfy";
import type { WithdrawArgs } from "../../core/unwrap";
import type { Hex } from "../../core/types";
import type { WriteOptions } from "./shared";

export function useWithdraw(options?: WriteOptions<{ hash: Hex; amount: bigint }, WithdrawArgs>) {
  const comfy = useComfy();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: WithdrawArgs) => comfy.withdraw(args),
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ["comfy"] });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
}
