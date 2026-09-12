from helios.economics.warranty import dispatch_vs_degradation, insurance_loading, warranty_engine
from helios.physics.aging import remaining_useful_life
from helios.physics.coating import CoatingLineParams, simulate_coating_line
from helios.physics.ecm import CHEMISTRY_PRESETS, equivalent_circuit_heat
from helios.physics.module import ModuleSpec, simulate_module
from helios.physics.runaway import AbuseScenario, simulate_thermal_runaway
from helios.products.catalog import catalog
from helios.simulations.campaign import run_campaign


def test_ecm_heat_positive_at_high_current():
    cell = CHEMISTRY_PRESETS["nmc811"]
    out = equivalent_circuit_heat(120.0, 298.15, 0.5, cell)
    assert out["heat_w"] > 0
    assert out["voltage_v"] < cell.ocv_v


def test_lfp_harder_to_propagate_than_nmc():
    nmc = simulate_thermal_runaway(
        chemistry="nmc811",
        scenario=AbuseScenario(htc_w_m2k=12.0, k_contact_w_k=2.2, duration_s=180.0),
    )
    lfp = simulate_thermal_runaway(
        chemistry="lfp",
        scenario=AbuseScenario(htc_w_m2k=12.0, k_contact_w_k=2.2, duration_s=180.0),
    )
    assert lfp["propagation_fraction"] <= nmc["propagation_fraction"]
    assert lfp["peak_temp_c"] < nmc["peak_temp_c"]


def test_cooling_contains_runaway():
    # Same contact network: extra convection should reduce cascade, not the initiator quench-by-spreading artifact.
    hot = simulate_thermal_runaway(
        scenario=AbuseScenario(htc_w_m2k=8.0, k_contact_w_k=1.8, duration_s=180.0)
    )
    cool = simulate_thermal_runaway(
        scenario=AbuseScenario(htc_w_m2k=55.0, k_contact_w_k=1.8, duration_s=180.0)
    )
    assert cool["propagation_fraction"] <= hot["propagation_fraction"]
    assert hot["cells_failed"] >= 1


def test_aging_faster_when_hot():
    cool = remaining_useful_life(20.0, 0.5, 1.0)
    hot = remaining_useful_life(45.0, 0.5, 1.0)
    assert hot["fade_per_year"] > cool["fade_per_year"]
    assert hot["rul_years"] < cool["rul_years"]


def test_module_heats_under_load():
    sim = simulate_module(ModuleSpec(duration_s=120.0, dt_s=1.0, current_a=100.0))
    assert sim["hotspot_c"] > 25.0
    assert sim["final_soc"] < 0.85


def test_coating_scrap_explodes_at_insane_speed():
    good = simulate_coating_line(CoatingLineParams(line_speed_m_min=40.0, dryer_temp_c=125.0))
    bad = simulate_coating_line(CoatingLineParams(line_speed_m_min=78.0, dryer_temp_c=100.0))
    assert bad["defect_ppm"] > good["defect_ppm"]
    assert bad["scrap_cost_usd_shift"] > good["scrap_cost_usd_shift"]


def test_warranty_and_insurance_signed():
    war = warranty_engine(0.018, 48.0, 0.2, False)
    ins = insurance_loading(0.4, 700.0)
    assert war["warranty_reserve_usd"] > 0
    assert ins["technical_premium_usd"] > 0


def test_dispatch_refuses_tiny_spreads():
    rul = remaining_useful_life(40.0, 0.5, 1.0)
    poor = dispatch_vs_degradation(8.0, 2.0, rul["fade_per_year"])
    rich = dispatch_vs_degradation(140.0, 0.8, rul["fade_per_year"])
    assert rich["net_1y_usd"] > poor["net_1y_usd"]


def test_catalog_has_paid_skus():
    skus = catalog()
    assert len(skus) >= 5
    assert any(s["price_usd_year"] >= 80_000 for s in skus)


def test_campaign_runs():
    out = run_campaign(n_htc=3, n_k=3)
    assert out["n_runs"] == 9
    assert 0 <= out["containment_rate"] <= 1
