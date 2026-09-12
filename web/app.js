const $ = (s) => document.querySelector(s);

document.querySelectorAll("nav button").forEach((b) => {
  b.addEventListener("click", () => {
    document.querySelectorAll("nav button").forEach((x) => x.classList.remove("on"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("show"));
    b.classList.add("on");
    document.getElementById(b.dataset.tab).classList.add("show");
  });
});

document.querySelectorAll("input[type=range]").forEach((el) => {
  const tag = el.parentElement.querySelector(".val");
  const sync = () => {
    if (tag) tag.textContent = el.value;
  };
  el.addEventListener("input", sync);
  sync();
});

function kpis(el, items) {
  el.innerHTML = items
    .map(
      ([label, value]) =>
        `<div class="kpi"><span>${label}</span><b>${value}</b></div>`
    )
    .join("");
}

function money(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

let safeChart, modChart;

async function post(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

$("#safe-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const fd = new FormData(e.target);
    const payload = {
      chemistry: fd.get("chemistry"),
      htc_w_m2k: Number(fd.get("htc_w_m2k")),
      k_contact_w_k: Number(fd.get("k_contact_w_k")),
      trigger_temperature_c: Number(fd.get("trigger_temperature_c")),
      duration_s: 180,
      rows: 4,
      cols: 4,
    };
    const data = await post("/api/simulate/runaway", payload);
    const s = data.sim;
    const ins = data.insurance;
    kpis($("#safe-kpis"), [
      ["Cells failed", `${s.cells_failed} / ${s.cells_total}`],
      ["Peak °C", s.peak_temp_c.toFixed(0)],
      ["Contained", s.contained ? "YES" : "NO"],
      ["Underwriting", ins.underwriting],
      ["Quoted premium", ins.insurable ? money(ins.quoted_premium_usd) : "DECLINE"],
      ["P(cascade)", (ins.p_cascade_given_abuse * 100).toFixed(1) + "%"],
    ]);
    const ctx = $("#safe-chart");
    if (safeChart) safeChart.destroy();
    safeChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: s.time_s.filter((_, i) => i % 8 === 0).map((t) => t.toFixed(0) + "s"),
        datasets: [
          {
            label: "Max cell °C",
            data: s.max_temp_c.filter((_, i) => i % 8 === 0),
            borderColor: "#ff5d6c",
            tension: 0.15,
            pointRadius: 0,
          },
          {
            label: "Mean °C",
            data: s.mean_temp_c.filter((_, i) => i % 8 === 0),
            borderColor: "#f2b544",
            tension: 0.15,
            pointRadius: 0,
          },
        ],
      },
      options: {
        plugins: { legend: { labels: { color: "#8ea0b5" } } },
        scales: {
          x: { ticks: { color: "#8ea0b5", maxTicksLimit: 8 } },
          y: { ticks: { color: "#8ea0b5" } },
        },
      },
    });
    const map = $("#safe-map");
    map.style.gridTemplateColumns = `repeat(${s.cols}, 1fr)`;
    map.innerHTML = s.final_temp_c
      .map((t, i) => {
        const a = s.final_alpha[i];
        const hot = Math.min(1, Math.max(0, (t - 30) / 500));
        const bg = `rgb(${Math.round(40 + 200 * hot)}, ${Math.round(30 + 40 * (1 - hot))}, ${Math.round(40 + 80 * (1 - hot))})`;
        return `<div style="background:${bg}">${t.toFixed(0)}° · α ${a.toFixed(2)}</div>`;
      })
      .join("");
  } catch (err) {
    kpis($("#safe-kpis"), [["Simulation error", String(err)]]);
  }
});

$("#life-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = await post("/api/simulate/aging", {
    temperature_c: Number(fd.get("temperature_c")),
    soc: Number(fd.get("soc")),
    cycles_per_day: Number(fd.get("cycles_per_day")),
    current_soh: 1,
  });
  kpis($("#life-kpis"), [
    ["RUL years", data.rul.rul_years.toFixed(1)],
    ["Fade / year", (data.rul.fade_per_year * 100).toFixed(2) + "%"],
    ["Reserve", money(data.warranty.warranty_reserve_usd)],
    ["Reserve % pack", data.warranty.reserve_pct_of_pack.toFixed(1) + "%"],
    ["Years to 80%", data.warranty.years_to_80pct_soh.toFixed(1)],
    ["15y warranty", data.warranty.passes_15y_energy_warranty ? "PASS" : "FAIL"],
  ]);
});

$("#mod-run").addEventListener("click", async () => {
  const sim = await post("/api/simulate/module", {
    chemistry: "nmc811",
    current_a: 90,
    htc_w_m2k: 22,
    duration_s: 600,
  });
  const ctx = $("#mod-chart");
  if (modChart) modChart.destroy();
  modChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: sim.time_s.filter((_, i) => i % 20 === 0),
      datasets: [
        {
          label: "Hotspot °C",
          data: sim.max_temp_c.filter((_, i) => i % 20 === 0),
          borderColor: "#3ddc97",
          pointRadius: 0,
        },
      ],
    },
    options: { plugins: { legend: { labels: { color: "#8ea0b5" } } } },
  });
});

$("#plant-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = await post("/api/simulate/coating", {
    line_speed_m_min: Number(fd.get("line_speed_m_min")),
    dryer_temp_c: Number(fd.get("dryer_temp_c")),
    slurry_solids_frac: Number(fd.get("slurry_solids_frac")),
    hours: 8,
  });
  kpis($("#plant-kpis"), [
    ["Defect ppm", data.defect_ppm.toFixed(0)],
    ["Scrap", (data.scrap_frac * 100).toFixed(2) + "%"],
    ["OEE", (data.oee * 100).toFixed(1) + "%"],
    ["Good MWh / shift", data.good_mwh_shift.toFixed(2)],
    ["Scrap $", money(data.scrap_cost_usd_shift)],
  ]);
  $("#plant-rec").textContent = data.recommendation;
});

$("#ems-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = await post("/api/simulate/dispatch", {
    spread_usd_per_mwh: Number(fd.get("spread_usd_per_mwh")),
    cycles_per_day: Number(fd.get("cycles_per_day")),
    temperature_c: Number(fd.get("temperature_c")),
  });
  kpis($("#ems-kpis"), [
    ["Cycle?", data.should_cycle ? "YES" : "HOLD"],
    ["Revenue / yr", money(data.annual_spread_revenue_usd)],
    ["Degradation / yr", money(data.annual_degradation_cost_usd)],
    ["Net year-1", money(data.net_1y_usd)],
    ["$/MWh throughput", "$" + data.implied_cost_per_mwh_throughput.toFixed(1)],
  ]);
});

fetch("/api/products")
  .then((r) => r.json())
  .then((rows) => {
    $("#sku-list").innerHTML = rows
      .map(
        (p) => `<div class="sku">
        <div class="price">${p.sku} · ${p.price_note}</div>
        <h3>${p.name}</h3>
        <p>${p.job}</p>
        <p><strong>Buyer:</strong> ${p.buyer}</p>
        <p><strong>Why they pay:</strong> ${p.why_they_pay}</p>
        <p><strong>Payback:</strong> ${p.payback}</p>
      </div>`
      )
      .join("");
  });
