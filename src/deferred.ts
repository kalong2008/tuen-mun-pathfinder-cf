import { useEffect, useState } from "react";

export type Settled<T> = Promise<T> & { result?: T; failed?: boolean };

export function settle<T>(promise: Promise<T>): Settled<T> {
  const settled = promise.then(
    (value) => {
      settled.result = value;
      return value;
    },
    (error: unknown) => {
      settled.failed = true;
      throw error;
    },
  ) as Settled<T>;
  settled.catch(() => {});
  return settled;
}

function isSettledPromise<T>(value: T | Settled<T>): value is Settled<T> {
  return typeof (value as Settled<T> | null)?.then === "function";
}

function readSettled<T>(value: T | Settled<T>, fallback: T): T | undefined {
  if (!isSettledPromise(value)) return value;
  if (value.result !== undefined) return value.result;
  if (value.failed) return fallback;
  return undefined;
}

export function useDeferred<T>(value: T | Settled<T>, fallback: T): T | undefined {
  const [source, setSource] = useState(value);
  const [data, setData] = useState<T | undefined>(() => readSettled(value, fallback));
  if (source !== value) {
    setSource(value);
    setData(readSettled(value, fallback));
  }

  useEffect(() => {
    if (!isSettledPromise(value)) return;
    if (value.result !== undefined || value.failed) return;
    let active = true;
    value.then(
      (resolved) => {
        if (active) setData(resolved);
      },
      () => {
        if (active) setData(fallback);
      },
    );
    return () => {
      active = false;
    };
  }, [value, fallback]);

  return data;
}
