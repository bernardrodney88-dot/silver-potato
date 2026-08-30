export type Sheet = {
  id: string;
  title: string;
  track: string;
  blocks: { h: string; body: string }[];
};

export const SHEETS: Sheet[] = [
  {
    id: "detect",
    title: "Detection pocket card",
    track: "detection",
    blocks: [
      {
        h: "IoU",
        body: "inter = max(0, min(x2)−max(x1)) · max(0, min(y2)−max(y1))\nunion = A + B − inter\nGIoU = IoU − |C \\ (A∪B)| / |C|  (C = enclosing box)",
      },
      {
        h: "NMS",
        body: "Sort by score. Keep best. Suppress IoU ≥ t (often 0.5–0.7). Soft-NMS decays scores instead of dropping. DETR: no NMS, Hungarian match.",
      },
      {
        h: "mAP",
        body: "Match preds to GT at IoU τ (greedy, highest score). PR curve → AP. COCO: mean over τ = 0.5:0.05:0.95 and classes. Always name the protocol.",
      },
      {
        h: "One-stage vs two",
        body: "Two: RPN proposals → RoI head (Faster / Mask R-CNN). One: dense predictions (RetinaNet, YOLO, FCOS). FPN for scale. Anchors vs anchor-free (centers / objects as points).",
      },
    ],
  },
  {
    id: "cnn",
    title: "CNN pocket card",
    track: "cnns",
    blocks: [
      {
        h: "Receptive field",
        body: "rf ← 1; jump ← 1\nfor each layer: rf += (k−1)*jump; jump *= stride\nDilation: effective k = k + (k−1)(d−1)",
      },
      {
        h: "Shapes",
        body: "out = floor((in + 2p − d(k−1) − 1)/s) + 1\nSame pad for odd k: p = d(k−1)/2 when s=1.",
      },
      {
        h: "Norm",
        body: "BN: over batch, per channel — batch-size sensitive.\nLN: over features, per sample (transformers).\nGN: groups of channels — detection-friendly.",
      },
      {
        h: "ResNet bottleneck",
        body: "1×1 ↓C → 3×3 → 1×1 ↑C, plus skip. Projection skip when stride≠1 or depth changes.",
      },
    ],
  },
  {
    id: "geom",
    title: "Geometry pocket card",
    track: "geometry",
    blocks: [
      {
        h: "Pinhole",
        body: "x = K [R|t] X,   K = [[fx, 0, cx],[0, fy, cy],[0,0,1]]\nu = fx X/Z + cx,  v = fy Y/Z + cy",
      },
      {
        h: "Homography",
        body: "x' ~ H x, H 3×3 (8 DoF). Valid for a plane, or camera pure rotation. 4 point correspondences (DLT).",
      },
      {
        h: "Two-view",
        body: "x2ᵀ F x1 = 0.  E = [t]× R.  5-point (calibrated) / 8-point (F). Recover R,t up to scale; triangulate for 3D.",
      },
      {
        h: "Stereo",
        body: "disparity d = uL − uR,  Z = fx · B / d.  Needs rectification (horizontal epipolar lines).",
      },
    ],
  },
  {
    id: "train",
    title: "Training & eval card",
    track: "systems",
    blocks: [
      {
        h: "Losses",
        body: "CE + softmax (stable: log-sum-exp).\nFocal: easy-neg downweight.\nDice / Tversky: overlap, imbalance.\nSmooth-L1 / IoU / GIoU / CIoU: boxes.",
      },
      {
        h: "Leakage",
        body: "Split by scene / video / patient, not random frames.\nAugment train only; keep a frozen val.\nDon't tune on test COCO — use val, then test-dev.",
      },
      {
        h: "Serve",
        body: "Export ONNX → TensorRT / CoreML.\nFP16 almost free; INT8 needs calibration.\nBudget: preprocess + backbone + head + NMS. Profile NMS on CPU.",
      },
    ],
  },
];
