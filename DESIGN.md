# Design

The Phase 3 visual system for Fork In The Road. This is the **target** system
the UI refresh implements — it replaces the legacy monochrome + `#e3005a`
"infrared" system documented in `promptFiles/architecture/design-system.md`
(kept for historical reference). Read `PRODUCT.md` first for register,
personality, and anti-references.

## Theme

Warm & appetizing, light-led, both modes shipped. The whole canvas is warmed
— not generic "AI parchment" cream, but neutrals tinted toward the brand's
own tomato hue (blush-leaning, hue ~35, chroma ≤0.015). Color strategy:
**full palette** — three named accent roles (tomato, saffron, olive) deployed
deliberately; tomato carries actions, the other two never compete with it.
Personality concentrates in decision moments (spin, vote reveal, empty
states); the structural frame stays calm. All color values in OKLCH.

## Colors

### Light mode (default)

| Token              | OKLCH                 | ~Hex      | Role                                  |
| ------------------ | --------------------- | --------- | ------------------------------------- |
| `--bg`             | oklch(0.965 0.008 35) | `#f9f1ee` | App background — warm blush off-white |
| `--surface`        | oklch(0.99 0.004 35)  | `#fefcfb` | Cards, modals, sheets                 |
| `--surface-sunken` | oklch(0.94 0.012 40)  | `#f1e7e1` | Wells, input backgrounds, list hover  |
| `--border`         | oklch(0.88 0.015 40)  | `#e1d2ca` | Hairlines, dividers                   |
| `--border-strong`  | oklch(0.80 0.02 38)   | `#cbb6ac` | Emphasized borders, focus-adjacent    |
| `--ink`            | oklch(0.24 0.015 35)  | `#332a26` | Primary text — warm near-black        |
| `--ink-secondary`  | oklch(0.42 0.02 35)   | `#675750` | Body/secondary text                   |
| `--ink-muted`      | oklch(0.50 0.02 35)   | `#7d6c64` | Captions, metadata (≥4.5:1 on `--bg`) |

### Accents (both modes)

| Token            | OKLCH                | ~Hex      | Role                                                                                      |
| ---------------- | -------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `--tomato`       | oklch(0.52 0.18 32)  | `#bd3e26` | Primary actions, links, active states. White text on it (≥4.5:1).                         |
| `--tomato-hover` | oklch(0.47 0.17 32)  | `#a83419` | Hover/pressed                                                                             |
| `--tomato-tint`  | oklch(0.94 0.04 32)  | `#fae3dc` | Selected rows, subtle highlights, badges                                                  |
| `--saffron`      | oklch(0.78 0.14 75)  | `#e8a33d` | Ratings, price level, warm highlights, "spinning" state. **Ink text only — never white.** |
| `--saffron-tint` | oklch(0.95 0.05 80)  | `#faecd2` | Tag/badge backgrounds                                                                     |
| `--olive`        | oklch(0.52 0.10 135) | `#4e7034` | Success, "open now", winning vote, confirmations                                          |
| `--olive-tint`   | oklch(0.94 0.04 135) | `#e3eed8` | Positive backgrounds                                                                      |

Semantic mapping: success → olive, warning → saffron, error → tomato-family
red oklch(0.50 0.19 25), info → stays a quiet blue oklch(0.55 0.12 250) used
rarely. Data viz (vote charts, weight bars) draws from the trio in order:
tomato, saffron, olive, then tints.

### Dark mode

Warm charcoal, same hue family — never a cold gray flip.

| Token | OKLCH | ~Hex |
| ------------------ | -------------------- | --------- | ----------------------------------------------- |
| `--bg` | oklch(0.20 0.012 35) | `#231c18` |
| `--surface` | oklch(0.24 0.014 35) | `#2d2420` |
| `--surface-sunken` | oklch(0.17 0.01 35) | `#1b1512` |
| `--border` | oklch(0.32 0.015 35) | `#453a34` |
| `--ink` | oklch(0.95 0.008 40) | `#f4ece7` |
| `--ink-secondary` | oklch(0.78 0.015 38) | `#c4b4ab` |
| `--ink-muted` | oklch(0.68 0.015 38) | `#a4948b` |
| `--tomato` (dark) | oklch(0.68 0.17 35) | `#f07a55` | Brightened; takes **ink-dark text**, not white. |

PWA `manifest.json` updates with the system: `theme_color` → tomato,
`background_color` → light `--bg`. `sw.js` cache version bumps when shipped.

## Typography

- **Display: Fraunces** (variable; Google Fonts via `next/font`) — expressive
  editorial serif. Optical size + SOFT/WONK axes available; WONK is the
  playful note, reserved for brand moments (decision reveal, empty states,
  the landing hero) — never in forms or data UI.
- **UI & body: Geist Sans** (already loaded) — clean, neutral counterpart.
  Pairing axis: serif display + neutral sans, one contrast axis, no third face.
- **Mono: Geist Mono** (existing) — code/admin only.

Hierarchy: Fraunces for h1/h2 and card titles of hero surfaces; Geist
weight/size discipline below that. In-app display ceiling ~`clamp(2rem, 5vw,
3.5rem)` (product register — no shouting). `text-wrap: balance` on h1–h3;
body line length ≤72ch. Existing `--text-*` scale tokens stay.

## Components

- **Buttons**: solid tomato primary (white text), quiet secondary (surface +
  border + ink), ghost tertiary. Radius `--radius-lg`. No gradients.
- **Cards** (restaurant, collection): photo-forward, `--radius-xl`, hairline
  border + `--shadow-subtle`; reserved for real container affordances — lists
  stay lists. Never nested cards.
- **Decision moment** (the hero): weighted spin + tiered-vote reveal get the
  richest treatment — Fraunces, saffron→tomato state color, the one place
  staged motion is expected. Winner state uses olive.
- **Vote/weight viz**: bars and rank chips from the accent trio + tints;
  values always labeled (color never the only signal).
- **Forms/inputs**: `--surface-sunken` fill, border-strong on focus with a
  tomato focus ring; placeholder text must hit 4.5:1.
- **Empty states**: illustration-light, copy-led (playful voice), one clear
  tomato action.

## Layout

- Mobile-first; bottom-tab app shell on small screens, top nav on desktop.
- Spacing rhythm from existing `--spacing-*` scale; vary section density —
  decision surfaces airy, lists efficient.
- Semantic z-index scale (dropdown → sticky → modal-backdrop → modal → toast
  → tooltip); no arbitrary 999s.
- Responsive grids: `repeat(auto-fit, minmax(280px, 1fr))` where grids are
  genuinely 2D; flexbox otherwise.

## Motion

- Easing: ease-out-quart/quint/expo only. No bounce, no elastic
  (anti-cartoonish guardrail).
- The decision spin and vote reveal are the two choreographed sequences;
  everything else is fast micro-transition (≤200ms opacity/transform).
- Every animation has a `prefers-reduced-motion` alternative (crossfade or
  instant) — enforced by the axe CI lane, which emulates reduced motion.

## Bans (inherited + house)

All `impeccable` absolute bans apply (no side-stripe borders, no gradient
text, no glassmorphism-by-default, no hero-metric template, no identical
card grids, no eyebrow kickers, no numbered-section scaffolding). House
additions: no confetti outside the single winner-reveal moment; no mascots;
legacy neumorphic shadow tokens (`--shadow-neumorphic-*`) are deprecated and
removed with the refresh.
