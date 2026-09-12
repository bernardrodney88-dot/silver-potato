"""Monte-Carlo safety campaign used by underwriting packs."""

from __future__ import annotations

import numpy as np

from helios.economics.warranty import insurance_loading, warranty_engine
from helios.physics.aging import remaining_useful_life
from helios.physics.runaway import AbuseScenario, simulate_thermal_runaway


def run_campaign(
    chemistry: str = "nmc811",
    rows: int = 4,
    cols: int = 4,
    n_htc: int = 6,
    n_k: int = 5,
) -> dict:
    htcs = np.linspace(8.0, 45.0, n_htc)
    ks = np.linspace(0.4, 3.2, n_k)
    records = []
    for h in htcs:
        for k in ks:
            r = simulate_thermal_runaway(
                rows=rows,
                cols=cols,
                chemistry=chemistry,
                scenario=AbuseScenario(htc_w_m2k=float(h), k_contact_w_k=float(k), duration_s=480.0),
            )
            ins = insurance_loading(r["propagation_fraction"], r["peak_temp_c"])
            records.append(
                {
                    "htc": float(h),
                    "k_contact": float(k),
                    "propagation_fraction": r["propagation_fraction"],
                    "peak_temp_c": r["peak_temp_c"],
                    "contained": r["contained"],
                    "premium_usd": ins["technical_premium_usd"],
                    "insurable": ins["insurable"],
                }
            )
    contained = [x for x in records if x["contained"]]
    best = min(records, key=lambda x: (not x["contained"], x["premium_usd"]))
    rul = remaining_useful_life(temperature_c=38.0, soc=0.55, equivalent_full_cycles_per_day=1.1)
    war = warranty_engine(rul["fade_per_year"], 48.0, best["propagation_fraction"], best["contained"])
    return {
        "chemistry": chemistry,
        "n_runs": len(records),
        "containment_rate": len(contained) / len(records),
        "best_design": best,
        "grid": records,
        "rul": rul,
        "warranty": war,
    }
