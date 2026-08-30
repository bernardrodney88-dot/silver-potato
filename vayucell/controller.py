"""VayuCell safety PLC logic (software spec + simulator).

Hardware mapping is in docs/SYSTEM_DESIGN.md. This module is the executable
truth for interlocks: plasma and WESP HV never run unless permissives are true.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum, auto


OZONE_TRIP_PPB = 80.0
OZONE_WARN_PPB = 50.0
SUMP_LEVEL_MIN_PCT = 35.0
SUMP_LEVEL_MAX_PCT = 95.0
PH_MIN = 6.0
PH_MAX = 9.5
DELTA_P_MAX_PA = 900.0
DOOR_CLOSED = True


class State(Enum):
    OFF = auto()
    STANDBY = auto()
    PREPURGE = auto()
    WESP_ON = auto()
    PLASMA_ON = auto()
    RUN = auto()
    FAULT = auto()
    SHUTDOWN = auto()


class Fault(Enum):
    NONE = auto()
    OZONE = auto()
    DOOR = auto()
    LEVEL = auto()
    PH = auto()
    DELTA_P = auto()
    E_STOP = auto()
    HV_FAULT = auto()
    LEAK = auto()


@dataclass
class Sensors:
    ozone_out_ppb: float = 0.0
    no2_out_ppb: float = 0.0
    pm25_out_ugm3: float = 0.0
    rh_pct: float = 75.0
    temp_c: float = 30.0
    delta_p_pa: float = 400.0
    sump_level_pct: float = 60.0
    ph: float = 7.5
    door_closed: bool = True
    e_stop: bool = False
    leak: bool = False
    hv_ok: bool = True
    fan_ok: bool = True
    pump_ok: bool = True


@dataclass
class Actuators:
    fan: bool = False
    pump: bool = False
    wesp_hv: bool = False
    plasma: bool = False
    blowdown: bool = False
    caustic_dosing: bool = False
    beacon: str = "off"


@dataclass
class Controller:
    state: State = State.OFF
    fault: Fault = Fault.NONE
    purge_ticks: int = 0
    actuators: Actuators = field(default_factory=Actuators)

    def permissives(self, s: Sensors) -> Fault:
        if s.e_stop:
            return Fault.E_STOP
        if s.leak:
            return Fault.LEAK
        if not s.door_closed:
            return Fault.DOOR
        if not s.hv_ok:
            return Fault.HV_FAULT
        if not (SUMP_LEVEL_MIN_PCT <= s.sump_level_pct <= SUMP_LEVEL_MAX_PCT):
            return Fault.LEVEL
        if not (PH_MIN <= s.ph <= PH_MAX):
            return Fault.PH
        if s.delta_p_pa > DELTA_P_MAX_PA:
            return Fault.DELTA_P
        if s.ozone_out_ppb >= OZONE_TRIP_PPB:
            return Fault.OZONE
        return Fault.NONE

    def _all_hv_off(self) -> None:
        self.actuators.wesp_hv = False
        self.actuators.plasma = False

    def _safe_idle(self) -> None:
        self._all_hv_off()
        self.actuators.fan = False
        self.actuators.pump = False
        self.actuators.blowdown = False
        self.actuators.caustic_dosing = False
        self.actuators.beacon = "off"

    def step(self, s: Sensors, cmd_start: bool = False, cmd_stop: bool = False) -> State:
        f = self.permissives(s)
        if f is not Fault.NONE and self.state not in (State.OFF, State.FAULT, State.SHUTDOWN):
            self.fault = f
            self.state = State.FAULT
            self._all_hv_off()
            self.actuators.fan = True  # purge remaining ozone
            self.actuators.pump = False
            self.actuators.beacon = "red"
            return self.state

        if self.state == State.OFF:
            self._safe_idle()
            if cmd_start:
                self.state = State.STANDBY
                self.fault = Fault.NONE
                self.actuators.beacon = "amber"

        elif self.state == State.STANDBY:
            if cmd_stop:
                self.state = State.OFF
            else:
                self.actuators.pump = True
                self.actuators.fan = True
                self.purge_ticks = 0
                self.state = State.PREPURGE

        elif self.state == State.PREPURGE:
            self.actuators.fan = True
            self.actuators.pump = True
            self.purge_ticks += 1
            if cmd_stop:
                self.state = State.SHUTDOWN
            elif self.purge_ticks >= 5:
                self.state = State.WESP_ON

        elif self.state == State.WESP_ON:
            self.actuators.fan = True
            self.actuators.pump = True
            self.actuators.wesp_hv = True
            self.actuators.plasma = False
            self.actuators.beacon = "amber"
            if cmd_stop:
                self.state = State.SHUTDOWN
            else:
                self.state = State.PLASMA_ON

        elif self.state == State.PLASMA_ON:
            self.actuators.fan = True
            self.actuators.pump = True
            self.actuators.wesp_hv = True
            self.actuators.plasma = True
            if cmd_stop:
                self.state = State.SHUTDOWN
            else:
                self.state = State.RUN

        elif self.state == State.RUN:
            self.actuators.fan = True
            self.actuators.pump = True
            self.actuators.wesp_hv = True
            self.actuators.plasma = True
            self.actuators.beacon = "green"
            self.actuators.caustic_dosing = s.ph < 6.8
            self.actuators.blowdown = s.sump_level_pct > 85.0 or s.ph < 6.2
            if cmd_stop:
                self.state = State.SHUTDOWN
            if s.ozone_out_ppb >= OZONE_WARN_PPB:
                self.actuators.plasma = False  # degrade: WESP-only
                self.actuators.beacon = "amber"

        elif self.state == State.FAULT:
            self._all_hv_off()
            self.actuators.fan = True
            self.actuators.beacon = "red"
            if cmd_stop:
                self.state = State.SHUTDOWN

        elif self.state == State.SHUTDOWN:
            self._all_hv_off()
            self.actuators.pump = False
            self.actuators.fan = True
            self.purge_ticks += 1
            if self.purge_ticks >= 8:
                self.actuators.fan = False
                self.state = State.OFF
                self.purge_ticks = 0
                self.actuators.beacon = "off"

        return self.state
