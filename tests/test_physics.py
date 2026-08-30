import tempfile
import unittest
from pathlib import Path

from vayucell.physics import (
    SimConfig,
    peak_o3_in_plasma,
    reduction,
    run_campaign,
    simulate,
)


class PhysicsSimTests(unittest.TestCase):
    def test_nominal_pm_and_ozone(self):
        r = simulate(SimConfig(rh_pct=75.0))
        self.assertGreater(reduction(r.inlet["pm25"], r.outlet["pm25"]), 70.0)
        self.assertLess(r.outlet["o3"], 50.0)
        self.assertLess(r.outlet["voc"], r.inlet["voc"])

    def test_catalyst_fail_ozone_slip(self):
        ok = simulate(SimConfig(catalyst_on=True))
        bad = simulate(SimConfig(catalyst_on=False))
        self.assertGreater(bad.outlet["o3"], ok.outlet["o3"])
        self.assertGreater(bad.outlet["o3"], 50.0)

    def test_wesp_off_leaves_pm(self):
        off = simulate(SimConfig(wesp_on=False))
        on = simulate(SimConfig(wesp_on=True))
        self.assertGreater(off.outlet["pm25"], on.outlet["pm25"] * 2)

    def test_dry_air_makes_more_plasma_ozone(self):
        wet = simulate(SimConfig(rh_pct=75.0))
        dry = simulate(SimConfig(rh_pct=25.0))
        self.assertGreater(peak_o3_in_plasma(dry), peak_o3_in_plasma(wet))

    def test_campaign_writes_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            run_campaign(Path(tmp))
            self.assertTrue((Path(tmp) / "mumbai_nominal.svg").exists())
            self.assertTrue((Path(tmp) / "summary.txt").exists())


if __name__ == "__main__":
    unittest.main()
