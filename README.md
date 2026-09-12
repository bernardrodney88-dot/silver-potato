# Helios Lattice

Physics-grade **digital twins** for battery packs, gigafactory coating lines, warranties, and merchant dispatch.

Deeptech already pays Ansys, Aspen, Siemens, and independent engineers for this job. Helios Lattice is the productized kernel those buyers can run before a $250k UL campaign or a 1% scrap quarter.

## Products they will pay for

| SKU | Product | Typical price |
|---|---|---|
| HL-SAFE | Thermal-runaway containment twin | $85k/yr + $35–90k site pack |
| HL-LIFE | Warranty / RUL engine | $220k/yr min, $0.18–0.40/kWh-year |
| HL-PLANT | Coating/drying yield twin | $140k per line |
| HL-EMS | Dispatch vs degradation co-optimizer | $60k + $1.2/kW-year |
| HL-API | BMS/HIL millisecond kernel | $45k/yr |
| HL-DD | 72-hour technical diligence pack | $45–120k per asset |

Thesis, GTM, and simulation assumptions: [`docs/DEEPTECH_PLAN.md`](docs/DEEPTECH_PLAN.md).

## Run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest -q
python run.py
```

Open `http://127.0.0.1:8000`.

CLI:

```bash
PYTHONPATH=. python -m helios.cli runaway --chemistry nmc811 --htc 18
PYTHONPATH=. python -m helios.cli campaign
PYTHONPATH=. python -m helios.cli coating --speed 45 --temp 125
```

## What the kernel actually simulates

1. **Electro-thermal ECM** — temperature-dependent R0/R1, joule + entropic heat.
2. **Arrhenius thermal runaway** on a 2D cell lattice with contact conductance and convective cooling.
3. **SEI + throughput aging** → remaining useful life and warranty reserve dollars.
4. **Coating Damköhler window** → defect ppm, OEE, scrap $ / shift.
5. **Insurance loading** from cascade probability and peak temperature.

This is an engineering twin (lumped-parameter). It is meant to sit *in front of* certified tests, not replace them.
