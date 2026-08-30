import type { TrackId } from "./tracks";

export type TestCase = {
  name: string;
  args: unknown[];
  expected: unknown;
};

export type Problem = {
  id: string;
  title: string;
  track: TrackId;
  difficulty: "easy" | "medium" | "hard";
  minutes: number;
  prompt: string;
  signature: string;
  starter: string;
  python: string;
  tests: TestCase[];
  hints: string[];
  why: string;
};

export const PROBLEMS: Problem[] = [
  {
    id: "iou",
    title: "Intersection over Union",
    track: "detection",
    difficulty: "easy",
    minutes: 15,
    prompt:
      "Boxes are axis-aligned [x1, y1, x2, y2]. Return IoU. Degenerate or disjoint boxes must return 0. Do not assume x2 > x1.",
    signature: "function iou(a, b)",
    starter: `function iou(a, b) {
  // a, b: [x1, y1, x2, y2]
  
}`,
    python: `def iou(a, b):
    x1 = max(a[0], b[0]); y1 = max(a[1], b[1])
    x2 = min(a[2], b[2]); y2 = min(a[3], b[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    aa = max(0, a[2] - a[0]) * max(0, a[3] - a[1])
    ab = max(0, b[2] - b[0]) * max(0, b[3] - b[1])
    union = aa + ab - inter
    return 0.0 if union == 0 else inter / union`,
    tests: [
      { name: "identical", args: [[0, 0, 10, 10], [0, 0, 10, 10]], expected: 1 },
      { name: "disjoint", args: [[0, 0, 1, 1], [5, 5, 6, 6]], expected: 0 },
      { name: "overlap", args: [[0, 0, 2, 2], [1, 1, 3, 3]], expected: 1 / 7 },
    ],
    hints: [
      "Intersection is a box too: max of mins, min of maxes.",
      "Clamp width/height at 0 so inverted boxes don't explode.",
    ],
    why: "Every detector, tracker, and mAP implementation bottoms out on IoU. Interviewers watch for union-zero and inverted boxes.",
  },
  {
    id: "nms",
    title: "Non-maximum suppression",
    track: "detection",
    difficulty: "medium",
    minutes: 25,
    prompt:
      "Given boxes, scores, and an IoU threshold, return indices of boxes to keep. Greedy: highest score first; suppress neighbors ≥ threshold.",
    signature: "function nms(boxes, scores, threshold)",
    starter: `function nms(boxes, scores, threshold) {
  // return number[] of kept indices
  
}`,
    python: `def nms(boxes, scores, thr):
    order = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
    keep, suppressed = [], set()
    for i in order:
        if i in suppressed: continue
        keep.append(i)
        for j in order:
            if j == i or j in suppressed: continue
            if iou(boxes[i], boxes[j]) >= thr:
                suppressed.add(j)
    return keep`,
    tests: [
      {
        name: "overlap pair",
        args: [
          [
            [0, 0, 10, 10],
            [1, 1, 11, 11],
            [50, 50, 60, 60],
          ],
          [0.9, 0.8, 0.7],
          0.3,
        ],
        expected: [0, 2],
      },
    ],
    hints: [
      "Sort by score, not by box index.",
      "Compare remaining boxes against the *kept* box, not against each other blindly.",
    ],
    why: "Classic whiteboard. They want the greedy algorithm, not Soft-NMS, unless they ask.",
  },
  {
    id: "xywh",
    title: "YOLO xywh → xyxy",
    track: "detection",
    difficulty: "easy",
    minutes: 10,
    prompt: "Convert a center-format box [cx, cy, w, h] to [x1, y1, x2, y2].",
    signature: "function xywhToXyxy(box)",
    starter: `function xywhToXyxy(box) {
  
}`,
    python: `def xywh_to_xyxy(box):
    cx, cy, w, h = box
    return [cx - w/2, cy - h/2, cx + w/2, cy + h/2]`,
    tests: [{ name: "center", args: [[10, 10, 4, 6]], expected: [8, 7, 12, 13] }],
    hints: ["x1 is cx minus half width."],
    why: "Label format conversions are where off-by-one bugs hide in training code.",
  },
  {
    id: "conv2d",
    title: "2D convolution (valid padding)",
    track: "fundamentals",
    difficulty: "medium",
    minutes: 25,
    prompt:
      "Convolve a 2D image with a kernel. Use same-size output with zero padding (kernel centered). Do not flip the kernel (cross-correlation is acceptable in interviews unless they insist).",
    signature: "function conv2d(image, kernel)",
    starter: `function conv2d(image, kernel) {
  // image, kernel: number[][]
  
}`,
    python: `import numpy as np
def conv2d(image, kernel):
    kh, kw = kernel.shape
    py, px = kh // 2, kw // 2
    h, w = image.shape
    out = np.zeros_like(image, dtype=float)
    for y in range(h):
        for x in range(w):
            acc = 0.0
            for ky in range(kh):
                for kx in range(kw):
                    iy, ix = y + ky - py, x + kx - px
                    if 0 <= iy < h and 0 <= ix < w:
                        acc += image[iy, ix] * kernel[ky, kx]
            out[y, x] = acc
    return out`,
    tests: [
      {
        name: "identity",
        args: [
          [
            [1, 2],
            [3, 4],
          ],
          [
            [0, 0, 0],
            [0, 1, 0],
            [0, 0, 0],
          ],
        ],
        expected: [
          [1, 2],
          [3, 4],
        ],
      },
    ],
    hints: [
      "Output (y, x) looks at a neighborhood centered on (y, x).",
      "Skip out-of-bounds (zero pad) rather than wrapping.",
    ],
    why: "They are checking index arithmetic, not NumPy. Say out loud whether you flip the kernel.",
  },
  {
    id: "softmax-ce",
    title: "Softmax cross-entropy",
    track: "cnns",
    difficulty: "easy",
    minutes: 15,
    prompt: "Return mean-unreduced CE for a single example: logits (array) and integer class target. Numerically stable softmax.",
    signature: "function crossEntropy(logits, target)",
    starter: `function crossEntropy(logits, target) {
  
}`,
    python: `import numpy as np
def cross_entropy(logits, target):
    z = logits - logits.max()
    p = np.exp(z) / np.exp(z).sum()
    return -np.log(p[target] + 1e-12)`,
    tests: [
      { name: "confident correct", args: [[10, 0, 0], 0], expected: 0 },
      { name: "uniform 2-class", args: [[0, 0], 1], expected: Math.log(2) },
    ],
    hints: ["Subtract max logit before exp.", "Loss is -log of the target probability."],
    why: "Numerical stability is the follow-up. If you overflow, you fail the bar.",
  },
  {
    id: "dice",
    title: "Dice coefficient",
    track: "segmentation",
    difficulty: "easy",
    minutes: 12,
    prompt: "Soft Dice on flat arrays of probabilities / labels in [0,1]. Add a small epsilon.",
    signature: "function dice(pred, target)",
    starter: `function dice(pred, target) {
  
}`,
    python: `def dice(pred, target, eps=1e-6):
    inter = (pred * target).sum()
    return (2 * inter + eps) / (pred.sum() + target.sum() + eps)`,
    tests: [
      { name: "perfect", args: [[1, 0, 1], [1, 0, 1]], expected: 1 },
      { name: "none", args: [[0, 0], [1, 1]], expected: 0 },
    ],
    hints: ["2 |A∩B| / (|A| + |B|).", "Use products for soft intersection."],
    why: "Segmentation interviews always contrast Dice vs cross-entropy on class imbalance.",
  },
  {
    id: "bilinear",
    title: "Bilinear sample",
    track: "fundamentals",
    difficulty: "medium",
    minutes: 20,
    prompt: "Sample image[y, x] at a floating coordinate with bilinear interpolation. Clamp to bounds.",
    signature: "function bilinear(image, y, x)",
    starter: `function bilinear(image, y, x) {
  
}`,
    python: `def bilinear(img, y, x):
    h, w = img.shape
    y0, x0 = int(np.floor(y)), int(np.floor(x))
    y1, x1 = min(y0+1, h-1), min(x0+1, w-1)
    wy, wx = y - y0, x - x0
    def at(yy, xx):
        return img[np.clip(yy,0,h-1), np.clip(xx,0,w-1)]
    return (at(y0,x0)*(1-wy)*(1-wx) + at(y0,x1)*(1-wy)*wx
          + at(y1,x0)*wy*(1-wx) + at(y1,x1)*wy*wx)`,
    tests: [
      {
        name: "pixel center",
        args: [
          [
            [10, 20],
            [30, 40],
          ],
          0,
          0,
        ],
        expected: 10,
      },
      {
        name: "mid",
        args: [
          [
            [0, 10],
            [0, 10],
          ],
          0,
          0.5,
        ],
        expected: 5,
      },
    ],
    hints: ["Four neighbors, weights are complementary distances."],
    why: "RoIAlign, warping, and differentiable sampling are bilinear under the hood.",
  },
  {
    id: "pinhole",
    title: "Pinhole projection",
    track: "geometry",
    difficulty: "easy",
    minutes: 12,
    prompt: "Project (X,Y,Z) with intrinsics fx, fy, cx, cy. Return pixel (u, v). Guard Z = 0.",
    signature: "function projectPoint(X, Y, Z, fx, fy, cx, cy)",
    starter: `function projectPoint(X, Y, Z, fx, fy, cx, cy) {
  
}`,
    python: `def project(X, Y, Z, fx, fy, cx, cy):
    if Z == 0: return (cx, cy)
    return (fx * X / Z + cx, fy * Y / Z + cy)`,
    tests: [{ name: "on axis", args: [0, 0, 2, 100, 100, 320, 240], expected: [320, 240] }],
    hints: ["u = fx * X/Z + cx."],
    why: "If you mix up rows vs columns or forget +cx, the rest of the geometry loop collapses.",
  },
  {
    id: "anchors",
    title: "Anchor generator",
    track: "detection",
    difficulty: "medium",
    minutes: 25,
    prompt:
      "Generate xyxy anchors for a feature map. Cell center is ((gx+0.5)*stride, (gy+0.5)*stride). For each scale s and aspect ratio r, width = s*sqrt(r), height = s/sqrt(r).",
    signature: "function generateAnchors(stride, scales, ratios, gridH, gridW)",
    starter: `function generateAnchors(stride, scales, ratios, gridH, gridW) {
  // return Box[]
  
}`,
    python: `def generate_anchors(stride, scales, ratios, gh, gw):
    out = []
    for gy in range(gh):
        for gx in range(gw):
            cx, cy = (gx+0.5)*stride, (gy+0.5)*stride
            for s in scales:
                for r in ratios:
                    w, h = s*(r**0.5), s/(r**0.5)
                    out.append([cx-w/2, cy-h/2, cx+w/2, cy+h/2])
    return out`,
    tests: [
      {
        name: "single cell",
        args: [8, [4], [1], 1, 1],
        expected: [[2, 2, 6, 6]],
      },
    ],
    hints: ["One cell, square scale 4, stride 8 → center (4,4), box from 2 to 6."],
    why: "RetinaNet / Faster R-CNN interviews often start by asking you to place anchors on a grid.",
  },
  {
    id: "ap",
    title: "Average precision (11-ish interpolation skipped)",
    track: "systems",
    difficulty: "hard",
    minutes: 30,
    prompt:
      "Given detections {score, tp:boolean} already matched at a fixed IoU, sort by score descending and compute area under the precision-recall curve (rectangle rule). All listed items are the prediction list; recall denominator is the number of true positives in that list (simplified — mention the missing FN pool in the interview).",
    signature: "function averagePrecision(preds)",
    starter: `function averagePrecision(preds) {
  // preds: {score, tp}[]
  
}`,
    python: `def average_precision(preds):
    preds = sorted(preds, key=lambda p: -p['score'])
    npos = max(1, sum(p['tp'] for p in preds))
    tp = fp = 0
    ap = prev_r = 0.0
    for p in preds:
        tp += int(p['tp']); fp += int(not p['tp'])
        r = tp / npos
        prec = tp / (tp + fp)
        ap += prec * max(0, r - prev_r)
        prev_r = r
    return ap`,
    tests: [
      {
        name: "all tp",
        args: [[{ score: 0.9, tp: true }, { score: 0.2, tp: true }]],
        expected: 1,
      },
    ],
    hints: ["Sort by confidence. Accumulate TP/FP. Integrate precision d(recall)."],
    why: "mAP is the metric they will ask you to define, then implement a slice of.",
  },
  {
    id: "histeq",
    title: "Histogram equalization",
    track: "fundamentals",
    difficulty: "medium",
    minutes: 25,
    prompt: "Equalize an 8-bit grayscale image (0–255 numbers). Classic CDF remap.",
    signature: "function histogramEqualize(image)",
    starter: `function histogramEqualize(image) {
  
}`,
    python: `def hist_eq(img):
    hist, _ = np.histogram(img.flatten(), 256, [0,256])
    cdf = hist.cumsum()
    cdf_min = cdf[cdf>0][0]
    n = img.size
    lut = np.round((cdf - cdf_min) / (n - cdf_min) * 255).astype(int)
    return lut[img]`,
    tests: [
      {
        name: "two values",
        args: [
          [
            [0, 0],
            [255, 255],
          ],
        ],
        expected: [
          [0, 0],
          [255, 255],
        ],
      },
    ],
    hints: ["Build 256-bin hist → CDF → stretch to 0..255."],
    why: "Preprocessing question that reveals whether you know a CDF from a PDF.",
  },
  {
    id: "ransac-count",
    title: "RANSAC inlier count",
    track: "classical",
    difficulty: "easy",
    minutes: 12,
    prompt:
      "You are given residuals (absolute errors) and a threshold. Return how many are inliers (|r| < thr).",
    signature: "function inliers(residuals, thr)",
    starter: `function inliers(residuals, thr) {
  
}`,
    python: `def inliers(residuals, thr):
    return int((np.abs(residuals) < thr).sum())`,
    tests: [{ name: "basic", args: [[0.1, 0.4, 2.0, -0.2], 0.5], expected: 3 }],
    hints: ["Absolute residual vs threshold."],
    why: "They will then ask how many iterations you need as a function of outlier ratio.",
  },
];

export function problemById(id: string): Problem | undefined {
  return PROBLEMS.find((p) => p.id === id);
}
