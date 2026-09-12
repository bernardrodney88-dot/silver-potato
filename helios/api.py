from __future__ import annotations

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from helios import __version__
from helios.economics.warranty import dispatch_vs_degradation, insurance_loading, warranty_engine
from helios.physics.aging import remaining_useful_life
from helios.physics.coating import CoatingLineParams, simulate_coating_line, sweep_operating_window
from helios.physics.ecm import CHEMISTRY_PRESETS
from helios.physics.module import ModuleSpec, simulate_module
from helios.physics.runaway import AbuseScenario, simulate_thermal_runaway
from helios.products.catalog import catalog
from helios.simulations.campaign import run_campaign

app = FastAPI(
    title="Helios Lattice",
    description="Physics digital twins that deeptech actually buys: safety, warranty, plant yield.",
    version=__version__,
)
app.mount("/static", StaticFiles(directory="web"), name="static")


class RunawayRequest(BaseModel):
    chemistry: str = "nmc811"
    rows: int = Field(4, ge=2, le=8)
    cols: int = Field(4, ge=2, le=8)
    htc_w_m2k: float = Field(18.0, ge=2.0, le=80.0)
    k_contact_w_k: float = Field(1.6, ge=0.1, le=6.0)
    trigger_temperature_c: float = Field(185.0, ge=80.0, le=300.0)
    duration_s: float = Field(600.0, ge=30.0, le=1800.0)


class ModuleRequest(BaseModel):
    chemistry: str = "nmc811"
    current_a: float = Field(75.0, ge=5.0, le=250.0)
    htc_w_m2k: float = Field(25.0, ge=5.0, le=80.0)
    duration_s: float = Field(900.0, ge=60.0, le=3600.0)
    rows: int = 4
    cols: int = 4


class AgingRequest(BaseModel):
    temperature_c: float = 35.0
    soc: float = 0.55
    cycles_per_day: float = 1.0
    current_soh: float = 1.0


class CoatingRequest(BaseModel):
    line_speed_m_min: float = 45.0
    dryer_temp_c: float = 125.0
    slurry_solids_frac: float = 0.62
    hours: float = 8.0


class DispatchRequest(BaseModel):
    spread_usd_per_mwh: float = 55.0
    cycles_per_day: float = 1.2
    temperature_c: float = 32.0


@app.get("/")
def index():
    return FileResponse("web/index.html")


@app.get("/api/health")
def health():
    return {"ok": True, "product": "Helios Lattice", "version": __version__}


@app.get("/api/chemistries")
def chemistries():
    return {
        k: {
            "capacity_ah": v.capacity_ah,
            "mass_kg": v.mass_kg,
            "r0_ohm": v.r0_ohm,
        }
        for k, v in CHEMISTRY_PRESETS.items()
    }


@app.get("/api/products")
def products():
    return catalog()


@app.post("/api/simulate/runaway")
def api_runaway(req: RunawayRequest):
    result = simulate_thermal_runaway(
        rows=req.rows,
        cols=req.cols,
        chemistry=req.chemistry,
        scenario=AbuseScenario(
            htc_w_m2k=req.htc_w_m2k,
            k_contact_w_k=req.k_contact_w_k,
            trigger_temperature_c=req.trigger_temperature_c,
            duration_s=req.duration_s,
        ),
    )
    ins = insurance_loading(result["propagation_fraction"], result["peak_temp_c"])
    return {"sim": result, "insurance": ins}


@app.post("/api/simulate/module")
def api_module(req: ModuleRequest):
    sim = simulate_module(
        ModuleSpec(
            chemistry=req.chemistry,
            current_a=req.current_a,
            htc_w_m2k=req.htc_w_m2k,
            duration_s=req.duration_s,
            rows=req.rows,
            cols=req.cols,
        )
    )
    return sim


@app.post("/api/simulate/aging")
def api_aging(req: AgingRequest):
    rul = remaining_useful_life(
        req.temperature_c, req.soc, req.cycles_per_day, req.current_soh
    )
    war = warranty_engine(rul["fade_per_year"], req.temperature_c + 8.0, 0.05, True)
    return {"rul": rul, "warranty": war}


@app.post("/api/simulate/coating")
def api_coating(req: CoatingRequest):
    return simulate_coating_line(
        CoatingLineParams(
            line_speed_m_min=req.line_speed_m_min,
            dryer_temp_c=req.dryer_temp_c,
            slurry_solids_frac=req.slurry_solids_frac,
            hours=req.hours,
        )
    )


@app.get("/api/simulate/coating-window")
def api_coating_window():
    return sweep_operating_window()


@app.post("/api/simulate/dispatch")
def api_dispatch(req: DispatchRequest):
    rul = remaining_useful_life(req.temperature_c, 0.5, 1.0)
    return dispatch_vs_degradation(
        req.spread_usd_per_mwh, req.cycles_per_day, rul["fade_per_year"]
    )


@app.get("/api/simulate/campaign")
def api_campaign(chemistry: str = "nmc811"):
    return run_campaign(chemistry=chemistry)
