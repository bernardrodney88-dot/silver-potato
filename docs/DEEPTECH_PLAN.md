# Helios Lattice — Deeptech plan

## The idea

**Sell the digital twin that sits between a failed safety test and a balance-sheet write-down.**

Deeptech companies do not pay for "AI dashboards." They pay when software:

1. Is required by an insurer, AHJ, OEM customer, or auditor.
2. Moves a nine-figure CapEx or warranty number.
3. Replaces a test, a consultant, or a plant-stopping DOE.
4. Has a named budget owner (CFO, VP Safety, plant director) and a line item that already exists.

Helios Lattice is a **physics kernel + five SKUs** aimed at battery energy storage, cell manufacturing, and the capital that funds both. The same pattern ports later to fuel cells, power electronics, and thermal systems in data centers — same heat, aging, and insurance math.

## Why this, not a science project

| What founders pitch | What deeptech actually buys |
|---|---|
| Generative materials discovery | Process windows that cut scrap this quarter |
| Foundation models for chemistry | Calibrated twins tied to *their* cell and *their* line |
| Robot brains | HIL plant models firmware can fail against |
| Climate SaaS | Warranty reserve and insurance premium |

Ansys, COMSOL, Siemens, AspenTech, and independent engineers already extract $50k–$500k/year from these buyers. The gap is not "more CFD." The gap is **fast, decision-shaped twins** that output *containment / $ reserve / $ scrap / cycle-or-not* instead of a 40 GB mesh.

## Wedge (year 0–1)

**Lattice Safety Twin (HL-SAFE)** for BESS modules.

- Buyer: integrator safety lead + insurance broker + fire engineer.
- Trigger: UL 9540A / NFPA 855 / IEC 62619 design freeze.
- Offer: 4–24 hour containment sweep (cooling HTC × cell conductance × chemistry) + technical premium.
- Why they pay this year: one extra module abuse test is $150–400k and 10–16 weeks. A declined or loaded insurance quote can kill a project IRR.

Do not lead with "we will replace Newman P2D." Lead with **"we tell you whether this spacing and this cold plate contain a single-cell event, in dollars."**

## Expansion (same kernel)

1. **Warranty engine (HL-LIFE)** — fade from thermal map + duty cycle → 15-year reserve. Sold to CFO / VP Quality. 100 bps of reserve on 1 GWh ≈ $1.5M.
2. **Plant yield twin (HL-PLANT)** — coating/drying Damköhler window. Sold per line. 1% scrap on 20 GWh is a plant-director emergency.
3. **Dispatch co-optimizer (HL-EMS)** — cycle only when spread > degradation + warranty burn. Sold to IPPs whose year-4 SOH is the IRR.
4. **FIL API (HL-API)** — millisecond kernel for BMS firmware and lab robots.
5. **Technical diligence (HL-DD)** — 72-hour underwriting pack for PE / lenders. Cash now, logo later.

## Who writes the check

- **Cell / pack OEM** — safety + warranty (product liability).
- **Gigafactory** — yield (OpEx).
- **BESS EPC / IPP** — insurance + dispatch (project finance).
- **Insurer / broker** — catastrophe loading (their own model risk).
- **PE / project finance IE** — speed and reproducibility vs a Word report.

If a buyer cannot name the avoided test, avoided scrap, or avoided reserve, do not sell to them.

## Pricing (designed to feel cheaper than the alternative)

| SKU | Floor | How it is sold |
|---|---|---|
| HL-SAFE | $85k/yr SaaS | Plus $35–90k per site pack |
| HL-LIFE | $220k/yr | $0.18–0.40 per kWh under warranty |
| HL-PLANT | $140k / line | Plant bundle ~$400k |
| HL-EMS | $60k + $1.2/kW-yr | Through EMS vendors 30% attach |
| HL-API | $45k + usage | Firmware teams |
| HL-DD | $45–120k / asset | Services that pull SaaS |

Land with HL-DD or HL-SAFE (point of pain). Expand to HL-LIFE on the same thermal map.

## Go-to-market

1. **Design partners (n=3):** one module OEM, one 100 MWh+ IPP, one coating-line vendor. Free kernel, paid site packs, public-safe case study.
2. **Brokers as channel:** insurance MGAs already assemble "model + test" files. Give them a white-label cascade page.
3. **Standards theater:** publish a methods note aligned to UL 9540A *interpretation*, not a fake certification. Sit in NFPA/SAE working groups.
4. **Do not** sell to universities first. They do not have the budget owner.

## Simulation stack (what this repo implements)

Engineering twins, not vanity CFD:

- Temperature-dependent 1RC equivalent circuit + entropic heat.
- 2D cell lattice: contact conductance, convection, Arrhenius heat release, conversion α.
- SEI/calendar + throughput aging → RUL and warranty dollars.
- Coating line: speed/temperature/solids → ppm, OEE, scrap $.
- Monte-Carlo cooling campaign → containment rate and technical premium.

**Honesty clause:** chemistry parameters are order-of-magnitude (NMC vs LFP onset and enthalpy). Production deals require calibration against the customer's HPPC, ARC, and 9540A coupons. That calibration *is* the lock-in.

## 18-month operating plan (technical, not calendar theater)

**Slice A — kernel credibility**

- Freeze public NMC/LFP/NCA presets.
- Add customer calibration file (HPPC + ARC → Ea, H, R0(T)).
- Uncertainty bands on cascade fraction.

**Slice B — Safety Twin sold**

- PDF underwriting pack (this code's JSON is the body).
- Compare two designs: "add 8 W/m²K vs add 4 mm spacing."
- First paid site: one module drawing.

**Slice C — money SKUs**

- Warranty engine on the same thermal map.
- Coating window with MES CSV ingest.
- EMS API: `POST /should-cycle`.

**Slice D — platform**

- On-prem air-gap for OEMs.
- Audit log of every sim used in a warranty memo.
- SOC 2 (buyers in auto/energy will stall without it).

## What not to build

- A general "AI scientist."
- Full CFD in the first SKU.
- A marketplace of materials.
- Crypto, tokens, or "decentralized lab."

## Capital intensity

This is **software with a physics moat**, not a fab. Burn is calibration engineers + 2 PhD-level modelers + 1 domain salesperson who has sold into UL/insurance, not 40 ML researchers.

## Success test

A safety engineer forwards the cascade plot to an insurer and the premium comes back *lower* than last year's, or a CFO cuts reserve after a calibrated RUL run. If neither happens, the physics is a demo, not a company.

## Portability (after battery)

Same product motion:

- Power-electronics thermal + solder fatigue (data center / EV inverter).
- PEM fuel-cell membrane dry-out.
- Thermal runaway of grid transformers / SF6 alternatives.

Do not rename the company until one SKU is at $2M+ ARR.
