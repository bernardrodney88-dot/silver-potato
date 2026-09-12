"""Module electro-thermal cycling for heat maps and cooling design."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from helios.physics.aging import AgingParams, capacity_fade_rate
from helios.physics.ecm import CHEMISTRY_PRESETS, CellParams, equivalent_circuit_heat


@dataclass(frozen=True)
class ModuleSpec:
    rows: int = 4
    cols: int = 4
    chemistry: str = "nmc811"
    ambient_c: float = 25.0
    htc_w_m2k: float = 25.0
    k_contact_w_k: float = 0.8
    current_a: float = 75.0
    duration_s: float = 1800.0
    dt_s: float = 1.0
    initial_soc: float = 0.85


def simulate_module(spec: ModuleSpec | None = None) -> dict:
    spec = spec or ModuleSpec()
    cell: CellParams = CHEMISTRY_PRESETS[spec.chemistry]
    n = spec.rows * spec.cols
    t_k = np.full(n, spec.ambient_c + 273.15)
    soc = np.full(n, spec.initial_soc)
    i1 = np.zeros(n)
    fade = np.zeros(n)
    steps = int(spec.duration_s / spec.dt_s)
    t_hist = np.zeros((steps + 1, n))
    t_hist[0] = t_k
    heat_hist = np.zeros(steps + 1)
    voltage_hist = np.zeros(steps + 1)
    aging = AgingParams()

    for s in range(steps):
        heats = np.zeros(n)
        volts = np.zeros(n)
        for i in range(n):
            ecm = equivalent_circuit_heat(spec.current_a, t_k[i], soc[i], cell, i1[i])
            heats[i] = ecm["heat_w"]
            volts[i] = ecm["voltage_v"]
            i1[i] += ecm["di1"] * spec.dt_s
            r, c = divmod(i, spec.cols)
            for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                rr, cc = r + dr, c + dc
                if 0 <= rr < spec.rows and 0 <= cc < spec.cols:
                    j = rr * spec.cols + cc
                    heats[i] += spec.k_contact_w_k * (t_k[j] - t_k[i])
            heats[i] += spec.htc_w_m2k * cell.surface_area_m2 * (
                spec.ambient_c + 273.15 - t_k[i]
            )
            c_rate = spec.current_a / cell.capacity_ah
            fade[i] += capacity_fade_rate(t_k[i], soc[i], c_rate, aging) * spec.dt_s
            dsoc = -spec.current_a * spec.dt_s / (cell.capacity_ah * 3600.0)
            soc[i] = float(np.clip(soc[i] + dsoc, 0.02, 0.98))
        t_k = t_k + spec.dt_s * heats / cell.thermal_capacity_j_per_k
        t_hist[s + 1] = t_k
        heat_hist[s + 1] = heats.sum()
        voltage_hist[s + 1] = volts.mean() * spec.cols  # series-parallel approx

    time_s = np.arange(steps + 1) * spec.dt_s
    t_c = t_hist - 273.15
    return {
        "time_s": time_s.tolist(),
        "max_temp_c": t_c.max(axis=1).tolist(),
        "mean_temp_c": t_c.mean(axis=1).tolist(),
        "final_temp_map_c": t_c[-1].reshape(spec.rows, spec.cols).tolist(),
        "module_heat_w": heat_hist.tolist(),
        "pack_voltage_v": voltage_hist.tolist(),
        "mean_fade_frac": float(fade.mean()),
        "hotspot_c": float(t_c.max()),
        "delta_t_c": float(t_c[-1].max() - t_c[-1].min()),
        "final_soc": float(soc.mean()),
        "rows": spec.rows,
        "cols": spec.cols,
        "chemistry": spec.chemistry,
        "current_a": spec.current_a,
        "htc": spec.htc_w_m2k,
    }
