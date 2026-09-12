"""Helios Lattice console — run twins without the browser."""

from __future__ import annotations

import argparse
import json

from helios.physics.coating import CoatingLineParams, simulate_coating_line
from helios.physics.module import ModuleSpec, simulate_module
from helios.physics.runaway import AbuseScenario, simulate_thermal_runaway
from helios.simulations.campaign import run_campaign


def main() -> None:
    p = argparse.ArgumentParser(prog="helios")
    sub = p.add_subparsers(dest="cmd", required=True)

    r = sub.add_parser("runaway", help="thermal runaway lattice")
    r.add_argument("--chemistry", default="nmc811")
    r.add_argument("--htc", type=float, default=18.0)
    r.add_argument("--k", type=float, default=1.6)

    m = sub.add_parser("module", help="electro-thermal module")
    m.add_argument("--chemistry", default="nmc811")
    m.add_argument("--current", type=float, default=75.0)

    c = sub.add_parser("coating", help="coating line yield")
    c.add_argument("--speed", type=float, default=45.0)
    c.add_argument("--temp", type=float, default=125.0)

    sub.add_parser("campaign", help="containment vs cooling design grid")

    args = p.parse_args()
    if args.cmd == "runaway":
        out = simulate_thermal_runaway(
            chemistry=args.chemistry,
            scenario=AbuseScenario(htc_w_m2k=args.htc, k_contact_w_k=args.k),
        )
        print(json.dumps({k: out[k] for k in (
            "cells_failed", "propagation_fraction", "peak_temp_c", "contained", "chemistry"
        )}, indent=2))
    elif args.cmd == "module":
        out = simulate_module(ModuleSpec(chemistry=args.chemistry, current_a=args.current))
        print(json.dumps({k: out[k] for k in (
            "hotspot_c", "delta_t_c", "mean_fade_frac", "final_soc", "chemistry"
        )}, indent=2))
    elif args.cmd == "coating":
        out = simulate_coating_line(
            CoatingLineParams(line_speed_m_min=args.speed, dryer_temp_c=args.temp)
        )
        print(json.dumps(out, indent=2))
    elif args.cmd == "campaign":
        out = run_campaign()
        slim = {
            "n_runs": out["n_runs"],
            "containment_rate": out["containment_rate"],
            "best_design": out["best_design"],
            "warranty_reserve_usd": out["warranty"]["warranty_reserve_usd"],
        }
        print(json.dumps(slim, indent=2))


if __name__ == "__main__":
    main()
