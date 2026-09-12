"""Lumped electro-thermal equivalent-circuit cell model.

This is an engineering digital-twin kernel, not a full Newman P2D solver.
It is calibrated to NMC/LFP order-of-magnitude heat and voltage behavior
so safety, cooling, and warranty engines can run in milliseconds.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np


R_GAS = 8.314  # J/mol/K


@dataclass(frozen=True)
class CellParams:
    chemistry: str = "nmc811"
    capacity_ah: float = 50.0
    mass_kg: float = 0.85
    cp_j_per_kgk: float = 1100.0
    ocv_v: float = 3.65
    r0_ohm: float = 0.0018
    r1_ohm: float = 0.0009
    tau1_s: float = 12.0
    entropic_coeff_v_per_k: float = -0.00012
    thickness_m: float = 0.012
    width_m: float = 0.15
    height_m: float = 0.10

    @property
    def thermal_capacity_j_per_k(self) -> float:
        return self.mass_kg * self.cp_j_per_kgk

    @property
    def surface_area_m2(self) -> float:
        return 2.0 * (
            self.width_m * self.height_m
            + self.width_m * self.thickness_m
            + self.height_m * self.thickness_m
        )


CHEMISTRY_PRESETS: dict[str, CellParams] = {
    "nmc811": CellParams(),
    "lfp": CellParams(
        chemistry="lfp",
        capacity_ah=100.0,
        mass_kg=1.7,
        ocv_v=3.22,
        r0_ohm=0.0011,
        r1_ohm=0.0006,
        entropic_coeff_v_per_k=-0.00004,
    ),
    "nca": CellParams(
        chemistry="nca",
        capacity_ah=48.0,
        mass_kg=0.82,
        ocv_v=3.68,
        r0_ohm=0.0020,
        entropic_coeff_v_per_k=-0.00014,
    ),
}


def equivalent_circuit_heat(
    current_a: float,
    temperature_k: float,
    soc: float,
    params: CellParams,
    i1_a: float = 0.0,
) -> dict[str, float]:
    """Instantaneous joule + entropic heat and updated polarization current."""
    t_ref = 298.15
    r_scale = np.exp(1200.0 * (1.0 / temperature_k - 1.0 / t_ref))
    r0 = params.r0_ohm * r_scale * (1.15 - 0.3 * soc)
    r1 = params.r1_ohm * r_scale
    q_joule = current_a**2 * r0 + i1_a**2 * r1
    q_rev = current_a * temperature_k * params.entropic_coeff_v_per_k
    voltage = params.ocv_v - current_a * r0 - i1_a * r1
    di1 = (current_a - i1_a) / params.tau1_s
    return {
        "heat_w": float(q_joule + q_rev),
        "voltage_v": float(voltage),
        "r0_ohm": float(r0),
        "di1": float(di1),
    }
