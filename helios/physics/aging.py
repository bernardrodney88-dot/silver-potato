"""Arrhenius SEI + throughput aging for remaining useful life and warranty."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from helios.physics.ecm import R_GAS

T_REF_K = 298.15


@dataclass(frozen=True)
class AgingParams:
    ea_j_per_mol: float = 35_000.0
    k_cal_per_year: float = 0.009
    k_cyc_per_year: float = 0.013
    z_throughput: float = 0.55
    eol_capacity_frac: float = 0.80
    resistance_growth_gain: float = 1.4


def _arrhenius(temperature_k: float, params: AgingParams) -> float:
    return float(np.exp(params.ea_j_per_mol / R_GAS * (1.0 / T_REF_K - 1.0 / temperature_k)))


def fade_per_year(
    temperature_k: float,
    soc: float,
    equivalent_full_cycles_per_day: float,
    params: AgingParams,
) -> float:
    arrh = _arrhenius(temperature_k, params)
    cal = params.k_cal_per_year * arrh * (0.45 + 0.70 * soc)
    duty = max(equivalent_full_cycles_per_day, 0.0)
    cyc = params.k_cyc_per_year * arrh * (duty**params.z_throughput)
    return float(cal + cyc)


def capacity_fade_rate(
    temperature_k: float,
    soc: float,
    c_rate: float,
    params: AgingParams,
) -> float:
    """Fractional capacity loss per second (positive). C-rate maps to daily EFC if sustained."""
    efc_per_day = abs(c_rate) * 24.0
    return fade_per_year(temperature_k, soc, efc_per_day, params) / (365.0 * 86400.0)


def remaining_useful_life(
    temperature_c: float,
    soc: float,
    equivalent_full_cycles_per_day: float,
    current_soh: float = 1.0,
    params: AgingParams | None = None,
) -> dict[str, float]:
    params = params or AgingParams()
    t_k = temperature_c + 273.15
    fade = fade_per_year(t_k, soc, equivalent_full_cycles_per_day, params)
    remaining = max(current_soh - params.eol_capacity_frac, 0.0)
    years = remaining / fade if fade > 0 else 1e6
    return {
        "fade_per_year": float(fade),
        "rul_days": float(years * 365.0),
        "rul_years": float(years),
        "eol_capacity_frac": params.eol_capacity_frac,
        "current_soh": current_soh,
    }
