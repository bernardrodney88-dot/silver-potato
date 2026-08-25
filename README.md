# Quantum Progress Observatory

A static dashboard of **quantum computing progress** as of August 2026: verified logical qubits, hardware platforms, error-correction milestones, public roadmaps, and application readiness.

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 4173
```

Then visit [http://localhost:4173](http://localhost:4173).

## What it shows

- KPI strip (top logical count, encoding ratio, peak two-qubit fidelity, below-threshold QEC)
- Logical-qubit race chart and encoding-overhead comparison
- Filterable verified leaderboard and hardware cards
- Timeline, 2026–2033 roadmap, and application readiness bars

## Data notes

Counts are compiled from public announcements and secondary trackers (for example Nature papers, company hardware posts, Quantum Zeitgeist logical-qubit leaderboard, entangledfuture timeline). Secondary sources can lag or disagree. This is an observatory snapshot, not a metrology standard.
