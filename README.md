# Fovea — computer vision interview lab

Browser gym for CV coding interviews: implement IoU, NMS, convolution, and related kernels; run concept drills; step visual labs; sit a 45-minute mock.

## Run

```bash
npm install
npm run dev
```

Open the printed local URL. Progress is stored in `localStorage` (key `fovea-progress-v1`).

Live demo (GitHub Pages): https://bernardrodney88-dot.github.io/silver-potato/

```bash
npm test     # algorithm unit tests
npm run build
```

## What's inside

- **Studio** — track coverage, heat map, featured problem
- **Problems** — JS test runner + Python reference (whiteboard language)
- **Drills** — multiple choice with interviewer-style explanations
- **Visual lab** — convolution stepper, IoU, NMS, pinhole camera
- **Mock loop** — 45-minute timer + one problem + five prompts
- **Pocket cards** — detection, CNN, geometry, training/eval

No backend. No accounts.
