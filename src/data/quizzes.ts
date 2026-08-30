import type { TrackId } from "./tracks";

export type Choice = { id: string; text: string; ok: boolean };

export type Quiz = {
  id: string;
  track: TrackId;
  q: string;
  choices: Choice[];
  explain: string;
};

export const QUIZZES: Quiz[] = [
  {
    id: "corr-vs-conv",
    track: "fundamentals",
    q: "In deep learning libraries, conv2d usually implements:",
    choices: [
      { id: "a", text: "True convolution (kernel flipped)", ok: false },
      { id: "b", text: "Cross-correlation (no flip)", ok: true },
      { id: "c", text: "Only FFT convolution", ok: false },
      { id: "d", text: "Max pooling", ok: false },
    ],
    explain: "Learned weights absorb the flip. Say this out loud so nobody nits you on the board.",
  },
  {
    id: "same-pad",
    track: "fundamentals",
    q: "For a 3×3 kernel, stride 1, 'same' spatial size needs padding:",
    choices: [
      { id: "a", text: "0", ok: false },
      { id: "b", text: "1 on each side", ok: true },
      { id: "c", text: "3", ok: false },
      { id: "d", text: "Kernel size", ok: false },
    ],
    explain: "p = (k−1)/2 for odd kernels at stride 1. Even kernels make 'same' messy — mention it.",
  },
  {
    id: "gray",
    track: "fundamentals",
    q: "A reasonable RGB→luma (BT.601-ish) mix is closest to:",
    choices: [
      { id: "a", text: "Equal 1/3 weights", ok: false },
      { id: "b", text: "Heavier green (e.g. 0.299R + 0.587G + 0.114B)", ok: true },
      { id: "c", text: "Only the blue channel", ok: false },
      { id: "d", text: "HSV hue", ok: false },
    ],
    explain: "Human luminance is green-heavy. Mean RGB is a fine baseline if you name the shortcut.",
  },
  {
    id: "rf-stack",
    track: "cnns",
    q: "Two 3×3 convs, stride 1, no dilation. Receptive field on the input?",
    choices: [
      { id: "a", text: "3×3", ok: false },
      { id: "b", text: "5×5", ok: true },
      { id: "c", text: "6×6", ok: false },
      { id: "d", text: "9×9", ok: false },
    ],
    explain: "RF grows by (k−1) each layer: 1 + 2 + 2 = 5. Stacking 3×3 is how VGG got 7×7 cheaper.",
  },
  {
    id: "bn-train",
    track: "cnns",
    q: "At inference, BatchNorm uses:",
    choices: [
      { id: "a", text: "The current batch mean/var", ok: false },
      { id: "b", text: "Running averages collected in train", ok: true },
      { id: "c", text: "LayerNorm statistics", ok: false },
      { id: "d", text: "Nothing — BN is dropped", ok: false },
    ],
    explain: "Train: batch stats + update EMA. Eval: frozen EMA. Batch size 1 at train is why BN hurts.",
  },
  {
    id: "skip",
    track: "cnns",
    q: "ResNet identity skip primarily helps by:",
    choices: [
      { id: "a", text: "Reducing parameters", ok: false },
      { id: "b", text: "Easing gradient flow / residual learning", ok: true },
      { id: "c", text: "Increasing receptive field", ok: false },
      { id: "d", text: "Replacing pooling", ok: false },
    ],
    explain: "Learn F(x) = H(x)−x. If identity is good, weights can go to 0. Also a highway for gradients.",
  },
  {
    id: "fpn",
    track: "detection",
    q: "FPN's lateral + top-down path is for:",
    choices: [
      { id: "a", text: "Cheaper NMS", ok: false },
      { id: "b", text: "High-res maps with strong semantics", ok: true },
      { id: "c", text: "Removing anchors", ok: false },
      { id: "d", text: "Batching RoIs", ok: false },
    ],
    explain: "Deep layers are semantic but coarse. FPN upsamples them and fuses with shallow detail.",
  },
  {
    id: "two-stage",
    track: "detection",
    q: "Faster R-CNN vs YOLO — most accurate one-line distinction?",
    choices: [
      { id: "a", text: "YOLO cannot do real-time", ok: false },
      { id: "b", text: "Two-stage proposes regions then classifies; YOLO predicts densely in one shot", ok: true },
      { id: "c", text: "YOLO uses only transformers", ok: false },
      { id: "d", text: "Faster R-CNN has no backbone", ok: false },
    ],
    explain: "RPN + RoI head vs dense grid predictions. Accuracy/speed tradeoff is the discussion, not a slogan.",
  },
  {
    id: "nms-fail",
    track: "detection",
    q: "NMS fails most obviously when:",
    choices: [
      { id: "a", text: "Boxes have equal aspect ratio", ok: false },
      { id: "b", text: "Two true objects heavily overlap (crowds)", ok: true },
      { id: "c", text: "Images are large", ok: false },
      { id: "d", text: "IoU is computed in GPU", ok: false },
    ],
    explain: "Greedy NMS treats overlap as duplicate. Soft-NMS / set prediction (DETR) is the follow-up.",
  },
  {
    id: "iou-loss",
    track: "detection",
    q: "GIoU is useful vs IoU loss when boxes:",
    choices: [
      { id: "a", text: "Fully overlap", ok: false },
      { id: "b", text: "Do not overlap (IoU plateau at 0)", ok: true },
      { id: "c", text: "Are rotated 45°", ok: false },
      { id: "d", text: "Have unit area", ok: false },
    ],
    explain: "IoU is 0 and has no gradient if disjoint. GIoU uses the enclosing box to keep a signal.",
  },
  {
    id: "semantic-instance",
    track: "segmentation",
    q: "Semantic vs instance segmentation:",
    choices: [
      { id: "a", text: "Semantic labels pixels by class; instance splits objects of the same class", ok: true },
      { id: "b", text: "They are identical at 1024²", ok: false },
      { id: "c", text: "Instance ignores class", ok: false },
      { id: "d", text: "Semantic requires boxes", ok: false },
    ],
    explain: "Panoptic = stuff (semantic) + things (instance).",
  },
  {
    id: "unet",
    track: "segmentation",
    q: "U-Net skip connections concatenate encoder maps to the decoder to:",
    choices: [
      { id: "a", text: "Cut GPU memory", ok: false },
      { id: "b", text: "Restore spatial detail lost in downsampling", ok: true },
      { id: "c", text: "Replace the loss", ok: false },
      { id: "d", text: "Enable batch size 1", ok: false },
    ],
    explain: "Encoder is 'what', skips are 'where'. Concat (U-Net) vs add (FPN-style) is a good nuance.",
  },
  {
    id: "checkerboard",
    track: "segmentation",
    q: "Checkerboard artifacts after upsampling usually come from:",
    choices: [
      { id: "a", text: "MaxPool", ok: false },
      { id: "b", text: "Uneven overlap in transposed conv", ok: true },
      { id: "c", text: "ReLU", ok: false },
      { id: "d", text: "Dropout 0.5", ok: false },
    ],
    explain: "Prefer upsample + conv. If you must deconv, stride and kernel should play nicely (e.g. k % s == 0).",
  },
  {
    id: "vit-inductive",
    track: "transformers",
    q: "ViTs often need more data than ResNets because:",
    choices: [
      { id: "a", text: "Attention has no locality / translation prior", ok: true },
      { id: "b", text: "Patches are always 32×32", ok: false },
      { id: "c", text: "They cannot use GPUs", ok: false },
      { id: "d", text: "Softmax is convex", ok: false },
    ],
    explain: "CNNs bake in locality and weight sharing. ViT learns it — expensive without pretrain/augmentation.",
  },
  {
    id: "attn-cost",
    track: "transformers",
    q: "Global self-attention over N tokens costs:",
    choices: [
      { id: "a", text: "O(N)", ok: false },
      { id: "b", text: "O(N log N)", ok: false },
      { id: "c", text: "O(N²) in the attention map", ok: true },
      { id: "d", text: "O(1)", ok: false },
    ],
    explain: "QK^T is N×N. High-res detection is why people use windowed / deformable attention.",
  },
  {
    id: "detr",
    track: "transformers",
    q: "DETR's set-prediction trick that removes NMS is:",
    choices: [
      { id: "a", text: "Focal loss only", ok: false },
      { id: "b", text: "Hungarian matching to unique GT objects", ok: true },
      { id: "c", text: "Larger batch size", ok: false },
      { id: "d", text: "GroupNorm", ok: false },
    ],
    explain: "Bipartite matching → one prediction per object. Slow convergence is the known wart (→ Deformable DETR).",
  },
  {
    id: "pinhole-q",
    track: "geometry",
    q: "In a pinhole camera, increasing fx (holding Z fixed):",
    choices: [
      { id: "a", text: "Zooms in (larger image of the same object)", ok: true },
      { id: "b", text: "Changes world units", ok: false },
      { id: "c", text: "Removes distortion", ok: false },
      { id: "d", text: "Flips handedness", ok: false },
    ],
    explain: "u = fx X/Z + cx. Larger fx is a longer lens. Distortion is a separate polynomial model.",
  },
  {
    id: "homography",
    track: "geometry",
    q: "A homography maps:",
    choices: [
      { id: "a", text: "Any 3D point to any view", ok: false },
      { id: "b", text: "Planes (or planar scenes / pure rotation) between views", ok: true },
      { id: "c", text: "Depth to disparity without baseline", ok: false },
      { id: "d", text: "RGB to HSV", ok: false },
    ],
    explain: "H is 3×3, 8 DoF. General 3D needs depth or a fundamental matrix, not a single H.",
  },
  {
    id: "essential",
    track: "geometry",
    q: "Essential vs fundamental matrix:",
    choices: [
      { id: "a", text: "E is calibrated (intrinsics known); F is in pixel space", ok: true },
      { id: "b", text: "They are transposes", ok: false },
      { id: "c", text: "F only works for stereo with 1m baseline", ok: false },
      { id: "d", text: "E is 2×2", ok: false },
    ],
    explain: "F = K2^{-T} E K1^{-1}. E encodes R,t up to scale.",
  },
  {
    id: "lk",
    track: "classical",
    q: "Lucas–Kanade optical flow assumes:",
    choices: [
      { id: "a", text: "Global smoothness only (Horn–Schunck)", ok: false },
      { id: "b", text: "Brightness constancy + locally constant flow", ok: true },
      { id: "c", text: "Known depth", ok: false },
      { id: "d", text: "A homography per pixel", ok: false },
    ],
    explain: "Solve the overdetermined I_x u + I_y v = −I_t in a window. Needs texture (the aperture problem).",
  },
  {
    id: "sift-rot",
    track: "classical",
    q: "SIFT rotation invariance comes mainly from:",
    choices: [
      { id: "a", text: "PCA on the image", ok: false },
      { id: "b", text: "Assigning a dominant orientation, then describing relative to it", ok: true },
      { id: "c", text: "Using color", ok: false },
      { id: "d", text: "Max pooling", ok: false },
    ],
    explain: "Scale from DoG extrema; rotation from orientation histogram; descriptor is a HOG in that frame.",
  },
  {
    id: "map-def",
    track: "systems",
    q: "COCO-style mAP averages:",
    choices: [
      { id: "a", text: "Accuracy over minibatches", ok: false },
      { id: "b", text: "AP over IoU thresholds (and categories)", ok: true },
      { id: "c", text: "FPS and latency", ok: false },
      { id: "d", text: "Pixel accuracy", ok: false },
    ],
    explain: "AP per class from PR curve, then mean; COCO also means over IoU 0.5:0.95. Always ask which mAP.",
  },
  {
    id: "int8",
    track: "systems",
    q: "INT8 quantization typically needs calibration because:",
    choices: [
      { id: "a", text: "Weights become sparse", ok: false },
      { id: "b", text: "You must choose scales/zero-points from activation ranges", ok: true },
      { id: "c", text: "Adam does not support int", ok: false },
      { id: "d", text: "NMS cannot run on int", ok: false },
    ],
    explain: "PTQ: run a few batches, record ranges, freeze scales. Sensitive layers may stay FP16.",
  },
  {
    id: "aug",
    track: "cnns",
    q: "Which augmentation can silently wreck a detector if you forget to transform labels?",
    choices: [
      { id: "a", text: "Color jitter", ok: false },
      { id: "b", text: "Horizontal flip / rotation / crop", ok: true },
      { id: "c", text: "Gaussian noise on pixels", ok: false },
      { id: "d", text: "JPEG compression", ok: false },
    ],
    explain: "Geometric augs must hit boxes/masks. Photometric augs usually don't. Interviewers love this landmine.",
  },
  {
    id: "receptive-dilate",
    track: "cnns",
    q: "Dilation 2 on a 3×3 conv makes the RF:",
    choices: [
      { id: "a", text: "Still 3, but holes", ok: false },
      { id: "b", text: "5×5 with a sparse kernel", ok: true },
      { id: "c", text: "9×9 dense", ok: false },
      { id: "d", text: "Unchanged", ok: false },
    ],
    explain: "RF = k + (k−1)(d−1) = 5. Coverage is not dense — a reason ASPP uses several dilations.",
  },
  {
    id: "focal",
    track: "detection",
    q: "Focal loss down-weights:",
    choices: [
      { id: "a", text: "Hard foreground only", ok: false },
      { id: "b", text: "Easy (high p_t) examples, often abundant background", ok: true },
      { id: "c", text: "All negatives equally", ok: false },
      { id: "d", text: "The IoU term", ok: false },
    ],
    explain: "FL = −α(1−p_t)^γ log(p_t). Dense detectors drown in easy negatives; γ focuses the loss.",
  },
  {
    id: "roi-align",
    track: "detection",
    q: "RoIAlign vs RoIPool:",
    choices: [
      { id: "a", text: "Align avoids quantization of RoI bins (bilinear)", ok: true },
      { id: "b", text: "Pool is strictly more accurate", ok: false },
      { id: "c", text: "Align only works on CPU", ok: false },
      { id: "d", text: "They differ only in NMS", ok: false },
    ],
    explain: "Quantization misaligned masks/boxes. Mask R-CNN's accuracy bump is partly RoIAlign.",
  },
];
