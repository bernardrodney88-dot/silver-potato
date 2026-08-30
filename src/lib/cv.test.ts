import { describe, expect, it } from "vitest";
import { averagePrecision, conv2d, dice, iou, nms, softmax, xywhToXyxy } from "./cv";

describe("iou", () => {
  it("returns 1 for identical boxes", () => {
    expect(iou([0, 0, 10, 10], [0, 0, 10, 10])).toBe(1);
  });
  it("returns 0 for disjoint boxes", () => {
    expect(iou([0, 0, 1, 1], [2, 2, 3, 3])).toBe(0);
  });
  it("handles partial overlap", () => {
    expect(iou([0, 0, 2, 2], [1, 1, 3, 3])).toBeCloseTo(1 / 7);
  });
});

describe("nms", () => {
  it("keeps the highest score of overlapping boxes", () => {
    const keep = nms(
      [
        [0, 0, 10, 10],
        [1, 1, 11, 11],
        [50, 50, 60, 60],
      ],
      [0.9, 0.8, 0.7],
      0.3,
    );
    expect(keep).toEqual([0, 2]);
  });
});

describe("conv2d", () => {
  it("applies an identity kernel", () => {
    const img = [
      [1, 2],
      [3, 4],
    ];
    const k = [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ];
    expect(conv2d(img, k)).toEqual(img);
  });
});

describe("softmax", () => {
  it("sums to 1", () => {
    const p = softmax([1, 2, 3]);
    expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });
});

describe("dice", () => {
  it("is 1 for identical masks", () => {
    expect(dice([1, 0, 1], [1, 0, 1])).toBeCloseTo(1);
  });
});

describe("xywhToXyxy", () => {
  it("converts center format", () => {
    expect(xywhToXyxy([10, 10, 4, 6])).toEqual([8, 7, 12, 13]);
  });
});

describe("averagePrecision", () => {
  it("is 1 when every detection is a true positive", () => {
    expect(averagePrecision([{ score: 0.9, tp: true }, { score: 0.2, tp: true }])).toBeCloseTo(1);
  });
});
