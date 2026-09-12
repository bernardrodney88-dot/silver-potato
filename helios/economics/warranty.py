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
    p_cascade = min(0.45, 0.01 + 0.55 * propagation_fraction**1.4)
    severity = min(1.0, 0.15 + (peak_temp_c / 900.0) * 0.9)
    aal = limit * p_cascade * severity  # average annual loss if one qualifying event/yr rate later
    event_rate = 0.012 * (0.4 + propagation_fraction)
    aal *= event_rate / 0.012
    tech_premium = 1.35 * aal + 0.004 * limit
    return {
        "p_cascade_given_abuse": p_cascade,
        "event_rate_per_year": event_rate,
        "severity_frac": severity,
        "limit_usd": limit,
        "aal_usd": aal,
        "technical_premium_usd": tech_premium,
        "rate_on_line": tech_premium / limit,
        "insurable": p_cascade < 0.25 and peak_temp_c < 780,
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
