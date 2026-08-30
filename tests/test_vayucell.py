import unittest

from vayucell.controller import (
    OZONE_TRIP_PPB,
    Controller,
    Fault,
    Sensors,
    State,
)
from vayucell.sizing import design_ok, size, specific_energy_j_per_l, velocity_m_s


class SizingTests(unittest.TestCase):
    def test_nominal_envelope(self):
        s = size(1000)
        self.assertAlmostEqual(s.velocity_m_s, 1.736, places=2)
        self.assertAlmostEqual(s.specific_energy_j_per_l, 7.2, places=1)
        self.assertEqual(design_ok(s), [])

    def test_sed_formula(self):
        # 2000 W at 1000 m³/h = 2000 / (1000*1000/3600) = 7.2 J/L
        self.assertAlmostEqual(specific_energy_j_per_l(2000, 1000), 7.2, places=5)

    def test_velocity_rejects_zero_area(self):
        with self.assertRaises(ValueError):
            velocity_m_s(1000, 0, 0.4)

    def test_flow_bounds(self):
        with self.assertRaises(ValueError):
            size(50)


class ControllerTests(unittest.TestCase):
    def test_happy_path_to_run(self):
        c = Controller()
        s = Sensors()
        c.step(s, cmd_start=True)
        self.assertEqual(c.state, State.STANDBY)
        for _ in range(12):
            c.step(s)
        self.assertEqual(c.state, State.RUN)
        self.assertTrue(c.actuators.plasma)
        self.assertTrue(c.actuators.wesp_hv)

    def test_ozone_trips_plasma_and_wesp(self):
        c = Controller()
        s = Sensors()
        c.step(s, cmd_start=True)
        for _ in range(12):
            c.step(s)
        s.ozone_out_ppb = OZONE_TRIP_PPB
        c.step(s)
        self.assertEqual(c.state, State.FAULT)
        self.assertEqual(c.fault, Fault.OZONE)
        self.assertFalse(c.actuators.plasma)
        self.assertFalse(c.actuators.wesp_hv)
        self.assertTrue(c.actuators.fan)

    def test_door_blocks_hv(self):
        c = Controller()
        s = Sensors()
        c.step(s, cmd_start=True)
        for _ in range(12):
            c.step(s)
        s.door_closed = False
        c.step(s)
        self.assertEqual(c.fault, Fault.DOOR)
        self.assertFalse(c.actuators.plasma)

    def test_e_stop(self):
        c = Controller()
        s = Sensors(e_stop=True)
        c.step(s, cmd_start=True)
        c.step(s)
        # start moves to STANDBY then next step should fault
        c.step(s)
        self.assertTrue(c.state in (State.FAULT, State.STANDBY, State.PREPURGE, State.OFF))


if __name__ == "__main__":
    unittest.main()
