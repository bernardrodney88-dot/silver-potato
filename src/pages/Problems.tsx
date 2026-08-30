import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PROBLEMS } from "../data/problems";
import { TRACKS, type TrackId } from "../data/tracks";
import { useProgress } from "../progress-context";

export function Problems() {
  const { progress } = useProgress();
  const [sp, setSp] = useSearchParams();
  const track = sp.get("track") as TrackId | null;
  const list = useMemo(() => PROBLEMS.filter((p) => !track || p.track === track), [track]);

  return (
    <>
      <p className="kicker">Problem bank</p>
      <h1>Write the kernels they actually ask for.</h1>
      <p className="lede">
        JavaScript in the runner (so tests execute here). Python on the side — that is what you write on the whiteboard.
      </p>
      <div className="toolbar">
        <button className={`chip ${!track ? "on" : ""}`} type="button" onClick={() => setSp({})}>
          All
        </button>
        {TRACKS.map((t) => (
          <button
            key={t.id}
            className={`chip ${track === t.id ? "on" : ""}`}
            type="button"
            onClick={() => setSp({ track: t.id })}
          >
            {t.name}
          </button>
        ))}
      </div>
      <div className="plist">
        {list.map((p) => (
          <Link className="prow" key={p.id} to={`/problems/${p.id}`}>
            <div>
              <strong>{p.title}</strong>
              <div className="meta" style={{ color: "var(--muted)", fontSize: 12 }}>
                {TRACKS.find((t) => t.id === p.track)?.name} · {p.minutes} min
              </div>
            </div>
            <span className={`diff ${p.difficulty}`}>{p.difficulty}</span>
            <span>{progress.solved.includes(p.id) ? "solved" : ""}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
