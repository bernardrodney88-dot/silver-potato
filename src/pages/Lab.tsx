import { useEffect, useMemo, useRef, useState } from "react";
import { LABS, type LabId } from "../data/labs";
import { conv2d, iou, nms, projectPoint, type Box } from "../lib/cv";
import { bumpLab } from "../store";
import { useProgress } from "../progress-context";

function useLabPing() {
  const { setProgress } = useProgress();
  return () => setProgress(bumpLab());
}

export function Lab() {
  const [id, setId] = useState<LabId>("conv");
  return (
    <>
      <p className="kicker">Visual lab</p>
      <h1>See the algorithm, then write it.</h1>
      <div className="toolbar">
        {LABS.map((l) => (
          <button key={l.id} className={`chip ${id === l.id ? "on" : ""}`} type="button" onClick={() => setId(l.id)}>
            {l.title}
          </button>
        ))}
      </div>
      <p className="lede">{LABS.find((l) => l.id === id)?.blurb}</p>
      {id === "conv" && <ConvLab />}
      {id === "iou" && <IouLab />}
      {id === "nms" && <NmsLab />}
      {id === "pinhole" && <PinholeLab />}
    </>
  );
}

function ConvLab() {
  const ping = useLabPing();
  const image = useMemo(
    () => [
      [1, 2, 3, 0, 1],
      [0, 4, 5, 1, 0],
      [2, 1, 9, 2, 3],
      [0, 0, 1, 4, 2],
      [1, 3, 0, 2, 1],
    ],
    [],
  );
  const [kstr, setKstr] = useState("0  -1  0\n-1  5 -1\n0  -1  0");
  const kernel = parseKernel(kstr);
  const out = kernel ? conv2d(image, kernel) : [];
  const [step, setStep] = useState(0);
  const h = image.length;
  const w = image[0]!.length;
  const y = Math.floor(step / w);
  const x = step % w;

  return (
    <article className="card lab-stage">
      <div className="row">
        <label>
          Kernel 3×3
          <textarea className="code" style={{ minHeight: 90, marginTop: 6 }} value={kstr} onChange={(e) => setKstr(e.target.value)} />
        </label>
        <div>
          <label className="slider">
            Step {step}
            <input type="range" min={0} max={h * w - 1} value={step} onChange={(e) => setStep(Number(e.target.value))} />
          </label>
          <button className="ghost" type="button" onClick={ping}>
            Log a lab run
          </button>
        </div>
      </div>
      {!kernel && <p className="fail">Kernel must be 3 lines of 3 numbers.</p>}
      <div className="split" style={{ marginTop: 16 }}>
        <Grid title="Input (window highlighted)" data={image} hi={{ y, x }} />
        <Grid title="Output so far" data={maskOut(out, step)} hi={{ y, x }} />
      </div>
      <p className="lede" style={{ marginTop: 12 }}>
        Center ({y}, {x}) ← zero-padded 3×3 neighborhood × kernel, summed. Same-size conv is the loop they want on the board.
      </p>
    </article>
  );
}

function parseKernel(s: string): number[][] | null {
  const rows = s
    .trim()
    .split(/\n/)
    .map((r) => r.trim().split(/[\s,]+/).map(Number));
  if (rows.length !== 3 || rows.some((r) => r.length !== 3 || r.some((n) => Number.isNaN(n)))) return null;
  return rows;
}

function maskOut(out: number[][], step: number): number[][] {
  return out.map((row, y) =>
    row.map((v, x) => {
      const i = y * (row.length) + x;
      return i <= step ? Math.round(v * 100) / 100 : Number.NaN;
    }),
  );
}

function Grid({ title, data, hi }: { title: string; data: number[][]; hi?: { y: number; x: number } }) {
  return (
    <div>
      <h3>{title}</h3>
      <table style={{ borderCollapse: "collapse", fontFamily: "var(--mono)", fontSize: 13 }}>
        <tbody>
          {data.map((row, y) => (
            <tr key={y}>
              {row.map((v, x) => {
                const on = hi && Math.abs(y - hi.y) <= 1 && Math.abs(x - hi.x) <= 1;
                const center = hi && y === hi.y && x === hi.x;
                return (
                  <td
                    key={x}
                    style={{
                      width: 44,
                      height: 44,
                      textAlign: "center",
                      border: "1px solid var(--line)",
                      background: center ? "rgba(255,92,57,0.35)" : on ? "rgba(126,224,200,0.15)" : "transparent",
                    }}
                  >
                    {Number.isNaN(v) ? "" : v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IouLab() {
  const ping = useLabPing();
  const [a, setA] = useState<Box>([40, 40, 180, 160]);
  const [b, setB] = useState<Box>([120, 80, 260, 220]);
  const v = iou(a, b);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    drawBox(ctx, a, "#7ee0c8");
    drawBox(ctx, b, "#ff5c39");
    const x1 = Math.max(a[0], b[0]);
    const y1 = Math.max(a[1], b[1]);
    const x2 = Math.min(a[2], b[2]);
    const y2 = Math.min(a[3], b[3]);
    if (x2 > x1 && y2 > y1) {
      ctx.fillStyle = "rgba(242,193,78,0.35)";
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
    }
  }, [a, b]);

  return (
    <article className="card lab-stage">
      <canvas ref={canvas} width={480} height={300} />
      <p>
        IoU = <strong>{v.toFixed(3)}</strong>
      </p>
      <BoxSliders label="A mint" box={a} set={setA} />
      <BoxSliders label="B ember" box={b} set={setB} />
      <button className="ghost" type="button" onClick={ping}>
        Log a lab run
      </button>
    </article>
  );
}

function BoxSliders({ label, box, set }: { label: string; box: Box; set: (b: Box) => void }) {
  const keys = ["x1", "y1", "x2", "y2"] as const;
  return (
    <div className="row" style={{ marginTop: 8 }}>
      <span>{label}</span>
      {keys.map((k, i) => (
        <label className="slider" key={k}>
          {k}
          <input
            type="range"
            min={0}
            max={480}
            value={box[i]}
            onChange={(e) => {
              const n = [...box] as Box;
              n[i] = Number(e.target.value);
              set(n);
            }}
          />
        </label>
      ))}
    </div>
  );
}

function drawBox(ctx: CanvasRenderingContext2D, b: Box, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(b[0], b[1], b[2] - b[0], b[3] - b[1]);
}

const NMS_BOXES: Box[] = [
  [30, 40, 180, 160],
  [50, 50, 200, 175],
  [260, 30, 430, 140],
  [280, 50, 420, 160],
  [90, 170, 240, 270],
];
const NMS_SCORES = [0.92, 0.81, 0.77, 0.55, 0.88];

function NmsLab() {
  const ping = useLabPing();
  const [thr, setThr] = useState(0.5);
  const keep = useMemo(() => nms(NMS_BOXES, NMS_SCORES, thr), [thr]);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    NMS_BOXES.forEach((b, i) => {
      const kept = keep.includes(i);
      ctx.globalAlpha = kept ? 1 : 0.25;
      drawBox(ctx, b, kept ? "#7ee0c8" : "#9a9386");
      ctx.fillStyle = "#ece7dc";
      ctx.font = "12px IBM Plex Mono";
      ctx.fillText(`${i} · ${NMS_SCORES[i]}`, b[0] + 6, b[1] + 16);
      ctx.globalAlpha = 1;
    });
  }, [keep]);

  return (
    <article className="card lab-stage">
      <canvas ref={canvas} width={480} height={300} />
      <label className="slider">
        IoU threshold {thr.toFixed(2)}
        <input type="range" min={0.1} max={0.9} step={0.05} value={thr} onChange={(e) => setThr(Number(e.target.value))} />
      </label>
      <p>
        Keep indices: {keep.join(", ")} — raise the threshold and crowded boxes survive.
      </p>
      <button className="ghost" type="button" onClick={ping}>
        Log a lab run
      </button>
    </article>
  );
}

function PinholeLab() {
  const ping = useLabPing();
  const [X, setX] = useState(0.4);
  const [Y, setY] = useState(-0.2);
  const [Z, setZ] = useState(2);
  const [fx, setFx] = useState(400);
  const cx = 240;
  const cy = 150;
  const [u, v] = projectPoint(X, Y, Z, fx, fx, cx, cy);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#1c222b";
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, c.height);
    ctx.moveTo(0, cy);
    ctx.lineTo(c.width, cy);
    ctx.stroke();
    ctx.fillStyle = "#ff5c39";
    ctx.beginPath();
    ctx.arc(u, v, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ece7dc";
    ctx.font = "12px IBM Plex Mono";
    ctx.fillText(`(${u.toFixed(0)}, ${v.toFixed(0)})`, u + 10, v - 10);
  }, [u, v]);

  return (
    <article className="card lab-stage">
      <canvas ref={canvas} width={480} height={300} />
      <div className="row">
        <label className="slider">
          X {X.toFixed(2)}
          <input type="range" min={-1} max={1} step={0.01} value={X} onChange={(e) => setX(Number(e.target.value))} />
        </label>
        <label className="slider">
          Y {Y.toFixed(2)}
          <input type="range" min={-1} max={1} step={0.01} value={Y} onChange={(e) => setY(Number(e.target.value))} />
        </label>
        <label className="slider">
          Z {Z.toFixed(2)}
          <input type="range" min={0.4} max={5} step={0.05} value={Z} onChange={(e) => setZ(Number(e.target.value))} />
        </label>
        <label className="slider">
          fx {fx}
          <input type="range" min={120} max={800} step={10} value={fx} onChange={(e) => setFx(Number(e.target.value))} />
        </label>
      </div>
      <p className="lede">u = fx · X/Z + cx. Closer (small Z) or longer fx both enlarge the image. That is the onsite one-liner.</p>
      <button className="ghost" type="button" onClick={ping}>
        Log a lab run
      </button>
    </article>
  );
}
