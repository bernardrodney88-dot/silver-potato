"""Sellable SKUs — what deeptech buyers already have budget line items for."""

from __future__ import annotations

PRODUCTS: list[dict] = [
    {
        "sku": "HL-SAFE",
        "name": "Lattice Safety Twin",
        "buyer": "BESS OEM / EPC / fire engineer / insurer",
        "job": "Predict cell-to-module thermal runaway containment vs cooling, spacing, and chemistry.",
        "replaces": "One extra UL 9540A module test campaign + spreadsheet fire notes",
        "price_usd_year": 85_000,
        "price_note": "Site pack $35–90k; fleet SaaS $85k+",
        "why_they_pay": "A single propagation event is a total-loss project. Insurers and AHJs now demand modeled heat release, not a PDF from last year's lab.",
        "budget_owner": "CTO + Head of Safety + Insurance broker",
        "payback": "Avoided test ($150–400k) or one declined premium (1–3% of limit).",
    },
    {
        "sku": "HL-LIFE",
        "name": "Lattice Warranty Engine",
        "buyer": "Cell OEM finance, ESS integrator, auto OEM battery team",
        "job": "Translate duty cycle + thermal map into 8/10/15-year SOH and reserve dollars.",
        "replaces": "Static 70% SOH warranty guess and over-accrual",
        "price_usd_year": 220_000,
        "price_note": "$0.18–0.40 / kWh under warranty / year, min $220k",
        "why_they_pay": "Warranty is 3–8% of pack cost sitting on the balance sheet. CFOs will fund any model that defensibly cuts 100 bps of reserve.",
        "budget_owner": "CFO + VP Quality",
        "payback": "100 bps reserve on a 1 GWh book = ~$1.5M.",
    },
    {
        "sku": "HL-PLANT",
        "name": "Lattice Plant Yield Twin",
        "buyer": "Gigafactory process engineering",
        "job": "Coating/drying operating window, defect ppm, scrap $ / shift.",
        "replaces": "Offline DOE in Excel + tribal knowledge on the coater",
        "price_usd_year": 140_000,
        "price_note": "Per line $140k; plant $400k+",
        "why_they_pay": "1% scrap on a 20 GWh plant is tens of millions. Plants already pay Aspen/Siemens; they will pay a line-specific twin that talks to MES.",
        "budget_owner": "Plant director + process engineering",
        "payback": "Sub-week if it saves one wasted campaign of foil.",
    },
    {
        "sku": "HL-EMS",
        "name": "Lattice Dispatch Co-optimizer",
        "buyer": "IPP / asset manager / EMS vendor",
        "job": "Cycle only when spread > degradation + warranty burn.",
        "replaces": "Revenue-max EMS that murders packs in year 4",
        "price_usd_year": 60_000,
        "price_note": "$60k + $1.2/kW-year",
        "why_they_pay": "Merchant BESS IRRs are now degradation-limited. Funds will pay to stop stupid cycling.",
        "budget_owner": "Asset manager",
        "payback": "One summer of avoided overcycle.",
    },
    {
        "sku": "HL-API",
        "name": "Lattice FIL / BMS-in-the-loop API",
        "buyer": "BMS firmware, robotics, lab automation",
        "job": "Millisecond electro-thermal kernel for HIL, SIL, and agent training.",
        "replaces": "In-house MATLAB that only one PhD understands",
        "price_usd_year": 45_000,
        "price_note": "Usage: $0.02 / 1k sim-seconds",
        "why_they_pay": "Firmware teams cannot ship thermal-derate logic without a plant model. This is the same motion that Ansys Twin Builder sells, at cell-pack fidelity.",
        "budget_owner": "Firmware director",
        "payback": "One field recall avoided.",
    },
    {
        "sku": "HL-DD",
        "name": "Lattice Technical Diligence",
        "buyer": "PE / project finance / insurers",
        "job": "72-hour underwriting pack: cascade, RUL, reserve, premium.",
        "replaces": "Two-week consultant binder",
        "price_usd_year": 0,
        "price_note": "$45–120k per asset; retainers $250k",
        "why_they_pay": "Lenders already buy independent engineers. A reproducible twin is a better IE.",
        "budget_owner": "Investment committee",
        "payback": "Deal speed and tighter insurance.",
    },
]


def catalog() -> list[dict]:
    return PRODUCTS
