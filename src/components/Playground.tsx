import { useMemo, useState } from "react";
import type { Problem } from "../data/problems";
import { fnNameFromSignature, nearlyEqual, runUserFn } from "../lib/runner";
import { markSolved } from "../store";
import { useProgress } from "../progress-context";

export function Playground({ problem }: { problem: Problem }) {
  const { progress, setProgress } = useProgress();
  const [code, setCode] = useState(problem.starter);
  const [hintN, setHintN] = useState(0);
  const [showPy, setShowPy] = useState(false);
  const [results, setResults] = useState<{ name: string; ok: boolean; got: string }[] | null>(null);
  const name = useMemo(() => fnNameFromSignature(problem.signature), [problem.signature]);
  const solved = progress.solved.includes(problem.id);

  function run() {
    const rows = problem.tests.map((t) => {
      try {
        const got = runUserFn(code, name, t.args);
        const ok = nearlyEqual(got, t.expected);
        return { name: t.name, ok, got: JSON.stringify(got) };
      } catch (e) {
        return { name: t.name, ok: false, got: e instanceof Error ? e.message : String(e) };
      }
    });
    setResults(rows);
    if (rows.every((r) => r.ok)) setProgress(markSolved(problem.id));
  }

  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className="btn ember" onClick={run} type="button">
          Run tests
        </button>
        <button className="ghost" type="button" onClick={() => setHintN((n) => Math.min(n + 1, problem.hints.length))}>
          Hint {hintN}/{problem.hints.length}
        </button>
        <button className="ghost" type="button" onClick={() => setShowPy((v) => !v)}>
          {showPy ? "Hide" : "Show"} Python
        </button>
        {solved && <span className="pass">Solved</span>}
      </div>
      {problem.hints.slice(0, hintN).map((h) => (
        <p className="hint" key={h}>
          {h}
        </p>
      ))}
      <div className="split">
        <textarea className="code" value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false} />
        <div>
          {results && (
            <ul className="plist">
              {results.map((r) => (
                <li key={r.name} className={r.ok ? "pass" : "fail"}>
                  {r.ok ? "pass" : "fail"} · {r.name} → {r.got}
                </li>
              ))}
            </ul>
          )}
          {showPy && <pre>{problem.python}</pre>}
        </div>
      </div>
    </div>
  );
}
