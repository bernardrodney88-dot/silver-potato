export type TrackId =
  | "fundamentals"
  | "geometry"
  | "classical"
  | "cnns"
  | "detection"
  | "segmentation"
  | "transformers"
  | "systems";

export type Track = {
  id: TrackId;
  name: string;
  blurb: string;
  color: string;
  topics: string[];
};

export const TRACKS: Track[] = [
  {
    id: "fundamentals",
    name: "Pixels & filters",
    blurb: "Convolution, pyramids, color, histograms — the questions that open every onsite.",
    color: "#ff5c39",
    topics: ["Convolution", "Padding / stride", "Pyramids", "Histogram eq", "Color spaces"],
  },
  {
    id: "geometry",
    name: "Cameras & geometry",
    blurb: "Pinhole model, homographies, epipolar geometry, and why Z is never zero.",
    color: "#7ee0c8",
    topics: ["Pinhole", "Intrinsics", "Homography", "Essential / fundamental", "Triangulation"],
  },
  {
    id: "classical",
    name: "Classical CV",
    blurb: "Corners, descriptors, stereo, optical flow — still asked at robotics shops.",
    color: "#f2c14e",
    topics: ["Harris / FAST", "SIFT / ORB", "Stereo", "Lucas–Kanade", "RANSAC"],
  },
  {
    id: "cnns",
    name: "CNNs",
    blurb: "Receptive fields, residual connections, normalization, and training gotchas.",
    color: "#8ab4ff",
    topics: ["Receptive field", "ResNet", "BatchNorm", "Augmentation", "Losses"],
  },
  {
    id: "detection",
    name: "Detection",
    blurb: "IoU, NMS, anchors, FPN, YOLO vs two-stage — the highest-frequency interview track.",
    color: "#e38cff",
    topics: ["IoU / GIoU", "NMS", "Anchors", "FPN", "YOLO / Faster R-CNN"],
  },
  {
    id: "segmentation",
    name: "Segmentation",
    blurb: "Masks, Dice vs CE, instance vs semantic, and upsampling without checkerboards.",
    color: "#6ee7a8",
    topics: ["FCN / U-Net", "Dice", "Instance vs semantic", "Mask R-CNN", "Upsample"],
  },
  {
    id: "transformers",
    name: "ViT & modern",
    blurb: "Patch embeddings, attention cost, DETR, and when CNNs still win.",
    color: "#ff8fab",
    topics: ["ViT", "Attention complexity", "DETR", "SAM", "MAE"],
  },
  {
    id: "systems",
    name: "CV systems",
    blurb: "Latency budgets, quantization, data pipelines, eval, and design interviews.",
    color: "#c9b8a0",
    topics: ["mAP / F1", "ONNX / TensorRT", "Quantization", "Data flywheel", "Design"],
  },
];
