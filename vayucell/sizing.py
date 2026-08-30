"""VayuCell-1000 first-principles sizing.

All SI internally. Nominal design: 1000 m³/h tropical hotspot scrubber.
"""

from __future__ import annotations

from dataclasses import dataclass


# --- Design constants (VayuCell-1000) ---
NOMINAL_FLOW_M3H = 1000.0
DUCT_W_M = 0.40
DUCT_H_M = 0.40
WESP_LENGTH_M = 0.90
PLASMA_LENGTH_M = 0.50
CATALYST_LENGTH_M = 0.30
PLASMA_POWER_W = 2000.0
WESP_POWER_W = 300.0
FAN_POWER_W = 1100.0
PUMP_POWER_W = 300.0
CTRL_POWER_W = 100.0
TARGET_PRESSURE_DROP_PA = 550.0
SUMP_VOLUME_L = 80.0
SPRAY_LPM = 15.0
OZONE_TRIP_PPB = 80.0  # outlet hard trip (WHO 8h is 100 µg/m³ ~50 ppb; 80 ppb is trip)


@dataclass(frozen=True)
class Sizing:
    flow_m3h: float
    velocity_m_s: float
    wesp_residence_s: float
    plasma_residence_s: float
    catalyst_residence_s: float
    specific_energy_j_per_l: float
    total_power_w: float
    energy_kwh_per_1000m3: float
    hydraulic_retention_min: float


def velocity_m_s(flow_m3h: float, width_m: float = DUCT_W_M, height_m: float = DUCT_H_M) -> float:
    flow_m3s = flow_m3h / 3600.0
    area = width_m * height_m
    if area <= 0:
        raise ValueError("duct area must be positive")
    return flow_m3s / area


def residence_s(length_m: float, vel_m_s: float) -> float:
    if vel_m_s <= 0:
        raise ValueError("velocity must be positive")
    return length_m / vel_m_s


def specific_energy_j_per_l(plasma_w: float, flow_m3h: float) -> float:
    """J/L = W / (L/s). 1 m³/h = 1000 L / 3600 s."""
    litres_per_s = flow_m3h * 1000.0 / 3600.0
    if litres_per_s <= 0:
        raise ValueError("flow must be positive")
    return plasma_w / litres_per_s


def energy_kwh_per_1000m3(total_w: float, flow_m3h: float) -> float:
    if flow_m3h <= 0:
        raise ValueError("flow must be positive")
    hours_per_1000m3 = 1000.0 / flow_m3h
    return (total_w / 1000.0) * hours_per_1000m3


def hydraulic_retention_min(sump_l: float, spray_lpm: float) -> float:
    if spray_lpm <= 0:
        raise ValueError("spray must be positive")
    return sump_l / spray_lpm


def size(
    flow_m3h: float = NOMINAL_FLOW_M3H,
    plasma_w: float = PLASMA_POWER_W,
) -> Sizing:
    if not 200.0 <= flow_m3h <= 2500.0:
        raise ValueError("flow_m3h must be between 200 and 2500 for this chassis")
    vel = velocity_m_s(flow_m3h)
    total = plasma_w + WESP_POWER_W + FAN_POWER_W + PUMP_POWER_W + CTRL_POWER_W
    return Sizing(
        flow_m3h=flow_m3h,
        velocity_m_s=vel,
        wesp_residence_s=residence_s(WESP_LENGTH_M, vel),
        plasma_residence_s=residence_s(PLASMA_LENGTH_M, vel),
        catalyst_residence_s=residence_s(CATALYST_LENGTH_M, vel),
        specific_energy_j_per_l=specific_energy_j_per_l(plasma_w, flow_m3h),
        total_power_w=total,
        energy_kwh_per_1000m3=energy_kwh_per_1000m3(total, flow_m3h),
        hydraulic_retention_min=hydraulic_retention_min(SUMP_VOLUME_L, SPRAY_LPM),
    )


def design_ok(s: Sizing) -> list[str]:
    """Soft checks against v1 design envelope. Empty list = within envelope."""
    issues: list[str] = []
    if not 0.8 <= s.velocity_m_s <= 3.0:
        issues.append(f"face velocity {s.velocity_m_s:.2f} m/s outside 0.8–3.0 (WESP)")
    if s.wesp_residence_s < 0.3:
        issues.append("WESP residence too short; lengthen stage or slow fan")
    if s.plasma_residence_s < 0.15:
        issues.append("plasma residence too short")
    if not 3.0 <= s.specific_energy_j_per_l <= 20.0:
        issues.append(
            f"SED {s.specific_energy_j_per_l:.1f} J/L outside 3–20 (ambient NOx/VOC + catalyst)"
        )
    if s.energy_kwh_per_1000m3 > 6.0:
        issues.append("energy intensity too high for v1 hotspot duty")
    return issues


def report(flow_m3h: float = NOMINAL_FLOW_M3H) -> str:
    s = size(flow_m3h)
    lines = [
        "VayuCell-1000 sizing",
        f"  flow                {s.flow_m3h:.0f} m³/h",
        f"  face velocity        {s.velocity_m_s:.2f} m/s",
        f"  WESP residence      {s.wesp_residence_s:.2f} s",
        f"  plasma residence     {s.plasma_residence_s:.2f} s",
        f"  catalyst residence   {s.catalyst_residence_s:.2f} s",
        f"  plasma SED          {s.specific_energy_j_per_l:.2f} J/L",
        f"  total power          {s.total_power_w:.0f} W",
        f"  energy               {s.energy_kwh_per_1000m3:.2f} kWh / 1000 m³",
        f"  sump HRT            {s.hydraulic_retention_min:.1f} min",
        f"  ozone trip           {OZONE_TRIP_PPB:.0f} ppb",
        f"  pressure drop (des) {TARGET_PRESSURE_DROP_PA:.0f} Pa",
    ]
    issues = design_ok(s)
    lines.append("  envelope             " + ("OK" if not issues else "; ".join(issues)))
    return "\n".join(lines)


if __name__ == "__main__":
    print(report())
