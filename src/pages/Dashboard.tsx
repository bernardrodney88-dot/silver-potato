import { useMemo } from "react";
import { Link } from "react-router-dom";
import { PROBLEMS } from "../data/problems";
import { QUIZZES } from "../data/quizzes";
import { TRACKS } from "../data/tracks";
import { useProgress } from "../progress-context";
import { trackCoverage } from "../store";

function lastDays(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    out.push(x.toISOString().slice(0, 10));
  }
  return out;
}

export function Dashboard() {
  const { progress } = useProgress();
  const days = lastDays(28);
  const qDone = Object.values(progress.quizzes).filter(Boolean).length;
  const featured = PROBLEMS[1] ?? PROBLEMS[0]!;
  const nextQuiz = QUIZZES.find((q) => progress.quizzes[q.id] === undefined) ?? QUIZZES[0]!;

  const heatClass = useMemo(
    () => (iso: string) => {
      const v = progress.heatmap[iso] ?? 0;
      if (v >= 4) return "on3";
      if (v >= 2) return "on2";
      if (v >= 1) return "on1";
      return "";
    },
    [progress.heatmap],
  );

  return (
    <>
      <p className="kicker">Studio</p>
      <h1>Train the fovea. Pass the onsite.</h1>
      <p className="lede">
        A compact gym for computer-vision interviews: implement IoU and NMS, step a convolution, answer detector
        design questions, and sit a timed mock — all in the browser.
      </p>
      <div className="stats">
        <div className="stat">
          <b>{progress.solved.length}</b>
          <span>problems solved / {PROBLEMS.length}</span>
        </div>
        <div className="stat">
          <b>{qDone}</b>
          <span>drills correct / {QUIZZES.length}</span>
        </div>
        <div className="stat">
          <b>{progress.labRuns}</b>
          <span>lab runs</span>
        </div>
        <div className="stat">
          <b>{progress.minutes}</b>
          <span>minutes logged</span>
        </div>
      </div>
      <div className="grid-2">
        <article className="card">
          <h2>Tracks</h2>
          <div className="grid-tracks">
            {TRACKS.map((t) => {
              const c = trackCoverage(progress, t.id);
              const pct = c.problems + c.quizzes === 0 ? 0 : ((c.pDone + c.qDone) / (c.problems + c.quizzes)) * 100;
              return (
                <Link className="track card" key={t.id} to={`/problems?track=${t.id}`} style={{ padding: 14 }}>
                  <div className="meta">
                    <i className="dot" style={{ background: t.color }} />
                    {t.name}
                  </div>
                  <strong>{t.blurb}</strong>
                  <div className="bar">
                    <i style={{ width: `${pct}%`, background: t.color }} />
                  </div>
                  <span className="meta">
                    {c.pDone}/{c.problems} code · {c.qDone}/{c.quizzes} drills
                  </span>
                </Link>
              );
            })}
          </div>
        </article>
        <div>
          <article className="card" style={{ marginBottom: 12 }}>
            <h3>Today&apos;s kernel</h3>
            <p className={`diff ${featured.difficulty}`}>{featured.difficulty}</p>
            <p>
              <Link to={`/problems/${featured.id}`}>
                <strong>{featured.title}</strong>
              </Link>
            </p>
            <p className="lede" style={{ margin: 0 }}>
              {featured.why}
            </p>
          </article>
          <article className="card" style={{ marginBottom: 12 }}>
            <h3>Next drill</h3>
            <p>{nextQuiz.q}</p>
            <Link className="btn" to="/drills">
              Open drills
            </Link>
          </article>
          <article className="card">
            <h3>28-day heat</h3>
            <div className="heat" aria-hidden>
              {days.map((d) => (
                <i key={d} className={heatClass(d)} title={d} />
              ))}
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
