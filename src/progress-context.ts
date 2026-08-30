import { createContext, useContext } from "react";
import type { Progress } from "./store";

export const ProgressCtx = createContext<{
  progress: Progress;
  setProgress: (p: Progress) => void;
} | null>(null);

export function useProgress() {
  const ctx = useContext(ProgressCtx);
  if (!ctx) throw new Error("ProgressCtx missing");
  return ctx;
}
