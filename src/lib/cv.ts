export type Box = [number, number, number, number]; // xyxy

export function iou(a: Box, b: Box): number {
  const x1 = Math.max(a[0], b[0]);
  const y1 = Math.max(a[1], b[1]);
  const x2 = Math.min(a[2], b[2]);
  const y2 = Math.min(a[3], b[3]);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = Math.max(0, a[2] - a[0]) * Math.max(0, a[3] - a[1]);
  const areaB = Math.max(0, b[2] - b[0]) * Math.max(0, b[3] - b[1]);
  const union = areaA + areaB - inter;
  return union === 0 ? 0 : inter / union;
}

export function nms(boxes: Box[], scores: number[], threshold: number): number[] {
  const order = scores
    .map((s, i) => [s, i] as const)
    .sort((a, b) => b[0] - a[0])
    .map(([, i]) => i);
  const keep: number[] = [];
  const suppressed = new Set<number>();
  for (const i of order) {
    if (suppressed.has(i)) continue;
    keep.push(i);
    const bi = boxes[i];
    if (!bi) continue;
    for (const j of order) {
      if (j === i || suppressed.has(j)) continue;
      const bj = boxes[j];
      if (!bj) continue;
      if (iou(bi, bj) >= threshold) suppressed.add(j);
    }
  }
  return keep;
}

export function xywhToXyxy(box: Box): Box {
  const [x, y, w, h] = box;
  return [x - w / 2, y - h / 2, x + w / 2, y + h / 2];
}

export function conv2d(image: number[][], kernel: number[][]): number[][] {
  const kh = kernel.length;
  const kw = kernel[0]?.length ?? 0;
  const padY = Math.floor(kh / 2);
  const padX = Math.floor(kw / 2);
  const h = image.length;
  const w = image[0]?.length ?? 0;
  const out: number[][] = [];
  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let ky = 0; ky < kh; ky++) {
        for (let kx = 0; kx < kw; kx++) {
          const iy = y + ky - padY;
          const ix = x + kx - padX;
          if (iy < 0 || ix < 0 || iy >= h || ix >= w) continue;
          acc += (image[iy]?.[ix] ?? 0) * (kernel[ky]?.[kx] ?? 0);
        }
      }
      row.push(acc);
    }
    out.push(row);
  }
  return out;
}

export function softmax(logits: number[]): number[] {
  const max = Math.max(...logits);
  const exps = logits.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

export function crossEntropy(logits: number[], target: number): number {
  const p = softmax(logits);
  const pt = Math.max(p[target] ?? 1e-12, 1e-12);
  return -Math.log(pt);
}

export function dice(pred: number[], target: number[], eps = 1e-6): number {
  let inter = 0;
  let sum = 0;
  for (let i = 0; i < pred.length; i++) {
    const a = pred[i] ?? 0;
    const b = target[i] ?? 0;
    inter += a * b;
    sum += a + b;
  }
  return (2 * inter + eps) / (sum + eps);
}

export function bilinear(image: number[][], y: number, x: number): number {
  const h = image.length;
  const w = image[0]?.length ?? 0;
  const y0 = Math.floor(y);
  const x0 = Math.floor(x);
  const y1 = Math.min(y0 + 1, h - 1);
  const x1 = Math.min(x0 + 1, w - 1);
  const wy = y - y0;
  const wx = x - x0;
  const v00 = image[clamp(y0, 0, h - 1)]?.[clamp(x0, 0, w - 1)] ?? 0;
  const v01 = image[clamp(y0, 0, h - 1)]?.[clamp(x1, 0, w - 1)] ?? 0;
  const v10 = image[clamp(y1, 0, h - 1)]?.[clamp(x0, 0, w - 1)] ?? 0;
  const v11 = image[clamp(y1, 0, h - 1)]?.[clamp(x1, 0, w - 1)] ?? 0;
  return v00 * (1 - wy) * (1 - wx) + v01 * (1 - wy) * wx + v10 * wy * (1 - wx) + v11 * wy * wx;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function histogramEqualize(image: number[][]): number[][] {
  const flat = image.flat();
  const hist = new Array(256).fill(0) as number[];
  for (const v of flat) hist[Math.max(0, Math.min(255, Math.round(v)))]! += 1;
  const cdf: number[] = [];
  let acc = 0;
  const n = flat.length || 1;
  for (let i = 0; i < 256; i++) {
    acc += hist[i] ?? 0;
    cdf.push(acc);
  }
  const cdfMin = cdf.find((c) => c > 0) ?? 0;
  const map = cdf.map((c) => Math.round(((c - cdfMin) / (n - cdfMin || 1)) * 255));
  return image.map((row) => row.map((v) => map[Math.max(0, Math.min(255, Math.round(v)))] ?? 0));
}

export function projectPoint(
  X: number,
  Y: number,
  Z: number,
  fx: number,
  fy: number,
  cx: number,
  cy: number,
): [number, number] {
  if (Z === 0) return [cx, cy];
  return [(fx * X) / Z + cx, (fy * Y) / Z + cy];
}

export function generateAnchors(
  stride: number,
  scales: number[],
  ratios: number[],
  gridH: number,
  gridW: number,
): Box[] {
  const anchors: Box[] = [];
  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      const cx = (gx + 0.5) * stride;
      const cy = (gy + 0.5) * stride;
      for (const s of scales) {
        for (const r of ratios) {
          const h = s / Math.sqrt(r);
          const w = s * Math.sqrt(r);
          anchors.push([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2]);
        }
      }
    }
  }
  return anchors;
}

export function precisionRecall(
  preds: { score: number; tp: boolean }[],
): { precision: number[]; recall: number[] } {
  const sorted = [...preds].sort((a, b) => b.score - a.score);
  const totalPos = preds.filter((p) => p.tp).length || sorted.filter((p) => p.tp).length;
  const positives = sorted.filter((p) => p.tp).length;
  let tp = 0;
  let fp = 0;
  const precision: number[] = [];
  const recall: number[] = [];
  const denom = positives || 1;
  for (const p of sorted) {
    if (p.tp) tp += 1;
    else fp += 1;
    precision.push(tp / (tp + fp));
    recall.push(tp / denom);
  }
  void totalPos;
  return { precision, recall };
}

export function averagePrecision(preds: { score: number; tp: boolean }[]): number {
  const { precision, recall } = precisionRecall(preds);
  let ap = 0;
  let prevR = 0;
  for (let i = 0; i < precision.length; i++) {
    const r = recall[i] ?? 0;
    const p = precision[i] ?? 0;
    ap += p * Math.max(0, r - prevR);
    prevR = r;
  }
  return ap;
}
