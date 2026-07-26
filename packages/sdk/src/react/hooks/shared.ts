"use client";

export interface WriteOptions<TData, TVars> {
  onSuccess?: (data: TData, variables: TVars) => void;
  onError?: (error: unknown, variables: TVars) => void;
}

export interface ReadOptions {
  enabled?: boolean;
  refetchInterval?: number;
}
