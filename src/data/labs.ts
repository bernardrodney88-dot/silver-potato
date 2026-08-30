export type LabId = "conv" | "iou" | "nms" | "pinhole";

export const LABS: { id: LabId; title: string; blurb: string }[] = [
  { id: "conv", title: "Convolution stepper", blurb: "Watch a kernel walk an image. Interviewers ask you to write this nested loop." },
  { id: "iou", title: "IoU sandbox", blurb: "Drag two boxes. Read intersection, union, GIoU-shaped enclosing box." },
  { id: "nms", title: "NMS theater", blurb: "Overlapping detections collapse as you raise the IoU threshold." },
  { id: "pinhole", title: "Pinhole camera", blurb: "Move a 3D point and focal length; see the pixel jump." },
];
