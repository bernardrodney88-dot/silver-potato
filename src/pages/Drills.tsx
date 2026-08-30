import { useMemo, useState } from "react";
import { QUIZZES } from "../data/quizzes";
import { TRACKS, type TrackId } from "../data/tracks";
import { useProgress } from "../progress-context";
import { markQuiz } from "../store";

export function Drills() {
  const { progress, setProgress } = useProgress();
  const [track, setTrack] = useState<TrackId | "all">("all");
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const list = useMemo(() => QUIZZES.filter((q) => track === "all" || q.track === track), [track]);
  const q = list[idx % Math.max(list.length, 1)];

  if (!q) return <p>No drills in this track yet.</p>;

  function choose(id: string) {
    if (!q) return;
    setPicked(id);
    const ok = q.choices.find((c) => c.id === id)?.ok ?? false;
    setProgress(markQuiz(q.id, ok));
  }

  function next() {
    setPicked(null);
    setIdx((i) => i + 1);
  }

  return (
    <>
      <p className="kicker">Concept drills</p>
      <h1>Say it out loud, then lock it in.</h1>
      <p className="lede">Short multiple-choice with the explanation you should give the interviewer — not a trivia key.</p>
      <div className="toolbar">
        <button className={`chip ${track === "all" ? "on" : ""}`} type="button" onClick={() => { setTrack("all"); setIdx(0); setPicked(null); }}>
          All
        </button>
        {TRACKS.map((t) => (
          <button
            key={t.id}
            className={`chip ${track === t.id ? "on" : ""}`}
            type="button"
            onClick={() => {
              setTrack(t.id);
              setIdx(0);
              setPicked(null);
            }}
          >
            {t.name}
          </button>
        ))}
      </div>
      <article className="card quiz">
        <p className="meta" style={{ color: "var(--muted)", fontSize: 12 }}>
          {idx % list.length + 1} / {list.length} · {TRACKS.find((t) => t.id === q.track)?.name}
          {progress.quizzes[q.id] != null && (progress.quizzes[q.id] ? " · previously correct" : " · review")}
        </p>
        <h2>{q.q}</h2>
        {q.choices.map((c) => {
          let cls = "choice";
          if (picked) {
            if (c.ok) cls += " good";
            else if (c.id === picked) cls += " bad";
          }
          return (
            <button key={c.id} className={cls} type="button" onClick={() => choose(c.id)} disabled={!!picked}>
              {c.text}
            </button>
          );
        })}
        {picked && (
          <>
            <p className="hint">{q.explain}</p>
            <button className="btn ember" type="button" onClick={next}>
              Next
            </button>
          </>
        )}
      </article>
    </>
  );
}
