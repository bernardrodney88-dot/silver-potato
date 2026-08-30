# Physics of VayuCell — step by step

The machine is a **plug-flow reactor**: a slug of Mumbai air travels through a 400 × 400 mm duct at about **1.74 m/s**. Nothing “cleans the sky.” Each molecule or particle either hits a collector, reacts, or leaves.

Run the numbers:

```bash
python -m vayucell.physics
```

---

## 0. The air you start with (a hotspot)

Typical construction-gate / roadside mix used in the sim:

| Species | Why it is there | Inlet |
| --- | --- | --- |
| PM2.5 | dust, exhaust, salt | 150 µg/m³ |
| NO | fresh tailpipe | 40 ppb |
| NO₂ | aged NOx | 80 ppb |
| VOC | solvents, exhaust | 300 ppb |
| O₃ | background | 20 ppb |
| H₂O | monsoon | 75% RH |

**CO₂ is ignored.** It is ~400 000 ppb. This device does not have the energy to remove it.

---

## 1. Flow (why size is not optional)

Volume flow \(Q = 1000\,\mathrm{m}^3/\mathrm{h} = 0.278\,\mathrm{m}^3/\mathrm{s}\).

Face velocity

\[
u = \frac{Q}{A} = \frac{0.278}{0.40\times 0.40} = 1.74\,\mathrm{m/s}.
\]

If \(u\) is too fast, particles fly through the WESP (Deutsch exponent collapses). If too slow, the box is huge. Residence times at this \(u\):

- WESP 0.90 m → **0.52 s**
- Plasma 0.50 m → **0.29 s**
- Catalyst 0.30 m → **0.17 s**

---

## 2. Wet ESP — electrostatic drift, not a filter

A particle of diameter \(d\) in a field \(E\) carries charge \(q\) (field charging \(\propto d^2\), diffusion charging for ultrafines). Stokes drag with Cunningham slip \(C_c\) (important below ~1 µm, where air looks molecular):

\[
w = \frac{q\, E\, C_c}{3\pi \mu d}.
\]

\(w\) is the **migration velocity** toward the plate. The Deutsch–Anderson law is the survival probability of that drift versus the time the air is in the box:

\[
\eta(d) = 1 - \exp\left(-\frac{w(d)\,A}{Q}\right).
\]

\(A\) is collection area (~5 m² of irrigated plates). **Mass collection is the integral of \(\eta(d)\) over the urban log-normal size distribution**, not a single number.

Water does three physical jobs:

1. Washes the plate so dust does not back-ionize.
2. Adds droplets that act as extra collectors (humidity boost in the sim: +~20% on \(w\) at 75% RH).
3. Absorbs soluble **NO₂** into alkaline liquor (slow first-order sink).

**Why first:** if plasma sees raw dust, dielectric gaps spark and die.

---

## 3. Humid plasma — why monsoon is a reagent

A dielectric-barrier discharge is a forest of micro-discharges. Electrons (~few eV) hit N₂, O₂, H₂O:

\[
\mathrm{e}^- + \mathrm{O}_2 \rightarrow \mathrm{O} + \mathrm{O},\qquad
\mathrm{O} + \mathrm{O}_2 + \mathrm{M} \rightarrow \mathrm{O}_3
\]

\[
\mathrm{e}^- + \mathrm{H}_2\mathrm{O} \rightarrow \mathrm{OH} + \mathrm{H},\qquad
\mathrm{O}(^1\mathrm{D}) + \mathrm{H}_2\mathrm{O} \rightarrow 2\,\mathrm{OH}.
\]

Dry air → lots of **ozone** (the thing that damages lungs).  
Wet air → yield shifts toward **OH**, the atmospheric “detergent.”

The sim encodes that as RH-linear yield scales: at 75% RH, O₃ yield ×0.6-ish, OH yield ×~2.5 versus dry.

Specific energy (how hard you hit each litre):

\[
\mathrm{SED} = \frac{P}{\dot{V}} = \frac{2000\,\mathrm{W}}{1000\,\mathrm{L}/3.6\,\mathrm{s}} = 7.2\,\mathrm{J/L}.
\]

That is **ambient** chemistry, not flue-gas incineration.

OH is consumed so fast it is **quasi-steady**:

\[
[\mathrm{OH}] = \frac{G_{\mathrm{OH}}}{k_{\mathrm{wall}} + k_{\mathrm{VOC}}[\mathrm{VOC}] + k_{\mathrm{NO}}[\mathrm{NO}]+\cdots}
\]

**Important:** bulk \(\mathrm{NO}+\mathrm{O}_3\) at outdoor ppb levels takes **minutes**. The plasma residence is 0.29 s. So the sim does **not** rely on that textbook reaction for NOx conversion. Inside each micro-discharge, O / OH / electron densities are orders of magnitude above ambient, so an **effective first-order** sink is used for NO and VOC in the plasma zone. The slow \(\mathrm{NO}+\mathrm{O}_3\) term is kept only as a small extra.

\[
\mathrm{NO} \xrightarrow{\mathrm{O},\,e^-,\,\mathrm{OH}} \mathrm{NO}_2 / \mathrm{HONO},\qquad
\mathrm{VOC} \xrightarrow{\mathrm{O},\,\mathrm{OH}} \text{oxygenates} \rightarrow \text{catalyst} \rightarrow \mathrm{CO}_2/\mathrm{H}_2\mathrm{O}.
\]

**Trap:** plasma converts NO → NO₂ and **makes ozone**. If you vent here, you have made the street worse. That is why a catalyst is not optional.

---

## 4. Catalyst — first-order destruction of the plasma’s mess

Honeycomb MnO₂–CeO₂ is a packed bed. For a species \(c\):

\[
\frac{\mathrm{d}c}{\mathrm{d}t} = -k\,c \quad\Rightarrow\quad c_{\mathrm{out}} = c_{\mathrm{in}}\,e^{-k\tau}.
\]

Ozone has a large \(k\) (must die). VOC moderate. NO₂ smaller (some surface reduction/adsorption).

Residence 0.17 s is enough for ozone if \(k \sim 25\,\mathrm{s}^{-1}\) (\(e^{-4.25}\approx 1\%\) slip in the reduced model). If the cassette is missing, the sim shows **ozone going out tens to hundreds of ppb** — a trip condition (80 ppb).

---

## 5. Why the order is physics, not branding

```
particles → (need clean gaps) → radicals → (need to kill O₃) → outlet
```

| If you skip | What the sim shows |
| --- | --- |
| WESP | PM barely moves; plasma would foul in real life |
| Plasma | Gases barely move; you are a wet dust collector only |
| Catalyst | O₃ at the mouth of the box (unsafe) |
| Dry air | More O₃, less OH, worse VOC |

---

## 6. What this model is not

- Not 200-species ZDPlasKin.
- Deutsch assumes uniform flow and no re-entrainment.
- Rate constants are order-of-magnitude, 30 °C.
- Field “20 m downwind” is **not** this 1-D duct; wind dilution dominates outdoors. Use this sim for **in-duct** design and chamber tests only.

Chamber KPI still has to be measured. The sim tells you **where to look** and **which knob** (RH, SED, catalyst \(k\), plate area).

## 7. Numbers from the current reduced-order run (Mumbai 75% RH)

| Species | In | Out | What happened |
| --- | --- | --- | --- |
| PM2.5 | 150 µg/m³ | ~few–20 µg/m³ | WESP (Deutsch + 8% sneakage) |
| NO | 40 ppb | drops | filament oxidation → NO₂ |
| NO₂ | 80 ppb | can **rise then fall** | NO→NO₂ then wet/catalyst |
| NOx | 120 ppb | modest drop | need alkaline liquor + catalyst |
| VOC | 300 ppb | ~half off | plasma fragments + catalyst |
| O₃ | 20 ppb | **< 1 ppb** with catalyst | **~10³ ppb if catalyst fails** |

That last row is the safety case: plasma without MnO₂ is an ozone cannon.

