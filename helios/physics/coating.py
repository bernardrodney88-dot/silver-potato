"""Electrode coating/drying line twin — gigafactory yield product.

Defect rate is modeled as a Weibull-like function of line speed, dryer
temperature, and slurry solids. This is the class of model coating OEMs
and cell plants already buy from process-engineering software, packaged
as a closed-loop yield controller.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class CoatingLineParams:
    line_speed_m_min: float = 45.0
    dryer_temp_c: float = 125.0
    slurry_solids_frac: float = 0.62
    coat_weight_mg_cm2: float = 18.5
    web_width_m: float = 1.2
    hours: float = 8.0
    target_porosity: float = 0.32


def simulate_coating_line(p: CoatingLineParams | None = None) -> dict:
    p = p or CoatingLineParams()
    speed = p.line_speed_m_min
    # Drying Damköhler: too fast → wet core / binder migration; too hot → skinning.
    da = (p.dryer_temp_c / 120.0) * (40.0 / max(speed, 1.0))
    skinning = max(0.0, (p.dryer_temp_c - 140.0) / 40.0)
    wet_core = max(0.0, (speed - 55.0) / 30.0)
    solids_off = abs(p.slurry_solids_frac - 0.60) / 0.08
    weight_off = abs(p.coat_weight_mg_cm2 - 18.0) / 4.0
    ppm = 80.0 + 900.0 * wet_core**2 + 700.0 * skinning**2 + 400.0 * solids_off**2
    ppm += 250.0 * weight_off**2
    ppm *= 0.85 + 0.3 / (1.0 + da)
    ppm = float(np.clip(ppm, 40.0, 8000.0))

    area_m2 = speed / 60.0 * p.web_width_m * p.hours * 3600.0
    electrode_mwh = area_m2 * (p.coat_weight_mg_cm2 * 10.0) * 0.00018  # rough
    scrap_frac = 1.0 - np.exp(-ppm / 1e6 * 12.0)
    good_mwh = electrode_mwh * (1.0 - scrap_frac)
    lost_usd = scrap_frac * electrode_mwh * 85_000.0  # ~$/MWh electrode value
    oee = float(np.clip(0.93 - scrap_frac * 1.8 - max(0, speed - 70) * 0.002, 0.45, 0.95))
    return {
        "defect_ppm": ppm,
        "scrap_frac": float(scrap_frac),
        "oee": oee,
        "throughput_mwh_shift": float(electrode_mwh),
        "good_mwh_shift": float(good_mwh),
        "scrap_cost_usd_shift": float(lost_usd),
        "damkohler": float(da),
        "line_speed_m_min": speed,
        "dryer_temp_c": p.dryer_temp_c,
        "slurry_solids_frac": p.slurry_solids_frac,
        "recommendation": _recommend(speed, p.dryer_temp_c, ppm),
    }


def _recommend(speed: float, temp: float, ppm: float) -> str:
    if ppm < 180:
        return "Window is production-ready. Lock recipe and sell the digital SOP."
    if speed > 55 and temp < 130:
        return "Increase dryer temperature 8–12 °C or add a third zone before raising speed."
    if temp > 145:
        return "Skinning risk. Drop zone-1 temperature and raise air velocity, not setpoint."
    return "Hold speed, retune slurry solids toward 60%, then climb 3 m/min per locked DOE."


def sweep_operating_window() -> list[dict]:
    rows = []
    for speed in np.linspace(25, 80, 12):
        for temp in np.linspace(95, 155, 13):
            r = simulate_coating_line(
                CoatingLineParams(line_speed_m_min=float(speed), dryer_temp_c=float(temp))
            )
            rows.append(
                {
                    "speed": float(speed),
                    "temp": float(temp),
                    "ppm": r["defect_ppm"],
                    "oee": r["oee"],
                    "good_mwh": r["good_mwh_shift"],
                }
            )
    return rows
