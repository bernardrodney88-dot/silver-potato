"""1-D plug-flow physics for VayuCell-1000.

This is an engineering reduced-order model, not a full plasma-chemistry
solver (those use 100+ species). It is meant to show *why* the three stages
are ordered as they are, and how Mumbai humidity changes the result.

Stages along x:
  0–0.25 m   demister (particles only, weak)
  0.25–1.15 m WESP (Deutsch–Anderson)
  1.15–1.65 m DBD plasma (lumped OH / O3 / NOx / VOC)
  1.65–1.95 m Mn–Ce catalyst (first-order O3 and VOC sink)
"""

from __future__ import annotations

import csv
import math
from dataclasses import dataclass, field
from pathlib import Path

from vayucell.sizing import (
    CATALYST_LENGTH_M,
    DUCT_H_M,
    DUCT_W_M,
    NOMINAL_FLOW_M3H,
    PLASMA_LENGTH_M,
    PLASMA_POWER_W,
    WESP_LENGTH_M,
    specific_energy_j_per_l,
    velocity_m_s,
)

# --- Geometry ---
DEMISTER_M = 0.25
X_DEMISTER = DEMISTER_M
X_WESP = X_DEMISTER + WESP_LENGTH_M
X_PLASMA = X_WESP + PLASMA_LENGTH_M
X_CATALYST = X_PLASMA + CATALYST_LENGTH_M
TOTAL_M = X_CATALYST

# Air at 30 °C, 1 atm
MU_AIR = 1.87e-5  # Pa·s
LAMBDA_M = 6.8e-8  # mean free path
RHO_P = 1500.0  # kg/m³ urban aerosol
K_B = 1.381e-23
T_K = 303.15
E_CHARGE = 1.602e-19
EPS0 = 8.854e-12
E_FIELD = 8.0e5  # V/m (40 kV across ~50 mm plate pitch)
N_PLATES = 8
PLATE_H = 0.40
PLATE_L = WESP_LENGTH_M
# Collection area: both sides of interior plates ~ 2*(N-1)*H*L
A_COLLECT_M2 = 2.0 * (N_PLATES - 1) * PLATE_H * PLATE_L

# Gas-phase rates at ~300 K, converted to ppb⁻¹ s⁻¹
# Base literature (cm³ molecule⁻¹ s⁻¹) × (2.46e10 molecules cm⁻³ / ppb)
# 1 ppb = 2.46e10 molec/cm³ at 1 atm, 298 K (use 2.4e10 at 303 K)
MOLEC_PER_PPB = 2.4e10


def _k_ppb(k_cm3: float) -> float:
    return k_cm3 * MOLEC_PER_PPB


K_NO_O3 = _k_ppb(1.8e-14)  # NO + O3 → NO2
K_NO_OH = _k_ppb(1.0e-11)  # effective NO + OH (+M) → HONO
K_NO2_OH = _k_ppb(1.0e-11)
K_VOC_OH = _k_ppb(5.0e-12)  # toluene-like
K_O3_OH = _k_ppb(7.0e-14)
K_OH_WALL = 5.0e4  # s⁻¹ (OH lives microseconds; volume-average is tiny)
# Bulk NO+O3 is *slow* (minutes). In 0.29 s the discharge itself does the work:
K_PLASMA_NO = 3.5  # s⁻¹ effective (O / e⁻ / OH in filaments)
K_PLASMA_VOC = 1.2  # s⁻¹ effective oxidation / fragmentation

# NTP byproduct yields in *humid process air* (not an ozone generator).
# ~1–5 g O₃ / kWh → ~10¹⁵–10¹⁶ molec/J mixed into the process flow.
G_O3_DRY = 8.0e15  # molec / J
G_OH_DRY = 4.0e15
G_O3_WET_FACTOR = 0.45  # at 80% RH vs dry
G_OH_WET_FACTOR = 3.0

# Catalyst first-order rates (s⁻¹) at honeycomb face velocity ~1.7 m/s
K_CAT_O3 = 45.0
K_CAT_VOC = 4.0
K_CAT_NO2 = 1.2

# Wet-film absorption of NO2 in WESP (s⁻¹), alkaline liquor
K_WESP_NO2 = 0.35
K_DEMISTER_PM = 0.25  # s⁻¹ weak inertial


@dataclass
class Gas:
    no_ppb: float
    no2_ppb: float
    voc_ppb: float
    o3_ppb: float
    oh_ppb: float = 0.0


@dataclass
class SimConfig:
    flow_m3h: float = NOMINAL_FLOW_M3H
    plasma_w: float = PLASMA_POWER_W
    rh_pct: float = 75.0
    wesp_on: bool = True
    plasma_on: bool = True
    catalyst_on: bool = True
    n_steps: int = 400
    pm25_in_ugm3: float = 150.0
    no_ppb: float = 40.0
    no2_ppb: float = 80.0
    voc_ppb: float = 300.0
    o3_ppb: float = 20.0


@dataclass
class Slice:
    x_m: float
    stage: str
    pm25: float
    no: float
    no2: float
    voc: float
    o3: float
    oh_ppt: float  # ppt for plotting (OH is tiny)


@dataclass
class SimResult:
    slices: list[Slice]
    dp_pm: list[tuple[float, float, float]]  # d_um, eta, remaining_frac
    inlet: dict[str, float]
    outlet: dict[str, float]
    notes: list[str] = field(default_factory=list)


def cunningham(d_m: float) -> float:
    kn = 2.0 * LAMBDA_M / d_m
    return 1.0 + kn * (1.257 + 0.4 * math.exp(-1.1 / kn)) if kn > 0 else 1.0


def charge_coulomb(d_m: float, e_field: float = E_FIELD) -> float:
    """Saturation field charging (white) + diffusion floor for ultrafines."""
    # Field: q = 3π ε0 d² E  (εp >> 1)
    q_field = 3.0 * math.pi * EPS0 * d_m * d_m * e_field
    # Diffusion charging (order-of-magnitude, 0.5 s residence)
    n_ion = 1e14  # m⁻³
    q_diff = d_m * 4.0 * math.pi * EPS0 * (K_B * T_K / E_CHARGE) * math.log(
        1.0 + d_m * n_ion * 1e-4 + 1e-12
    )
    q_diff = max(q_diff, E_CHARGE)
    return max(q_field, q_diff)


def migration_velocity(d_m: float, e_field: float = E_FIELD) -> float:
    """Stokes–Cunningham drift w = q E Cc / (3 π μ d)."""
    q = charge_coulomb(d_m, e_field)
    cc = cunningham(d_m)
    denom = 3.0 * math.pi * MU_AIR * d_m
    return (q * e_field * cc) / denom


def deutsch_eta(d_m: float, q_m3s: float, wesp_on: bool = True) -> float:
    """η = 1 − exp(−w A / Q)."""
    if not wesp_on or q_m3s <= 0:
        return 0.0
    w = migration_velocity(d_m)
    eta = 1.0 - math.exp(-w * A_COLLECT_M2 / q_m3s)
    return eta * 0.92  # 8% sneakage / maldistribution


def lognormal_weights(d_um: list[float], gmd_um: float = 0.25, gsd: float = 2.2) -> list[float]:
    """Mass weights for PM2.5-like distribution (truncated)."""
    ln_g = math.log(gsd)
    w = []
    for d in d_um:
        if d <= 0:
            w.append(0.0)
            continue
        x = (math.log(d) - math.log(gmd_um)) / ln_g
        w.append(math.exp(-0.5 * x * x) / d)
    s = sum(w)
    return [wi / s for wi in w]


def rh_factors(rh_pct: float) -> tuple[float, float, float]:
    """Return (g_o3_scale, g_oh_scale, wesp_boost). Linear 20–90% RH."""
    x = min(max(rh_pct, 20.0), 95.0)
    t = (x - 20.0) / 70.0
    g_o3 = 1.0 * (1.0 - t) + G_O3_WET_FACTOR * t
    g_oh = 1.0 * (1.0 - t) + G_OH_WET_FACTOR * t
    wesp = 1.0 + 0.25 * t  # extra droplet charging
    return g_o3, g_oh, wesp


def stage_at(x: float) -> str:
    if x < X_DEMISTER:
        return "demister"
    if x < X_WESP:
        return "wesp"
    if x < X_PLASMA:
        return "plasma"
    if x < X_CATALYST:
        return "catalyst"
    return "outlet"


def oh_steady(gas: Gas, g_oh_ppb_s: float) -> float:
    sink = (
        K_OH_WALL
        + K_VOC_OH * gas.voc_ppb
        + K_NO_OH * gas.no_ppb
        + K_NO2_OH * gas.no2_ppb
        + K_O3_OH * gas.o3_ppb
    )
    if sink <= 0:
        return 0.0
    return g_oh_ppb_s / sink


def simulate(cfg: SimConfig | None = None) -> SimResult:
    cfg = cfg or SimConfig()
    u = velocity_m_s(cfg.flow_m3h)
    q_m3s = cfg.flow_m3h / 3600.0
    dx = TOTAL_M / cfg.n_steps
    dt = dx / u
    g_o3_s, g_oh_s, wesp_boost = rh_factors(cfg.rh_pct)

    # Plasma volumetric production in ppb/s
    # molecules/s = G * Power; divide by flow * molec_per_m3
    # 1 m³ of air ≈ 2.4e25 molec; 1 ppb of 1 m³ = 2.4e16 molec
    plasma_vol = DUCT_W_M * DUCT_H_M * PLASMA_LENGTH_M
    power = cfg.plasma_w if cfg.plasma_on else 0.0
    # production in the plasma volume: (G * P / V) molec m⁻³ s⁻¹
    molec_m3_per_ppb = MOLEC_PER_PPB * 1e6  # cm³ → m³ : 1e6 cm³/m³? 
    # 1 ppb = 2.4e10 molec/cm³ = 2.4e16 molec/m³
    molec_per_m3_per_ppb = MOLEC_PER_PPB * 1e6

    def prod_ppb_s(g_molec_per_j: float) -> float:
        if plasma_vol <= 0 or power <= 0:
            return 0.0
        return (g_molec_per_j * power / plasma_vol) / molec_per_m3_per_ppb

    p_o3 = prod_ppb_s(G_O3_DRY * g_o3_s)
    p_oh = prod_ppb_s(G_OH_DRY * g_oh_s)

    # Particle bins (µm)
    d_um = [0.03 * (10 ** (i / 8)) for i in range(0, 21)]  # 0.03–~3 µm
    weights = lognormal_weights(d_um)
    etas = []
    for d in d_um:
        eta = deutsch_eta(d * 1e-6, q_m3s, cfg.wesp_on)
        # humidity boost on w → 1-exp(-boost * ...)
        if cfg.wesp_on:
            w = migration_velocity(d * 1e-6) * wesp_boost
            eta = 1.0 - math.exp(-w * A_COLLECT_M2 / q_m3s)
            eta *= 0.92  # 8% sneakage / maldistribution
        etas.append(eta)
    pm_remain_frac = sum(w * (1.0 - e) for w, e in zip(weights, etas))
    # apply demister as extra 8%
    pm_remain_frac *= math.exp(-K_DEMISTER_PM * DEMISTER_M / u)

    gas = Gas(cfg.no_ppb, cfg.no2_ppb, cfg.voc_ppb, cfg.o3_ppb)
    pm = cfg.pm25_in_ugm3
    slices: list[Slice] = []
    notes = [
        f"u={u:.2f} m/s, SED={specific_energy_j_per_l(cfg.plasma_w, cfg.flow_m3h):.2f} J/L",
        f"RH={cfg.rh_pct:.0f}%, O3 yield scale={g_o3_s:.2f}, OH yield scale={g_oh_s:.2f}",
        f"WESP A={A_COLLECT_M2:.2f} m², Deutsch mass remaining={pm_remain_frac:.3f}",
    ]

    # March in x; PM is applied as a continuous Deutsch sink in WESP
    for i in range(cfg.n_steps + 1):
        x = i * dx
        st = stage_at(x)
        slices.append(
            Slice(x, st, pm, gas.no_ppb, gas.no2_ppb, gas.voc_ppb, gas.o3_ppb, gas.oh_ppb * 1000.0)
        )
        if i == cfg.n_steps:
            break

        # PM: exponential sink in WESP only
        if st == "demister":
            pm *= math.exp(-K_DEMISTER_PM * dt)
        elif st == "wesp":
            # map overall Deutsch to a uniform k such that exp(-k t_wesp) = remain
            t_wesp = WESP_LENGTH_M / u
            k_pm = -math.log(max(pm_remain_frac, 1e-9)) / t_wesp
            pm *= math.exp(-k_pm * dt)
            if cfg.wesp_on:
                absorbed = K_WESP_NO2 * gas.no2_ppb * dt
                gas.no2_ppb = max(0.0, gas.no2_ppb - absorbed)

        if st == "plasma" and cfg.plasma_on:
            gas.oh_ppb = oh_steady(gas, p_oh)
            gas.o3_ppb += p_o3 * dt
            # Filament-effective oxidation (bulk NO+O3 is too slow for 0.29 s)
            d_no = min(gas.no_ppb, K_PLASMA_NO * gas.no_ppb * dt)
            d_no += min(gas.no_ppb, (K_NO_O3 * gas.no_ppb * gas.o3_ppb + K_NO_OH * gas.no_ppb * gas.oh_ppb) * dt)
            d_no = min(d_no, gas.no_ppb)
            gas.no_ppb -= d_no
            gas.no2_ppb += d_no
            gas.voc_ppb = max(0.0, gas.voc_ppb * math.exp(-K_PLASMA_VOC * dt))
            d_voc_oh = K_VOC_OH * gas.voc_ppb * gas.oh_ppb * dt
            gas.voc_ppb = max(0.0, gas.voc_ppb - d_voc_oh)
            gas.o3_ppb = max(
                0.0,
                gas.o3_ppb
                - K_NO_O3 * gas.no_ppb * gas.o3_ppb * dt
                - K_O3_OH * gas.oh_ppb * gas.o3_ppb * dt,
            )
        else:
            gas.oh_ppb *= math.exp(-K_OH_WALL * dt)

        if st == "catalyst" and cfg.catalyst_on:
            gas.o3_ppb *= math.exp(-K_CAT_O3 * dt)
            gas.voc_ppb *= math.exp(-K_CAT_VOC * dt)
            gas.no2_ppb *= math.exp(-K_CAT_NO2 * dt)
            gas.oh_ppb *= math.exp(-K_OH_WALL * dt)

    inlet = {
        "pm25": cfg.pm25_in_ugm3,
        "no": cfg.no_ppb,
        "no2": cfg.no2_ppb,
        "nox": cfg.no_ppb + cfg.no2_ppb,
        "voc": cfg.voc_ppb,
        "o3": cfg.o3_ppb,
    }
    last = slices[-1]
    outlet = {
        "pm25": last.pm25,
        "no": last.no,
        "no2": last.no2,
        "nox": last.no + last.no2,
        "voc": last.voc,
        "o3": last.o3,
    }
    dp = [(d, e, 1.0 - e) for d, e in zip(d_um, etas)]
    return SimResult(slices, dp, inlet, outlet, notes)


def peak_o3_in_plasma(r: SimResult) -> float:
    return max((s.o3 for s in r.slices if s.stage == "plasma"), default=0.0)


def reduction(inlet: float, outlet: float) -> float:
    if inlet <= 0:
        return 0.0
    return 100.0 * (1.0 - outlet / inlet)


def text_report(r: SimResult) -> str:
    lines = ["VayuCell 1-D physics simulation", *[f"  {n}" for n in r.notes], ""]
    lines.append(f"{'species':<10} {'in':>10} {'out':>10} {'reduction':>12}")
    for key, unit in (
        ("pm25", "µg/m³"),
        ("no", "ppb"),
        ("no2", "ppb"),
        ("nox", "ppb"),
        ("voc", "ppb"),
        ("o3", "ppb"),
    ):
        a, b = r.inlet[key], r.outlet[key]
        lines.append(f"  {key:<8} {a:10.2f} {b:10.2f} {reduction(a, b):10.1f} %   {unit}")
    return "\n".join(lines)


def write_csv(r: SimResult, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["x_m", "stage", "pm25_ugm3", "no_ppb", "no2_ppb", "voc_ppb", "o3_ppb", "oh_ppt"])
        for s in r.slices:
            w.writerow(
                [
                    f"{s.x_m:.4f}",
                    s.stage,
                    f"{s.pm25:.4f}",
                    f"{s.no:.4f}",
                    f"{s.no2:.4f}",
                    f"{s.voc:.4f}",
                    f"{s.o3:.4f}",
                    f"{s.oh_ppt:.4f}",
                ]
            )


def write_svg(r: SimResult, path: Path, title: str = "VayuCell axial profiles") -> None:
    """Tiny SVG plotter (no matplotlib required)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    w, h, l, t, rgt, btm = 900, 420, 70, 40, 30, 50
    xs = [s.x_m for s in r.slices]
    series = {
        "PM2.5 µg/m³": [s.pm25 for s in r.slices],
        "NO₂ ppb": [s.no2 for s in r.slices],
        "VOC ppb": [s.voc for s in r.slices],
        "O₃ ppb": [s.o3 for s in r.slices],
    }
    colors = ["#1d4ed8", "#b45309", "#047857", "#be123c"]
    xmax = max(xs) or 1
    ymax = max(max(v) for v in series.values()) * 1.15 or 1

    def X(x: float) -> float:
        return l + (x / xmax) * (w - l - rgt)

    def Y(y: float) -> float:
        return t + (1.0 - y / ymax) * (h - t - btm)

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" font-family="sans-serif">',
        '<rect width="100%" height="100%" fill="#fff"/>',
        f'<text x="{w/2}" y="24" text-anchor="middle" font-size="16">{title}</text>',
        f'<line x1="{l}" y1="{h-btm}" x2="{w-rgt}" y2="{h-btm}" stroke="#111"/>',
        f'<line x1="{l}" y1="{t}" x2="{l}" y2="{h-btm}" stroke="#111"/>',
        f'<text x="{w/2}" y="{h-12}" text-anchor="middle" font-size="12">distance along duct x (m)</text>',
    ]
    # stage bands
    bands = [
        (0, X_DEMISTER, "#e5e7eb", "demister"),
        (X_DEMISTER, X_WESP, "#dbeafe", "WESP"),
        (X_WESP, X_PLASMA, "#fef3c7", "plasma"),
        (X_PLASMA, X_CATALYST, "#d1fae5", "catalyst"),
    ]
    for x0, x1, fill, _name in bands:
        parts.append(
            f'<rect x="{X(x0)}" y="{t}" width="{X(x1)-X(x0)}" height="{h-t-btm}" fill="{fill}" opacity="0.7"/>'
        )
        parts.append(
            f'<text x="{(X(x0)+X(x1))/2}" y="{t+14}" text-anchor="middle" font-size="11">{_name}</text>'
        )
    for (name, ys), col in zip(series.items(), colors):
        pts = " ".join(f"{X(x):.1f},{Y(y):.1f}" for x, y in zip(xs, ys))
        parts.append(f'<polyline fill="none" stroke="{col}" stroke-width="2" points="{pts}"/>')
    # legend
    lx = l + 8
    ly = h - btm - 8
    for i, (name, col) in enumerate(zip(series, colors)):
        parts.append(f'<rect x="{lx+i*160}" y="{ly-12}" width="12" height="12" fill="{col}"/>')
        parts.append(f'<text x="{lx+i*160+16}" y="{ly}" font-size="11">{name}</text>')
    parts.append(f'<text x="12" y="{t+10}" font-size="11" transform="rotate(-90 14 {t+120})">concentration</text>')
    parts.append("</svg>")
    path.write_text("\n".join(parts), encoding="utf-8")


def _write_deutsch_svg(r: SimResult, path: Path) -> None:
    w, h, l, t, rgt, btm = 720, 360, 60, 36, 24, 48
    ds = [p[0] for p in r.dp_pm]
    et = [p[1] * 100.0 for p in r.dp_pm]
    dmin, dmax = math.log(min(ds)), math.log(max(ds))
    ymax = 100.0

    def X(d: float) -> float:
        return l + (math.log(d) - dmin) / (dmax - dmin) * (w - l - rgt)

    def Y(y: float) -> float:
        return t + (1.0 - y / ymax) * (h - t - btm)

    pts = " ".join(f"{X(d):.1f},{Y(y):.1f}" for d, y in zip(ds, et))
    path.write_text(
        "\n".join(
            [
                f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" font-family="sans-serif">',
                '<rect width="100%" height="100%" fill="#fff"/>',
                '<text x="360" y="24" text-anchor="middle" font-size="16">Deutsch–Anderson η(d) — WESP</text>',
                f'<line x1="{l}" y1="{h-btm}" x2="{w-rgt}" y2="{h-btm}" stroke="#111"/>',
                f'<line x1="{l}" y1="{t}" x2="{l}" y2="{h-btm}" stroke="#111"/>',
                f'<polyline fill="none" stroke="#1d4ed8" stroke-width="2.5" points="{pts}"/>',
                f'<text x="{w/2}" y="{h-12}" text-anchor="middle" font-size="12">particle diameter (µm, log)</text>',
                f'<text x="16" y="{t+80}" font-size="12" transform="rotate(-90 16 {t+120})">η (%)</text>',
                "</svg>",
            ]
        ),
        encoding="utf-8",
    )


def run_campaign(out_dir: Path) -> dict[str, SimResult]:
    out_dir.mkdir(parents=True, exist_ok=True)
    cases = {
        "mumbai_nominal": SimConfig(rh_pct=75.0),
        "dry_air": SimConfig(rh_pct=25.0),
        "plasma_off": SimConfig(plasma_on=False),
        "catalyst_fail": SimConfig(catalyst_on=False),
        "wesp_off": SimConfig(wesp_on=False),
    }
    results = {}
    for name, cfg in cases.items():
        r = simulate(cfg)
        results[name] = r
        write_csv(r, out_dir / f"{name}.csv")
        write_svg(r, out_dir / f"{name}.svg", title=f"VayuCell — {name}")
    # Deutsch curve
    r0 = results["mumbai_nominal"]
    with (out_dir / "deutsch_eta.csv").open("w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["d_um", "eta", "penetrating"])
        for d, e, p in r0.dp_pm:
            w.writerow([f"{d:.4f}", f"{e:.5f}", f"{p:.5f}"])
    _write_deutsch_svg(r0, out_dir / "deutsch_eta.svg")
    (out_dir / "summary.txt").write_text(
        "\n\n".join(f"=== {k} ===\n{text_report(v)}" for k, v in results.items()),
        encoding="utf-8",
    )
    return results


def main() -> None:
    out = Path("sim_output")
    results = run_campaign(out)
    print(text_report(results["mumbai_nominal"]))
    print(f"\nWrote {out}/ (CSV + SVG). Catalyst-fail O3 out="
          f"{results['catalyst_fail'].outlet['o3']:.1f} ppb")


if __name__ == "__main__":
    main()
