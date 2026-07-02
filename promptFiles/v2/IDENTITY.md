# Fork In The Road v2 — Identity: "Tonight's board"

_Authored by Fable, 2026-07-02. This is the committed v2 design direction —
the single source of intent behind `src/app/(v2)/v2.css` and every v2
surface. The craft bar (contrast, states, motion discipline, anti-slop) is
DESIGN-UI-UX-SKILLS.md; this file is the direction that bar measures._

## The idea

A fork in the road picks a **destination**. The moment this product owns is
the split second the debate ends — "okay, we're doing this" — and the closest
physical artifact to that feeling is a **departure board flipping to your
gate**. v2's identity is built on that: a calm, confident, paper-and-ink
frame for everything you do _before_ the decision, and one electric,
signage-lit moment when the decision lands.

Two registers, strictly enforced:

1. **The frame (calm).** Green-tinted paper, deep bottle-green ink,
   hairline rules, generous space. Reads like good menu design — quiet,
   appetizing, trustworthy. Nothing in the frame shouts.
2. **The board (electric).** The reveal surface is **always dark in both
   modes** — a lit sign embedded in the page. Gold lives here. When a Fork
   resolves, the board flips and floods gold. Because the frame never uses
   gold decoratively, the moment lands every time.

**The accent is rationed.** Gold appears only at decision points: the
primary action of a screen, the live tally, the winner. If gold is on a
screen twice for two different reasons, one of them is wrong.

## Palette (OKLCH; every pair below WCAG-verified 2026-07-02)

Neutrals are tinted toward the green hue family (H 120–155) per the manual —
no flat gray, no warm-cream cliché. Values are law; derive, don't improvise.

### Light ("daytime menu")

| Token           | Value                    | ≈ Hex     | Role                                                                                                           |
| --------------- | ------------------------ | --------- | -------------------------------------------------------------------------------------------------------------- |
| `canvas`        | `oklch(0.985 0.006 120)` | `#f9fbf6` | page background                                                                                                |
| `surface`       | `oklch(1 0 0)`           | `#ffffff` | cards, sheets, inputs                                                                                          |
| `sunken`        | `oklch(0.955 0.01 120)`  | `#eff1ea` | wells, hover fills, skeleton base                                                                              |
| `ink`           | `oklch(0.26 0.04 155)`   | `#132a1b` | primary text — bottle green, not black                                                                         |
| `ink-secondary` | `oklch(0.42 0.03 155)`   | `#405246` | supporting text (8.0:1)                                                                                        |
| `ink-muted`     | `oklch(0.5 0.025 155)`   | `#58685d` | captions, placeholders (5.7:1 — passes 4.5)                                                                    |
| `line`          | `oklch(0.88 0.012 130)`  | `#d5d9d1` | decorative hairlines only (non-semantic)                                                                       |
| `line-strong`   | `oklch(0.62 0.02 145)`   | `#7f8a7f` | input borders — 3.5:1, passes 1.4.11                                                                           |
| `gold`          | `oklch(0.8 0.16 85)`     | `#edb417` | **fill only** in light mode, gold-ink text on it (8.1:1)                                                       |
| `gold-ink`      | `oklch(0.26 0.04 155)`   | `#132a1b` | the label ON gold — **mode-invariant** (8.1:1 light, 8.7:1 dark; plain `ink` flips to white in dark and fails) |
| `brass`         | `oklch(0.52 0.11 75)`    | `#8d5e00` | gold's text-safe shade: links, focus ring (5.4:1)                                                              |
| `danger`        | `oklch(0.5 0.19 25)`     | `#b71824` | destructive only (6.4:1)                                                                                       |

### Dark ("the board at night")

| Token           | Value                   | ≈ Hex     | Notes                                                |
| --------------- | ----------------------- | --------- | ---------------------------------------------------- |
| `canvas`        | `oklch(0.19 0.02 155)`  | `#0c1610` | near-black bottle green, never pure black            |
| `surface`       | `oklch(0.23 0.02 155)`  | `#152019` | elevation by lightness, not shadow                   |
| `sunken`        | `oklch(0.27 0.022 155)` | `#1e2a22` | raised/hover step (ladder inverts: higher = lighter) |
| `ink`           | `oklch(0.96 0.01 110)`  | `#f2f2eb` | warm off-white (16.4:1)                              |
| `ink-secondary` | `oklch(0.8 0.015 130)`  | —         | derived: muted +0.08 L                               |
| `ink-muted`     | `oklch(0.72 0.02 130)`  | `#a0a79a` | 6.8:1 on surface                                     |
| `line`          | `oklch(1 0 0 / 0.09)`   | —         | semi-transparent hairline                            |
| `line-strong`   | `oklch(0.56 0.02 145)`  | `#6d786d` | 4.0:1 input borders                                  |
| `gold`          | `oklch(0.82 0.15 85)`   | `#f0bb3b` | text-capable in dark (10.4:1) — links, ring, fills   |
| `brass`         | = `gold`                | —         | brass collapses into gold in dark mode               |
| `danger`        | `oklch(0.7 0.16 25)`    | `#f2716a` | 5.9:1                                                |

### The board (mode-invariant)

| Token         | Value                   | ≈ Hex              |
| ------------- | ----------------------- | ------------------ |
| `board`       | `oklch(0.21 0.03 155)`  | `#0c1c12`          |
| `board-ink`   | `oklch(0.95 0.012 110)` | `#efefe6` (15.2:1) |
| `board-muted` | `oklch(0.7 0.02 130)`   | `#9aa194` (6.6:1)  |
| gold on board | 10.0:1                  |                    |

Rules of use:

- **Light mode gold is never text and never a lone boundary** (1.8:1 on
  canvas) — it is a fill with ink on top (the "taxi light" button), and
  brass carries gold's meaning wherever text-weight is needed.
- Status colors: `danger` for destructive/errors; success is expressed with
  the frame's own green (`ink` weight + a check icon), not a new hue; the
  one "live/attention" color is gold. Color is never the only signal.
- Shadows are tinted toward H 155, layered, low-opacity; dark mode elevates
  by lightness, not shadow.

## Typography

Two families on a hard contrast axis, both variable, via `next/font/google`:

- **Archivo** (`wght` 100–900 + `wdth` 62–125) — display AND body. One
  family, many voices: UI text at width 100/regular; **board and display
  moments compress** — condensed (wdth ~70–75), heavy (wght 750–850),
  uppercase, tracked +0.02–0.06em — the departure-board register. The width
  axis is the identity's kinetic signature: type itself can tighten like a
  flap tile. Grotesque, signage-born, not an AI-default face.
- **Spline Sans Mono** — data with ticket energy: fork codes (`F-7KQ2`),
  countdowns, tallies, weights, timestamps. Always `tabular-nums`.

Scale (px, 1.25 base, hand-tuned): `12 · 14 · 16 · 20 · 24 · 30 · 38 · 48`.
Body 16/1.5; headings 1.15–1.25; display caps 1.0–1.05 with negative
tracking only when NOT condensed-caps (condensed caps track loose, never
tight). Weights: 400 body / 600 emphasis / 750–850 display. Never below 400.

## Motion: "decisive snap"

The product is about ending deliberation — motion never dawdles.

- Micro (press, hover, focus): 100–150ms. Standard (menus, tabs, fades):
  160–240ms. Macro (sheet, dialog): 240–360ms. Exits ≈ 75% of enters.
- Curve: `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint) enter,
  ease-in exit. No bounce, no elastic, anywhere in UI chrome.
- Press feedback: `scale(0.97)`.
- **The one sanctioned macro moment is the reveal** (~1.4–2.2s): flap
  cycles decelerate on the board, lock on the winner, gold floods. It is
  skippable by tap and collapses to a crossfade under
  `prefers-reduced-motion`. Nothing else in the product may cost >500ms.
- Motion is opt-in (`prefers-reduced-motion: no-preference` gates all
  spatial animation); transform/opacity only.

## Voice

The friend who ends the debate: decisive, warm, five words when five words
do. Sentence case everywhere.

- Verbs own the buttons: **"Fork it" · "Lock it in" · "Spin again" ·
  "Cast your vote" · "Keep this one"** — never "Submit/OK/Yes".
- The result speaks as the group: **"We're going here."**
- Time is concrete: "Closes in 12:40", not "expiring soon".
- Empty states are invitations with one action ("No lists yet. Save a place
  and start one."); errors say what happened and what to do, no apologies,
  no exclamation marks. No buzzwords, no em-dash tic, no title case.

## The signature: the split-flap reveal

Candidate names cycle on the board as flap rows, decelerate, and lock onto
the winner; the winning row floods gold; the runner-up context ("why this
pick") settles in quietly beneath. This is the product's one aesthetic risk
and its most shareable moment — everything else stays disciplined so it can
own the stage. Component: `src/components/v2/ui/Reveal.tsx` (Phase 2
prototype; wired to real Forks in Phase 3).

## Explored and rejected (so nobody re-litigates silently)

- **Evolving v1's tomato/saffron/olive warmth** — charter forbids it; also
  warm-cream + terracotta is the single most recognizable AI-default look.
- **Near-black + acid green / neon "after dark" app** — second AI-default
  cluster; also dark-led contradicts the owner's light-led preference.
- **Broadsheet/editorial hairline newspaper** — third AI-default cluster;
  wrong energy (contemplative, not decisive).
- **Red/pin "X marks the spot"** — decisive but collides with v1's red
  family and with danger semantics.
- Chosen: **bottle green + paper + rationed gold**, signage vernacular. The
  structure (green as the _frame_, one metallic accent that only marks
  decisions, a mode-invariant dark board) is the ownable part — not any one
  swatch.
