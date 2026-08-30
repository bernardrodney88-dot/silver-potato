import { Link, useParams } from "react-router-dom";
import { Playground } from "../components/Playground";
import { problemById } from "../data/problems";
import { TRACKS } from "../data/tracks";

export function ProblemDetail() {
  const { id } = useParams();
  const p = id ? problemById(id) : undefined;
  if (!p) {
    return (
      <p>
        Unknown problem. <Link to="/problems">Back</Link>
      </p>
    );
  }
  const track = TRACKS.find((t) => t.id === p.track);
  return (
    <>
      <p className="kicker">{track?.name}</p>
      <h1>{p.title}</h1>
      <p className={`diff ${p.difficulty}`}>
        {p.difficulty} · {p.minutes} min · {p.signature}
      </p>
      <p className="lede">{p.prompt}</p>
      <article className="card" style={{ marginBottom: 16 }}>
        <h3>Why this shows up</h3>
        <p style={{ margin: 0, color: "var(--muted)" }}>{p.why}</p>
      </article>
      <Playground problem={p} />
    </>
  );
}
