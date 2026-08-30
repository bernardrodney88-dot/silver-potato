import { PROBLEMS } from "./data/problems";
import { QUIZZES } from "./data/quizzes";
import type { TrackId } from "./data/tracks";

const KEY = "fovea-progress-v1";

export type Progress = {
  solved: string[];
  quizzes: Record<string, boolean>;
  labRuns: number;
  mocks: number;
  minutes: number;
  heatmap: Record<string, number>;
};

const empty = (): Progress => ({
  solved: [],
  quizzes: {},
  labRuns: 0,
  mocks: 0,
  minutes: 0,
  heatmap: {},
});

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) };
  } catch {
    return empty();
  }
}

export function saveProgress(p: Progress): void {
  localStorage.setItem(KEY, JSON.stringify(p));
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function bumpHeatmap(p: Progress, n = 1): Progress {
  const d = today();
  return { ...p, heatmap: { ...p.heatmap, [d]: (p.heatmap[d] ?? 0) + n } };
}

export function markSolved(id: string): Progress {
  const p = loadProgress();
  if (p.solved.includes(id)) return p;
  const next = bumpHeatmap({ ...p, solved: [...p.solved, id], minutes: p.minutes + (PROBLEMS.find((x) => x.id === id)?.minutes ?? 10) });
  saveProgress(next);
  return next;
}

export function markQuiz(id: string, ok: boolean): Progress {
  const p = loadProgress();
  const next = bumpHeatmap({ ...p, quizzes: { ...p.quizzes, [id]: ok } });
  saveProgress(next);
  return next;
}

export function bumpLab(): Progress {
  const p = loadProgress();
  const next = bumpHeatmap({ ...p, labRuns: p.labRuns + 1, minutes: p.minutes + 5 });
  saveProgress(next);
  return next;
}

export function bumpMock(): Progress {
  const p = loadProgress();
  const next = bumpHeatmap({ ...p, mocks: p.mocks + 1, minutes: p.minutes + 45 });
  saveProgress(next);
  return next;
}

export function trackCoverage(p: Progress, track: TrackId): { problems: number; quizzes: number; pDone: number; qDone: number } {
  const pr = PROBLEMS.filter((x) => x.track === track);
  const qz = QUIZZES.filter((x) => x.track === track);
  return {
    problems: pr.length,
    quizzes: qz.length,
    pDone: pr.filter((x) => p.solved.includes(x.id)).length,
    qDone: qz.filter((x) => p.quizzes[x.id]).length,
  };
}

export function resetProgress(): Progress {
  const p = empty();
  saveProgress(p);
  return p;
}
