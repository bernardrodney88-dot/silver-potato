export function nearlyEqual(a: unknown, b: unknown, eps = 1e-3): boolean {
  if (typeof a === "number" && typeof b === "number") {
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    return Math.abs(a - b) <= eps || Math.abs(a - b) <= eps * Math.max(1, Math.abs(b));
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => nearlyEqual(v, b[i], eps));
  }
  return JSON.stringify(a) === JSON.stringify(b);
}

export function runUserFn(source: string, name: string, args: unknown[]): unknown {
  const factory = new Function(`"use strict";\n${source}\n; if (typeof ${name} !== "function") throw new Error("Define function ${name}"); return ${name};`);
  const fn = factory() as (...a: unknown[]) => unknown;
  return fn(...args);
}

export function fnNameFromSignature(sig: string): string {
  const m = sig.match(/function\s+([A-Za-z_][\w]*)/);
  return m?.[1] ?? "solve";
}
