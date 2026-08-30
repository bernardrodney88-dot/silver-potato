import { SHEETS } from "../data/sheets";

export function Sheets() {
  return (
    <>
      <p className="kicker">Pocket cards</p>
      <h1>Formulas you should be able to derive, not recite.</h1>
      <p className="lede">Keep these in working memory for the last five minutes before a loop.</p>
      <div className="grid-2">
        {SHEETS.map((s) => (
          <article className="card" key={s.id}>
            <h2>{s.title}</h2>
            {s.blocks.map((b) => (
              <div key={b.h}>
                <h3>{b.h}</h3>
                <pre>{b.body}</pre>
              </div>
            ))}
          </article>
        ))}
      </div>
    </>
  );
}
