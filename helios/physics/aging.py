"""Arrhenius SEI + throughput aging for remaining useful life and warranty."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from helios.physics.ecm import R_GAS


@dataclass(frozen=True)
class AgingParams:
    ea_j_per_mol: float = 35_000.0
    k_cal_per_s: float = 4.2e-9
    k_cyc: float = 2.8e-5
    z_throughput: float = 0.55
    eol_capacity_frac: float = 0.80
    resistance_growth_gain: float = 1.4


def capacity_fade_rate(
    temperature_k: float,
    soc: float,
    c_rate: float,
    params: AgingParams,
) -> float:
    """Fractional capacity loss per second (positive)."""
    arrh = np.exp(-params.ea_j_per_mol / (R_GAS * temperature_k))
    cal = params.k_cal_per_s * arrh * (0.6 + 0.8 * soc)
    cyc = params.k_cyc * arrh * (abs(c_rate) ** params.z_throughput) / 3600.0
    return float(cal + cyc)


def remaining_useful_life(
    temperature_c: float,
    soc: float,
    equivalent_full_cycles_per_day: float,
    current_soh: float = 1.0,
    params: AgingParams | None = None,
) -> dict[str, float]:
    params = params or AgingParams()
    t_k = temperature_c + 273.15
    c_rate = equivalent_full_cycles_per_day / 24.0
    fade_s = capacity_fade_rate(t_k, soc, c_rate, params)
    remaining = max(current_soh - params.eol_capacity_frac, 0.0)
    seconds = remaining / fade_s if fade_s > 0 else 1e12
    days = seconds / 86400.0
    return {
        "fade_per_year": float(fade_s * 86400.0 * 365.0),
        "rul_days": float(days),
        "rul_years": float(days / 365.0),
        "eol_capacity_frac": params.eol_capacity_frac,
        "current_soh": current_soh,
    }
