import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PROBLEMS } from "../data/problems";
import { QUIZZES } from "../data/quizzes";
import { bumpMock } from "../store";
import { useProgress } from "../progress-context";

const SECONDS = 45 * 60;

export function Mock() {
  const { setProgress } = useProgress();
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(SECONDS);
  const seed = useMemo(() => Math.floor(Date.now() / 60000), []);
  const problem = PROBLEMS[seed % PROBLEMS.length]!;
  const drills = useMemo(() => {
    const start = seed % QUIZZES.length;
    return Array.from({ length: 5 }, (_, i) => QUIZZES[(start + i * 3) % QUIZZES.length]!);
  }, [seed]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);

  function finish() {
    setRunning(false);
    setProgress(bumpMock());
  }

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <>
      <p className="kicker">Mock loop</p>
      <h1>Forty-five minutes. One kernel. Five concepts.</h1>
      <p className="lede">
        Talk as you code. After the problem, answer the drills out loud, then check. Log the session when you stop.
      </p>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="timer">
          {mm}:{ss}
        </div>
        <div className="row">
          <button className="btn ember" type="button" onClick={() => setRunning(true)} disabled={running}>
            Start
          </button>
          <button className="ghost" type="button" onClick={() => setRunning(false)}>
            Pause
          </button>
          <button className="ghost" type="button" onClick={() => setLeft(SECONDS)}>
            Reset clock
          </button>
          <button className="btn" type="button" onClick={finish}>
            Log mock
          </button>
        </div>
      </div>
      <article className="card" style={{ marginBottom: 12 }}>
        <h2>Coding</h2>
        <p>
          <Link to={`/problems/${problem.id}`}>{problem.title}</Link> · {problem.difficulty} · {problem.minutes} min suggested
        </p>
        <p>{problem.prompt}</p>
      </article>
      <article className="card">
        <h2>Then explain</h2>
        <ol>
          {drills.map((d) => (
            <li key={d.id} style={{ marginBottom: 10 }}>
              {d.q}
            </li>
          ))}
        </ol>
        <p className="lede">Open Drills after the clock if you want the answer keys — not during.</p>
      </article>
    </>
  );
}
