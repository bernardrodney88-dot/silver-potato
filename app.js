const modalityClass = (modality) => {
  if (modality.includes("Neutral")) return "neutral";
  if (modality.includes("ion")) return "ion";
  if (modality.includes("Super")) return "super";
  return "bosonic";
};

const chartDefaults = () => {
  Chart.defaults.color = "#8b97ab";
  Chart.defaults.borderColor = "rgba(180, 210, 255, 0.12)";
  Chart.defaults.font.family = "'IBM Plex Sans', sans-serif";
};

const renderKpis = () => {
  const root = document.getElementById("kpis");
  root.innerHTML = QC_DATA.kpis
    .map(
      (k) => `
      <article class="kpi">
        <p class="label">${k.label}</p>
        <p class="value">${k.value}</p>
        <p class="detail">${k.detail}</p>
      </article>`
    )
    .join("");
};

const renderLeaderboard = (modality = "All") => {
  const rows = QC_DATA.leaderboard.filter(
    (row) => modality === "All" || row.modality === modality
  );
  const body = document.getElementById("leaderboardBody");
  body.innerHTML = rows
    .map(
      (row) => `
      <tr>
        <td class="rank">${row.rank}</td>
        <td>
          <span class="company">${row.company}</span>
          <span class="system">${row.system}</span>
        </td>
        <td>${row.logical}</td>
        <td>${row.physical.toLocaleString()}</td>
        <td>${row.ratio}:1</td>
        <td>${row.qec}</td>
        <td><span class="pill ${modalityClass(row.modality)}">${row.modality}</span></td>
        <td>${row.when}</td>
      </tr>`
    )
    .join("");
};

const renderFilters = () => {
  const modalities = ["All", ...new Set(QC_DATA.leaderboard.map((r) => r.modality))];
  const root = document.getElementById("modalityFilters");
  root.innerHTML = modalities
    .map(
      (m, i) =>
        `<button class="filter-btn${i === 0 ? " active" : ""}" data-modality="${m}" type="button">${m}</button>`
    )
    .join("");
  root.addEventListener("click", (event) => {
    const btn = event.target.closest("button");
    if (!btn) return;
    root.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderLeaderboard(btn.dataset.modality);
  });
};

const renderHardware = () => {
  document.getElementById("hardwareCards").innerHTML = QC_DATA.hardware
    .map(
      (h) => `
      <article class="hw-card">
        <span class="pill ${modalityClass(h.modality)}">${h.modality}</span>
        <h4>${h.company} · ${h.system}</h4>
        <p class="headline">${h.headline}</p>
        <ul class="hw-stats">
          ${h.stats
            .map(([k, v]) => `<li><span>${k}</span><span>${v}</span></li>`)
            .join("")}
        </ul>
        <p class="note">${h.note}</p>
      </article>`
    )
    .join("");
};

const renderEras = () => {
  document.getElementById("eraList").innerHTML = QC_DATA.eras
    .map(
      (e) => `
      <li>
        <span class="meta">${e.range} · ${e.status}</span>
        <strong>${e.name}</strong>
        <p>${e.text}</p>
      </li>`
    )
    .join("");
};

const renderTimeline = (era = "All") => {
  const items = QC_DATA.timeline.filter((t) => era === "All" || t.era === era);
  document.getElementById("timelineList").innerHTML = items
    .map(
      (t) => `
      <li>
        <div class="year">${t.year}</div>
        <div>
          <h4>${t.title}</h4>
          <p>${t.era} · ${t.text}</p>
        </div>
      </li>`
    )
    .join("");
};

const renderEraFilters = () => {
  const eras = ["All", ...new Set(QC_DATA.timeline.map((t) => t.era))];
  const root = document.getElementById("eraFilters");
  root.innerHTML = eras
    .map(
      (e, i) =>
        `<button class="filter-btn${i === 0 ? " active" : ""}" data-era="${e}" type="button">${e}</button>`
    )
    .join("");
  root.addEventListener("click", (event) => {
    const btn = event.target.closest("button");
    if (!btn) return;
    root.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderTimeline(btn.dataset.era);
  });
};

const renderRoadmap = () => {
  document.getElementById("roadmapTrack").innerHTML = QC_DATA.roadmap
    .map(
      (r) => `
      <article class="road-card">
        <div class="when">${r.when}</div>
        <h4>${r.who}</h4>
        <p>${r.what}</p>
      </article>`
    )
    .join("");
};

const renderApps = () => {
  document.getElementById("appsList").innerHTML = QC_DATA.applications
    .map(
      (a) => `
      <article class="app">
        <div class="app-top">
          <h4>${a.name}</h4>
          <span class="pill">${a.status}</span>
        </div>
        <div class="bar" aria-label="Readiness ${a.score} percent">
          <span style="width:${a.score}%"></span>
        </div>
        <p>${a.text}</p>
      </article>`
    )
    .join("");
};

const makeCharts = () => {
  chartDefaults();

  new Chart(document.getElementById("logicalRaceChart"), {
    type: "line",
    data: {
      labels: QC_DATA.logicalRace.labels,
      datasets: QC_DATA.logicalRace.series.map((s) => ({
        label: s.label,
        data: s.data,
        borderColor: s.color,
        backgroundColor: s.color,
        spanGaps: true,
        tension: 0.25,
        pointRadius: 4,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Verified logical qubits" },
        },
      },
    },
  });

  const sorted = [...QC_DATA.leaderboard].sort((a, b) => a.ratio - b.ratio);
  new Chart(document.getElementById("ratioChart"), {
    type: "bar",
    data: {
      labels: sorted.map((r) => r.company.split(" ")[0]),
      datasets: [
        {
          label: "Physical / logical",
          data: sorted.map((r) => r.ratio),
          backgroundColor: sorted.map((r) => {
            if (r.modality.includes("Neutral")) return "#7CFFB2";
            if (r.modality.includes("ion")) return "#6EE7FF";
            if (r.modality.includes("Super")) return "#FF7AD9";
            return "#FFD166";
          }),
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: "Overhead (×)" } },
      },
    },
  });

  const mix = QC_DATA.leaderboard.reduce((acc, row) => {
    acc[row.modality] = (acc[row.modality] || 0) + 1;
    return acc;
  }, {});
  new Chart(document.getElementById("modalityChart"), {
    type: "doughnut",
    data: {
      labels: Object.keys(mix),
      datasets: [
        {
          data: Object.values(mix),
          backgroundColor: ["#7CFFB2", "#6EE7FF", "#FF7AD9", "#FFD166"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
      cutout: "58%",
    },
  });

  new Chart(document.getElementById("fidelityChart"), {
    type: "bar",
    data: {
      labels: QC_DATA.fidelity.map((f) => f.label),
      datasets: [
        {
          label: "Two-qubit fidelity %",
          data: QC_DATA.fidelity.map((f) => f.value),
          backgroundColor: "#6EE7FF",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 98.5, max: 100 },
      },
    },
  });
};

renderKpis();
renderFilters();
renderLeaderboard();
renderHardware();
renderEras();
renderEraFilters();
renderTimeline();
renderRoadmap();
renderApps();
makeCharts();
