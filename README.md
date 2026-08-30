# VayuCell

Hotspot air purifier (WESP + humid DBD plasma + Mn–Ce catalyst) with a **1-D physics simulation**.

## Physics (read this)

Step-by-step derivation: [`docs/PHYSICS.md`](docs/PHYSICS.md)  
Full machine spec: [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md)

```bash
PYTHONPATH=. python3 -m vayucell.physics
PYTHONPATH=. python3 -m unittest tests.test_vayucell tests.test_physics -v
```

Outputs land in `sim_output/` (CSV + SVG profiles).

## What the sim is

Plug-flow along the duct: Deutsch–Anderson particle capture, lumped plasma yields (humidity shifts O₃ → OH), first-order catalyst. Not a 200-species plasma code. Chamber tests still required.
