"""Warranty reserve and insurance loading from physics outputs."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class AssetEconomics:
    nameplate_mwh: float = 100.0
    pack_cost_usd_per_kwh: float = 145.0
    warranty_years: float = 15.0
    cycles_per_year: float = 365.0
    energy_throughput_warranty_mwh: float = 7_000.0
    project_irr_hurdle: float = 0.11
    replacement_cost_frac: float = 0.62


def warranty_engine(
    fade_per_year: float,
    hotspot_c: float,
    propagation_fraction: float,
    contained: bool,
    asset: AssetEconomics | None = None,
) -> dict:
    asset = asset or AssetEconomics()
    pack_usd = asset.nameplate_mwh * 1000.0 * asset.pack_cost_usd_per_kwh
    years_to_eol = max((1.0 - 0.80) / max(fade_per_year, 1e-6), 0.5)
    life_risk = 1.0 if years_to_eol < asset.warranty_years else asset.warranty_years / years_to_eol
    thermal_load = 0.004 + 0.08 * propagation_fraction + (0.0 if contained else 0.05)
    thermal_load *= 1.0 + max(0.0, hotspot_c - 45.0) / 80.0
    expected_claim_frac = min(0.35, 0.03 * life_risk + thermal_load)
    reserve = pack_usd * expected_claim_frac * asset.replacement_cost_frac
    annual_accrual = reserve / asset.warranty_years
    return {
        "pack_value_usd": pack_usd,
        "years_to_80pct_soh": years_to_eol,
        "expected_claim_frac": expected_claim_frac,
        "warranty_reserve_usd": reserve,
        "annual_accrual_usd": annual_accrual,
        "reserve_pct_of_pack": 100.0 * reserve / pack_usd,
        "passes_15y_energy_warranty": years_to_eol >= asset.warranty_years * 0.9,
    }


def insurance_loading(
    propagation_fraction: float,
    peak_temp_c: float,
    nameplate_mwh: float = 100.0,
    limit_usd: float | None = None,
) -> dict:
    limit = limit_usd or nameplate_mwh * 1.2e6
    p_cascade = min(0.55, 0.008 + 0.62 * propagation_fraction**1.25)
    # Single-cell TR is a known 9540A event; severity scales with how much of the lattice fails.
    if propagation_fraction <= 0.07:
        severity = 0.06 + min(0.04, max(0.0, peak_temp_c - 200.0) / 8000.0)
    else:
        severity = min(0.95, 0.12 + 0.85 * propagation_fraction)
    event_rate = 0.008 * (0.35 + propagation_fraction)
    aal = limit * p_cascade * severity * (event_rate / 0.008)
    expense = 0.0035 * limit
    tech_premium = 1.25 * aal + expense
    contained = propagation_fraction <= 0.07
    insurable = contained or p_cascade < 0.22
    quoted = tech_premium if insurable else None
    return {
        "p_cascade_given_abuse": p_cascade,
        "event_rate_per_year": event_rate,
        "severity_frac": severity,
        "limit_usd": limit,
        "aal_usd": aal,
        "technical_premium_usd": tech_premium,
        "quoted_premium_usd": quoted,
        "rate_on_line": (quoted or tech_premium) / limit,
        "insurable": insurable,
        "underwriting": "BIND" if insurable else "DECLINE",
        "contained_event": contained,
    }


def dispatch_vs_degradation(
    spread_usd_per_mwh: float,
    cycles_per_day: float,
    fade_per_year_at_1cyc: float,
    nameplate_mwh: float = 100.0,
    pack_cost_usd_per_kwh: float = 145.0,
) -> dict:
    pack = nameplate_mwh * 1000.0 * pack_cost_usd_per_kwh
    fade = fade_per_year_at_1cyc * cycles_per_day
    # $ of lost life per year ≈ fade * remaining capacity value
    deg_cost = fade * pack * 0.55
    revenue = spread_usd_per_mwh * nameplate_mwh * cycles_per_day * 365.0 * 0.88
    npv_1y = revenue - deg_cost
    return {
        "annual_spread_revenue_usd": revenue,
        "annual_degradation_cost_usd": deg_cost,
        "net_1y_usd": npv_1y,
        "should_cycle": npv_1y > 0,
        "cycles_per_day": cycles_per_day,
        "spread_usd_per_mwh": spread_usd_per_mwh,
        "implied_cost_per_mwh_throughput": deg_cost
        / max(nameplate_mwh * cycles_per_day * 365.0, 1e-6),
    }
