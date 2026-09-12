"""Thermal-runaway propagation across a cell lattice (lumped Arrhenius source)."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from helios.physics.ecm import CHEMISTRY_PRESETS, CellParams, R_GAS


@dataclass(frozen=True)
class AbuseScenario:
    kind: str = "overheat"  # overheat | overcharge | nail
    trigger_index: int = 0
    trigger_temperature_c: float = 185.0
    duration_s: float = 900.0
    dt_s: float = 0.25
    ambient_c: float = 25.0
    htc_w_m2k: float = 18.0
    k_contact_w_k: float = 1.6
    trigger_heat_w: float = 750.0
    trigger_hold_s: float = 12.0
    seed: int = 7


@dataclass(frozen=True)
class RunawayChemistry:
    """Lumped effective kinetics (Hatchard-style), not a single micro-reaction."""

    ea_j_per_mol: float = 78_000.0
    pre_exp_1_s: float = 6.3e7
    enthalpy_j_per_kg: float = 8.5e5
    onset_c: float = 128.0


CHEM_RUNAWAY: dict[str, RunawayChemistry] = {
    "nmc811": RunawayChemistry(),
    "nca": RunawayChemistry(
        ea_j_per_mol=74_000.0, enthalpy_j_per_kg=9.2e5, onset_c=122.0
    ),
    "lfp": RunawayChemistry(
        ea_j_per_mol=108_000.0,
        pre_exp_1_s=6.3e7,
        enthalpy_j_per_kg=3.1e5,
        onset_c=175.0,
    ),
}


def _neighbors(i: int, rows: int, cols: int) -> list[int]:
    r, c = divmod(i, cols)
    out: list[int] = []
    for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        rr, cc = r + dr, c + dc
        if 0 <= rr < rows and 0 <= cc < cols:
            out.append(rr * cols + cc)
    return out


def simulate_thermal_runaway(
    rows: int = 4,
    cols: int = 4,
    chemistry: str = "nmc811",
    scenario: AbuseScenario | None = None,
    cell: CellParams | None = None,
) -> dict:
    scenario = scenario or AbuseScenario()
    cell = cell or CHEMISTRY_PRESETS[chemistry]
    rxn = CHEM_RUNAWAY[chemistry]
    n = rows * cols
    rng = np.random.default_rng(scenario.seed)

    t_k = np.full(n, scenario.ambient_c + 273.15)
    alpha = np.zeros(n)
    soh_scale = 1.0 + rng.normal(0.0, 0.04, n)
    t_k[scenario.trigger_index] = scenario.trigger_temperature_c + 273.15

    steps = int(scenario.duration_s / scenario.dt_s)
    t_hist = np.zeros((steps + 1, n))
    alpha_hist = np.zeros((steps + 1, n))
    t_hist[0] = t_k
    failed = np.zeros(n, dtype=bool)
    cascade_time = np.full(n, np.nan)

    for s in range(steps):
        q = np.zeros(n)
        for i in range(n):
            if t_k[i] > rxn.onset_c + 273.15 and alpha[i] < 0.999:
                rate = rxn.pre_exp_1_s * np.exp(-rxn.ea_j_per_mol / (R_GAS * t_k[i]))
                dalpha = rate * (1.0 - alpha[i]) * scenario.dt_s * soh_scale[i]
                dalpha = min(float(dalpha), 1.0 - alpha[i])
                alpha[i] += dalpha
                q[i] += dalpha * rxn.enthalpy_j_per_kg * cell.mass_kg / scenario.dt_s
            if i == scenario.trigger_index and (s + 1) * scenario.dt_s <= scenario.trigger_hold_s:
                q[i] += scenario.trigger_heat_w
            for j in _neighbors(i, rows, cols):
                q[i] += scenario.k_contact_w_k * (t_k[j] - t_k[i])
            q[i] += scenario.htc_w_m2k * cell.surface_area_m2 * (
                scenario.ambient_c + 273.15 - t_k[i]
            )

        t_k = t_k + scenario.dt_s * q / cell.thermal_capacity_j_per_k
        t_k = np.clip(t_k, 250.0, 1200.0)
        newly = ((alpha > 0.25) | (t_k > 523.15)) & (~failed)
        cascade_time[newly] = (s + 1) * scenario.dt_s
        failed |= newly
        t_hist[s + 1] = t_k
        alpha_hist[s + 1] = alpha
        if failed.all() and s > 40:
            t_hist = t_hist[: s + 2]
            alpha_hist = alpha_hist[: s + 2]
            break

    time_s = np.arange(t_hist.shape[0]) * scenario.dt_s
    max_t = t_hist.max(axis=1)
    cells_failed = int(failed.sum())
    return {
        "time_s": time_s.tolist(),
        "max_temp_c": (max_t - 273.15).tolist(),
        "mean_temp_c": (t_hist.mean(axis=1) - 273.15).tolist(),
        "final_temp_c": (t_hist[-1] - 273.15).tolist(),
        "final_alpha": alpha_hist[-1].tolist(),
        "cascade_time_s": [None if np.isnan(x) else float(x) for x in cascade_time],
        "cells_failed": cells_failed,
        "cells_total": n,
        "propagation_fraction": cells_failed / n,
        "peak_temp_c": float(t_hist.max() - 273.15),
        "contained": cells_failed <= 1,
        "rows": rows,
        "cols": cols,
        "chemistry": chemistry,
        "scenario": scenario.kind,
        "cooling_htc": scenario.htc_w_m2k,
        "k_contact": scenario.k_contact_w_k,
    }
