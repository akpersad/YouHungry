# The Design Engineering Manual

**A portable, self-contained UI/UX expertise reference for AI coding agents.**

This document exists to make whatever agent reads it design like a **senior product
designer-engineer with ~10 years of daily practice** — someone with taste, opinions, and a
library of concrete numbers in their head. It is deliberately heavy on *specifics* (px, ms,
ratios, hex/oklch, cubic-beziers) because taste, operationally, is a thousand small correct
defaults applied consistently. Read it before designing or reviewing any user-facing interface.

It is biased toward what this author builds most: **mobile-first Progressive Web Apps that
must also look beautiful and intentional at desktop sizes.** But the foundations apply to any
web UI.

> **How this file is organized.** Part I is *judgment* (mindset, process). Part II is the
> *craft* (foundations, motion, responsive, PWA, a11y, performance) — the numbers. Part III is
> *enforcement* (anti-slop tells, checklists). Part IV is *reference data* you can copy from.
> Part V is the worked example (a real shipped system). Part VI is the catalog of installed
> design **skills** — the hands-on tools that apply this same philosophy.
>
> Sources for the researched claims are listed at the end of the relevant sections. Where
> respected sources disagree, the disagreement is flagged rather than hidden — a real expert
> knows where the rules are soft.

---

## Table of contents

**Part I — Judgment**
1. The operating mindset
2. The design process

**Part II — Craft (the numbers)**
3. Color
4. Typography
5. Spacing & layout
6. Shadows, elevation, surfaces, radius
7. Design tokens
8. Motion & interaction
9. Mobile-first & responsive
10. PWA craft
11. Accessibility (WCAG 2.2)
12. Performance (Core Web Vitals)

**Part III — Enforcement**
13. The anti-slop catalogue (AI/template tells + fixes)
14. Checklists (pre-flight, polish, audit)

**Part IV — Reference data**
15. Font pairings, palettes, scales, framework mapping

**Part V — Worked example**
16. Pawscriptions "Tri-color Aussie" system

**Part VI — Tools**
17. The installed design-skills catalog

---

# PART I — JUDGMENT

## 1. The operating mindset

**You are not decorating; you are making decisions.** Every element must earn its pixels. If you
can't say in one sentence *why* something is there (hierarchy, feedback, state, story,
affordance), remove it. "It looks empty" is not a reason to add; whitespace is a feature.

**Taste is trained, not innate.** It comes from sweating details others ignore. The compounding
of a thousand barely-perceptible correct choices — tinted shadow instead of black, 1.25 line
gap instead of 1.0, ease-out instead of linear — is what reads as "expensive." No single one is
visible; together they sing.

**The squint test.** Blur your eyes (or actually squint at a screenshot). Can you still identify
the single most important element, then the secondary ones, then the groupings? If everything
has the same weight, you have no hierarchy — fix that before anything else. Body text should
read as an even gray texture with no dark clumps or light holes.

**Default to restraint.** One accent color. Two font families max. Fewer borders. Fewer shadows.
Shorter animations. The premium house styles (Linear, Stripe, Vercel, Things, Linear) are
mostly black/white/gray + a single accent doing all the work. Loud is easy; quiet-but-confident
is the skill.

**Intentionality over symmetry.** Centered-everything, three-equal-cards, uniform spacing — these
are the *defaults* an interface falls into when no one is deciding. A designed interface has a
clear focal point, asymmetry where it serves the content, and spacing that varies with meaning.

**Design the unhappy paths.** The single biggest tell that separates "generated" from "built"
is the presence of **empty, loading, and error states**, plus real form validation. Amateurs
design the happy path; professionals design what happens when there's no data, slow data, bad
input, and no network. Budget for these from the start — they are not polish, they are the work.

**Respect the human on the other end.** Their device, their thumb, their eyesight, their network,
their OS preferences (`prefers-reduced-motion`, `prefers-color-scheme`, `prefers-contrast`),
their assistive tech. Accessibility and performance are not a compliance pass at the end — they
are the same discipline (respecting constraints you don't control) and they make the product
feel better for *everyone*. Bake them in from the first commit.

**Consistency is a system, not a vibe.** When something looks off, the fix is usually "it
drifted from the system," not "add decoration." Name the drift, fix the root cause (the token,
the component), not the one screen.

## 2. The design process

A repeatable sequence. Don't skip to pixels.

1. **Understand the job.** What is the user trying to *do*, in what context (one-handed on a
   phone? at a desk?), how often? Frequency drives everything downstream — a thing done 100×/day
   gets zero animation and maximum density; a thing done once gets room to breathe and delight.

2. **Shape the flow before the visuals.** Decide information architecture, the screens, the
   states, and the primary action per screen. Sketch in words or boxes. Confirm the brief.

3. **Set the foundations (tokens) once.** Color ramp, type scale, spacing scale, radius scale,
   elevation scale, motion tokens. Everything later references these. (Parts II.3–II.7.) Reuse
   an existing system if one exists — preserve committed brand decisions, don't reinvent them.

4. **Build to production quality, not prototype.** Semantic HTML, real content (not lorem), the
   design system applied consistently, **all interaction states**, responsive at every
   breakpoint, accessible, smooth motion. Card grids and centered heroes are the lazy answer —
   reach for them only when they're genuinely the best affordance.

5. **Iterate visually with evidence.** Screenshot it. Squint. Check it at 360px, 768px, 1280px.
   Check dark mode. Check keyboard focus. Tooling output (axe, Lighthouse, a contrast checker)
   is *evidence*, never proof — your eyes make the call.

6. **Polish last, and only once it's functionally complete.** Polish is alignment to the system
   and the removal of friction, not a coat of decoration over a broken layout. (Checklist in §14.)

**Priority order when improving an existing UI** (biggest lift first): typography → spacing &
rhythm → color refinement → motion layer → focal/hero recomposition → wholesale block
replacement. Fixing type and spacing alone rescues most "cheap-looking" interfaces.

---

# PART II — CRAFT (THE NUMBERS)

## 3. Color

**Use OKLCH (or at least HSL), never raw hex you can't reason about.** OKLCH is perceptually
uniform: equal lightness values look equally light across *all* hues. In HSL, `50%` lightness
yellow is far brighter than `50%` blue, which silently breaks contrast when you swap an accent.
OKLCH is `oklch(L C H)` — L 0–1 (perceived lightness), C ~0–0.4 (chroma/saturation), H 0–360.

```css
oklch(0.8 0.12 100);   /* yellow */
oklch(0.8 0.12 225);   /* blue — genuinely the same perceived lightness */

/* Relative color: darken on hover, keep hue + chroma */
background: oklch(from var(--accent) calc(l - 0.08) c h);
```

Wide-gamut P3 offers ~30% more color than sRGB; bump chroma inside `@media (color-gamut: p3)`.

**Pure black and flat gray look cheap.** Pure-black (`#000`) shadows and text never occur in
nature — real shadows take the hue of the surface and ambient light; pure black-on-white is
harsh and glary. Flat 0-chroma gray looks dead. **Tint neutrals and shadows toward the brand
hue** — add a little chroma (≈0.005–0.02 in OKLCH, or build HSL neutrals off the brand hue at
low saturation). This single move is one of the strongest "designed, not defaulted" signals.

```css
/* Tinted-neutral system built off one brand hue */
--brand-hue: 250;
--surface:  oklch(0.99 0.004 var(--brand-hue));  /* near-white, faintly tinted */
--ink:      oklch(0.27 0.02  var(--brand-hue));   /* near-black, faintly tinted  */
--muted:    oklch(0.55 0.02  var(--brand-hue));
```

**Palette structure.** Define more shades than you think you need:
- **Neutrals:** 8–11 shades (backgrounds, surfaces, borders, three tiers of text).
- **Primary/brand:** 5–10 shades; the mid shade is your button/link color.
- **Semantic:** success / warning / error / info, 2–3 shades each.
- **Surfaces:** 2–3 elevation levels.

**The 60-30-10 rule** (by visual weight, not pixel count): ~60% neutral/background, ~30%
secondary (text, inactive), ~10% accent (CTAs, focus, active). The accent is powerful *because*
it's rare. Inactive states never carry full-saturation color.

**Four color strategies — pick one deliberately:**
1. **Restrained** — tinted neutrals + one accent ≤10%. *The product-app default.*
2. **Committed** — one saturated color carries 30–60% of the surface. Brand-forward.
3. **Full palette** — 3–4 named roles, each used deliberately. Campaigns.
4. **Drenched** — the surface *is* the color. Brand heroes.

**Dark mode done right** (it is not "invert the colors"):
- **Never pure black.** Material's baseline dark surface is **`#121212`**; near-black
  (`oklch(~0.18–0.22)`) shows elevation and is less eye-straining.
- **Elevation by lightness, not (only) shadow** — higher surfaces get *lighter*. Material
  composites a white overlay scaled to elevation (1dp≈5%, 2dp≈7%, 8dp≈12%, 24dp≈16%): from
  `#121212`, a level-1 card ≈ `#1E1E1E`, level-2 ≈ `#242424`.
- **Desaturate/lighten accents** in dark mode — vivid saturated colors vibrate on dark.
- Text emphasis by opacity: high ≈ 87%, medium ≈ 60%, disabled ≈ 38% (or distinct ink tokens).
- Bump body line-height +0.05 and consider stepping body weight up one notch — light-on-dark
  text reads thinner than dark-on-light.

**Contrast (WCAG 2.2 — bake in as hard defaults):**
- Body text vs background **≥ 4.5:1** (AA); **≥ 7:1** for AAA.
- Large text (≥ 24px, or ≥ 18.66px bold) **≥ 3:1** (AA).
- **Non-text** — UI component boundaries (input borders, toggle states), focus rings, and
  meaningful icons/graphics **≥ 3:1** (1.4.11). The most-forgotten one: a faint 1px input border
  at 1.5:1 fails.
- Placeholder text must also hit 4.5:1 — the default muted-gray-on-tinted-white usually fails.
- Gray text on a *colored* background looks washed out and often fails — use a darker shade of
  the background's own hue, or near-white, instead of gray.
- Heuristic: keep ~40–50% OKLCH-lightness difference between text and surface to stay safe.

**Color is never the only signal (1.4.1).** ~1 in 12 men has color-vision deficiency. Pair color
with an icon, text, shape, or position: error fields get an icon + message (not just a red
border); "due/overdue" gets a label, not just a hue; chart series get labels/textures.

*Sources: Josh Comeau (Color Formats), Evil Martians (OKLCH in CSS), web.dev (Building a color
scheme), Refactoring UI, Material dark-theme spec, WebAIM/WCAG 2.2.*

## 4. Typography

Typography is the highest-leverage lever — fixing it rescues most "cheap" interfaces.

**Type scale — start from a ratio, then hand-tune to clean values.**

| Ratio | Name | Best for |
|---|---|---|
| 1.125 | Major second | text-heavy apps, dense data |
| 1.200 | Minor third | dashboards, dense UI |
| **1.250** | **Major third** | **versatile web-UI default** |
| 1.333 | Perfect fourth | marketing / editorial |
| 1.500 | Perfect fifth | bold landing pages |
| 1.618 | Golden | high-drama hero |

Higher ratios = dramatic/editorial and need lots of whitespace; lower ratios = calm/utilitarian
and survive density. Refactoring UI dissents from *pure* modular scales — hand-pick a constrained
set so you're never choosing between 46 and 48px. A good rounded scale (px):
`12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72`. Reconcile: start from a ratio, round, let it
coarsen at the top. Keep **≥1.25× between hierarchy steps** — flatter than that and hierarchy
turns muddy. A 5-size system (xs/sm/base/lg/xl) covers most app UIs.

**Hard ceilings (cross both these and it reads as shouting, not designing):**
- Hero heading `clamp()` max **≤ 6rem (~96px)**. 8–11rem is comically loud.
- Body text floor **16px / 1rem** — smaller strains eyes and fails mobile a11y.
- Body **measure 45–75 characters**, ~65ch optimal: `max-width: 65ch`. (`ch` tracks the font.)
  *(Disagreement: Butterick allows up to 90ch; some screen-reading research says longer lines
  are fine. Converge on ~65ch for prose; it's a sensible default, not a hard law for all UI.)*

**Line-height is inversely proportional to size:**

| Context | Line-height |
|---|---|
| Body (~16px) | **1.5** (1.5–1.7 acceptable on screen) |
| Captions / small | 1.5–1.6 |
| Medium headings | 1.2–1.3 |
| Large display | **1.0–1.1** |

Pick paragraph *spacing* OR first-line *indent*, never both (digital → spacing).

**Weight & emphasis.** Body 400; emphasize with **600/700**, not 400-vs-500 (too subtle to
register). **Never use weights below 400 for UI text** — de-emphasize with lighter *color* or
smaller *size*, not a thinner weight. Limit to 2–3 weights. **Never change weight on
hover/active** — it reflows text.

**Letter-spacing (tracking).** Large headlines → tighten (**−0.01 to −0.03em**; floor ≈ −0.04em
before letters collide). All-caps/uppercase labels → loosen (**+0.05 to +0.1em**). Body → 0 (the
typeface is already optimized). Apple SF and Material apply size-specific tracking automatically.

```css
h1            { letter-spacing: -0.02em; }
.eyebrow-caps { text-transform: uppercase; letter-spacing: 0.08em; }
```

**Pairing.** One family is safest; two is the premium move (a display/serif + a body sans);
three reads amateur. Pair on a **contrast axis** — geometric + humanist, serif + sans — never two
similar-but-not-identical faces. To emphasize a word in a headline, use italic/bold of the
**same** family; don't inject a random serif word into a sans headline.

**Rendering & numerics:**
```css
html { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
       -webkit-text-size-adjust: 100%; }
.tnum, .stat, td.num { font-variant-numeric: tabular-nums; } /* aligned columns, no width jitter */
```
Use `font-optical-sizing: auto` on variable fonts. `text-wrap: balance` on h1–h3 (even lines);
`text-wrap: pretty` on long prose (kills orphans).

**Web-font loading** (also a performance/CLS concern — see §12):
- `font-display: swap` for headings/brand; `font-display: optional` for body (uses the web font
  only if it arrives within ~100ms, else keeps the fallback → zero layout shift).
- `preconnect` to the font origin; `preload` the 1–2 critical files only.
- Neutralize swap reflow with a metric-matched fallback: `size-adjust`, `ascent-override`,
  `descent-override`, `line-gap-override` on an `@font-face`.
- Variable fonts when you need 3+ weights; static is fine for 1–2.
- Never `user-scalable=no`; never size fonts in `px` for body (use `rem` to respect user prefs).

*Sources: Refactoring UI (line-height, scales), Butterick (Practical Typography), Emil Kowalski,
Rauno Freiberg (Interface Guidelines), Material type-scale tokens, Apple HIG Typography,
Smashing (fluid type), web.dev (font best practices), Simon Hearne (size-adjust).*

## 5. Spacing & layout

**Work on a 4pt base with an 8pt rhythm.** Most screen dimensions divide by 8, so layouts snap
cleanly; 4px is the half-step for tight icon/text gaps. Line-heights should land on multiples of
4 (ideally 8): 16/20/24/28/32.

**Distribute the spacing scale perceptually, not linearly.** No two adjacent values should be
closer than ~25% — 4→8 is meaningful, 64→65 is invisible. So steps cluster low and spread high.
A solid scale (px): **`4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 256`**. *(Disagreement:
Tailwind's default is a denser linear 4px scale with 20/40px steps — fine as a utility toolkit;
the sparser scale above is better as a constrained token system that cuts decision fatigue.)*

**Whitespace is a premium signal — and you almost always want more.** But **never space
everything equally**: group related items with *less* space than separates the groups (proximity
= relationship). A label sits closer to its own input than to the next field. Tight grouping
8–12px; generous section separation 48–96px. Even, monotone spacing with no grouping is itself
an AI tell.

**Use `gap`, not margins,** for spacing between siblings (no margin-collapse hacks). Use
`clamp()` for spacing that should breathe on large screens (§9). Name tokens semantically
(`--space-md`), not by value.

**Layout engines:**
- **Flexbox** for 1D — toolbars, button groups, a row's internals, nav.
- **Grid** for 2D — page structure, dashboards, dense data. Named grid areas for complex pages.
- **Container queries** for component-internal density; **media queries** for the page shell;
  **preference queries** for personalization. (Detail in §9.)

**Alignment is optical, not mathematical.** The eye reads visual weight, not bounding boxes:
- Triangle/play icons sit visually left — nudge them right inside a circular button; align the
  centroid, not the box.
- A circle must scale to **~112.84%** to carry the same visual weight as an equal-area square
  (why icon sets oversize round glyphs).
- Mixed sizes on one line ("$29 /mo") align by **baseline** (`align-items: baseline`), not center.
- Text flush to a container edge looks slightly indented due to letterform sidebearing; a
  `−0.05em` nudge optically aligns a large heading.

**Responsive grids without breakpoints** — the single most durable recipe (RAM):
```css
grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); /* auto-fit: stretch to fill */
/* auto-fill keeps phantom tracks → stable column count (e.g. form fields) */
```

**Constrain the outer container so widening adds gutters, not line length:**
`max-width: 75rem; margin-inline: auto;` (~1200px for a 12-col content layout, ~1440px for dense
dashboards). Prefer `rem` so it respects root font size.

**Don't wrap everything in cards, and never nest cards.** Identical card grids (icon + heading +
text, repeated) are the canonical lazy layout. Group with a divider, a background tint, or
whitespace instead. If a card *does* enclose something, the inner radius = outer radius − padding
(§6).

*Sources: Refactoring UI, Tailwind spacing, 8pt grid (spec.fm), Bjango (optical adjustments),
Every Layout, CSS-Tricks (auto-fit vs auto-fill).*

## 6. Shadows, elevation, surfaces, radius

**Layered shadows beat a single shadow.** One `box-shadow` looks flat and fake. Stack several
low-opacity shadows with roughly doubling blur/offset to mimic a real penumbra:

```css
/* Josh Comeau layered shadow */
box-shadow:
  0 1px 1px  hsl(0 0% 0% / 0.075),
  0 2px 2px  hsl(0 0% 0% / 0.075),
  0 4px 4px  hsl(0 0% 0% / 0.075),
  0 8px 8px  hsl(0 0% 0% / 0.075),
  0 16px 16px hsl(0 0% 0% / 0.075);
```

**Tint the shadow toward the surface hue** (then drop lightness/chroma) — never pure black.
Conceptually pair a **direct** shadow (larger, softer, vertical offset) with an **ambient**
shadow (tight, low-blur) that grounds the element.

**Elevation rules (one light source for the whole page):** as an element rises, vertical offset
increases (offset ≈ 2× horizontal — light from above), blur grows (2–4px near the surface →
20–40px floating), opacity drops. To make a shadow *more noticeable*, add **vertical offset, not
more blur/spread** — big spread reads as a fake glow. Floating elements can use negative spread:
`0 25px 50px -12px rgb(0 0 0 / 0.25)`. Map a **role-based scale**: sm → buttons/resting cards;
md → dropdowns/popovers; lg → modals/sheets. In dark mode, prefer **lightness-based elevation**
over big shadows.

**Shadows vs borders — commit to one per element.** Use a soft shadow to lift something that
genuinely sits *above* the surface; use a 1px border for a crisp edge at the *same* elevation
(inputs, table cells, dividers). A hairline border **+** a wide diffuse shadow on the same
element is a recognizable AI tell — pick one (border, or shadow with ≤8px blur).

**Borders.** Prefer **semi-transparent** borders so they adapt to any background:
`oklch(0 0 0 / 0.08)` light, `oklch(1 0 0 / 0.1)` dark. And use *fewer* borders — where you'd
reach for a divider, a shadow, extra spacing, or a one-step background shift is often cleaner.
Never use a thick colored accent stripe on one side of a card (the single most recognizable tell).

**Radius — pick one scale and use only its steps.** Small controls (inputs/buttons) ~6–8px;
cards ~12–16px; modals/sheets ~16–28px; pills/tags `9999px`. Over-rounding everything (24px+ on
small cards) reads cheap. **Nested radius:** inner = outer − padding; if padding ≥ outer radius,
the inner element should be square.
```css
.card  { --r: 16px; --p: 8px; border-radius: var(--r); padding: var(--p); }
.inner { border-radius: calc(var(--r) - var(--p)); }   /* 8px — concentric, no bulge */
```

**Glassmorphism** is rare-and-purposeful, never a default. When used (e.g. a floating header):
`backdrop-filter: blur(20px) saturate(180%)`, a 1px inner highlight for edge definition, and an
**opaque fallback** under `@supports not (backdrop-filter)` and `prefers-reduced-transparency`.

*Sources: Josh Comeau (Designing Shadows), Refactoring UI (two-part shadows, fewer borders),
Material 3 Elevation, 30 Seconds of Code (nested radius).*

## 7. Design tokens

Tokens make consistency a system instead of a habit. Use a **three-layer architecture** so you
can re-theme without touching components:

```
PRIMITIVE  (raw values, no meaning)
  --gray-50 … --gray-950 · --blue-600 · --space-4 (4px) … --space-24
  --text-xs (12px) … --text-5xl · --radius-md (6px) … --radius-full · --shadow-sm … --shadow-xl

SEMANTIC   (purpose-based aliases — what components reference)
  --color-bg: var(--gray-50)        --color-fg: var(--gray-950)
  --color-primary: var(--blue-600)  --color-muted-fg: var(--gray-500)
  --color-border: var(--gray-200)   --color-danger: var(--red-600)
  --space-component: var(--space-3) --space-section: var(--space-12)

COMPONENT  (per-component overrides, optional)
  --button-bg: var(--color-primary) --button-px: var(--space-4)
  --card-padding: var(--space-4)    --input-ring: var(--color-primary)
```

Dark mode (and any theme) overrides only the **semantic** layer:
```css
:root { --color-bg: var(--gray-50);  --color-fg: var(--gray-950); }
.dark, @media (prefers-color-scheme: dark) {
  --color-bg: var(--gray-950); --color-fg: var(--gray-50);
  --color-border: var(--gray-800);
}
```

**Rules:** name by role (`--text-body`), never by value (`--font-16`). Components reference
semantic/component tokens only — never primitives or raw hex. Keep a single source of truth
(CSS custom properties, mapped into your utility framework). This is exactly how the worked
example in §16 is built.

*Sources: ckm-design-system (three-layer token architecture), shadcn/Tailwind theming patterns.*

## 8. Motion & interaction

Motion's job is to clarify (feedback, spatial continuity, hierarchy), never to entertain. The
guiding principle: **motion should be felt, not seen.** If the user notices the animation, it's
probably too slow or too big.

**Frequency decides whether to animate at all** — this is the master rule:
- ~100+ times/day (toggles, keyboard shortcuts): **no animation**, ever.
- Tens of times/day (hovers, list nav): minimal — short or none.
- Occasional (modals, drawers, toasts): standard animation.
- Rare / first-time (onboarding, success moments): you may add delight.

**Durations:**

| Tier | Range | Use |
|---|---|---|
| Micro / instant | **≤ 200ms** (often 100–150) | hover, press, focus, toggle, tooltip |
| Standard UI | **200–300ms** | dropdowns, popovers, accordions, most enter/exit |
| Macro | **300–500ms** | modals, drawers, sheets, page transitions |
| Avoid | **> 500ms** | only deliberate, low-frequency branded moments |

*(Disagreement: Rauno caps interactions at ~200ms; Emil allows ≤300ms for UI with 500ms drawers
as the exception. Reconcile by frequency — repeated interactions to the low end, large/rare
surfaces to the high end.)* **Exit ≈ 75% of enter duration** — a thing leaving shouldn't demand
as much attention as a thing arriving.

**Easing — enter vs exit:**
- **Enter → ease-out** (fast, then settle → feels responsive).
- **Exit → ease-in** (it's leaving; don't draw the eye).
- **On-screen move → ease-in-out.**
- **Never `linear`** for spatial motion (only continuous spinners/marquees).
- **Never `ease-in` on entrances** — starting slow makes the UI feel laggy at exactly the moment
  the user is watching.
- **Avoid bounce/elastic on UI chrome** — overshooting dialogs/cards read dated. Reserve any
  bounce for rare playful moments.

Hand-picked curves worth memorizing:
```
Material Standard           cubic-bezier(0.2, 0, 0, 1)
Material Emphasized-Decel   cubic-bezier(0.05, 0.7, 0.1, 1)   /* expressive enter */
ease-out-quart              cubic-bezier(0.25, 1, 0.5, 1)
ease-out-quint              cubic-bezier(0.22, 1, 0.36, 1)    /* snappy, great default */
ease-out-expo               cubic-bezier(0.16, 1, 0.3, 1)     /* confident */
iOS drawer                  cubic-bezier(0.32, 0.72, 0, 1)
practical default           cubic-bezier(0.4, 0, 0.2, 1)
```

**Animate only `transform` and `opacity`.** They are GPU-composited — no layout, no paint, stay
at 60fps. **Never animate** `width/height/top/left/margin/padding` (reflow) or
`box-shadow/background/color` for movement (paint). Substitutes: move → `translate()`; resize →
`scale()` (or animate `grid-template-rows` for a true height reveal); glow → animate a
pre-set shadow on a pseudo-element's opacity. Scale *from a near value* (dialog 0.8→1, press
→0.96), **never from `scale(0)`** (it vanishes, then pops). Use `translate(100%)` (percent of own
size) to park drawers/toasts offscreen regardless of dimensions. `transform-origin`: popovers
scale from their trigger, modals from center.

**Springs.** Use for movement the user can interrupt or reverse (drags, sheets, "alive"
elements) — a spring keeps velocity when retargeted; a duration tween "hits a wall." Most *good*
springs are **not bouncy** — high friction/damping = buttery, no overshoot. Apple-style:
`{ duration: 0.5, bounce: 0.2 }`; physics: `{ mass: 1, stiffness/tension: ~200, damping/friction:
~12–20 }`. Springs are for transform, not color/opacity. Native CSS via `linear()` timing
(generate the points; don't hand-author).

**Stagger** entrances 30–80ms between siblings (tight cascades 20–50ms); >0.2s feels slow. Cap
long lists — stagger the first N or just fade the container. Stagger is decorative; never block
interaction waiting for it.

**Perceived performance.** ~80ms reads as "instant" to humans. A 180ms select feels snappier
than 400ms. Start transitions *while* loading (skeletons, preemptive zoom). When a crossfade
looks like two overlapping objects, add a brief `filter: blur(2px)` during the transition to
bridge them (keep <20px; expensive in Safari). CSS transitions/animations run off the main
thread and stay smooth even when JS is busy (page nav) — prefer them over rAF-driven libs for
load-time motion; in Framer Motion use the full `transform` string, not the `x`/`scale`
shorthands, to stay GPU-accelerated.

**Reduced motion — opt *in* to motion so "reduced" is the safe default:**
```css
@media (prefers-reduced-motion: no-preference) {
  .thing { transition: transform 250ms cubic-bezier(0.4,0,0.2,1); }
}
/* and a global collapse for everything else */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001ms !important; transition-duration: .001ms !important; }
}
```
Replace large spatial/parallax motion with a simple opacity fade — don't kill *all* feedback,
which harms comprehension. Gate hover effects behind `@media (hover: hover) and (pointer: fine)`
so taps don't trigger phantom hovers.

### Interaction states & micro-interactions

Every interactive element owns **eight** states: default, hover, **focus-visible**, active/press,
disabled, loading, error, success. Missing states are confusion.

- **Focus:** use `:focus-visible` (ring for keyboard, not mouse). `outline` ignores
  `border-radius`, so use a `box-shadow` ring on rounded elements:
  `box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--ring)`. WCAG 2.4.13 (AAA): ≥2px thick, ≥3:1
  contrast vs unfocused and adjacent. Once you remove the default outline, you *own* that contrast.
- **Press:** `transform: scale(0.97)` with ~100ms ease-out. Feedback must be immediate and **at
  the trigger** (inline checkmark on a Copy button — not a toast across the screen).
- **Buttons:** label is verb + object ("Save changes", "Delete project"), never "OK"/"Yes".
- **Disabled:** keep it legible (don't fall below contrast minimums). **No tooltips on disabled
  buttons** (keyboard-unreachable) — keep the control enabled and validate on click, or show the
  reason as adjacent text.
- **Forms:** label always visible and associated (`<label for>`), never placeholder-as-label;
  `autocomplete` tokens; errors inline, specific, beside the field, with `aria-invalid` +
  `aria-describedby`; required markers visible. Error copy says how to fix
  ("Email needs an @ symbol. Try name@example.com"), not "Invalid input".
- **Loading:** skeletons (mirroring the real layout) for content-heavy, layout-predictable
  surfaces — perceived ~30–50% faster and they reserve space (no CLS). Spinners only for short
  (<~2s), indeterminate single actions. Delay the indicator slightly so sub-300ms responses
  never flash a flicker.
- **Empty states:** a design surface, not a blank screen — say what goes here + one primary
  action (ideally seed data). Never "Nothing here."
- **Optimistic UI:** update locally immediately, reconcile with the server, roll back on error
  with inline feedback. Best for high-frequency low-risk actions (likes, toggles, logging a
  dose). React's `useOptimistic` rolls back automatically if the action throws.
- **Dropdowns/menus** must escape overflow/stacking contexts — native `<dialog>`/popover API,
  `position: fixed`, or a portal — or they get clipped.
- **Drag:** provide a single-pointer alternative (WCAG 2.5.7); apply friction at boundaries (no
  hard walls); a velocity flick (~0.11 px/ms) should dismiss regardless of distance; capture the
  pointer so the drag survives leaving the element.

*Sources: Emil Kowalski (Great Animations, animations.dev), Rauno Freiberg (Interface
Guidelines), Material 3 motion tokens, Apple HIG Motion, Josh Comeau (Spring Physics, linear()),
web.dev (Animations guide), React `useOptimistic`, NN/g (skeleton screens), WCAG 2.2.*

## 9. Mobile-first & responsive

Design the 360px phone first, then *add* at larger sizes. The failure mode to avoid is the
"stretched mobile" desktop — one giant column with 120-character lines.

**Fluid type & space with `clamp()`:**
```css
/* clamp(MIN, slope·vw + intercept, MAX). Bounds in REM (respect zoom); preferred = vw + rem. */
font-size: clamp(1rem, 0.714rem + 1.43vw, 2rem);     /* 16px@320 → 32px@1440 */
--space-m: clamp(1.125rem, 1.07rem + 0.23vw, 1.25rem);
```
- Bounds in **rem**, preferred value **must include a rem term** — pure `vw` doesn't grow on
  zoom and breaks WCAG 1.4.4 (200% resize). Compliance rule of thumb: **max ≤ 2.5× min**.
- Slope = `(maxPx − minPx) / (maxVW − minVW)`; intercept = `(−minVW·slope) + minPx`. Or just use
  utopia.fyi. Keep body text fixed-ish; reserve dramatic fluidity for display headings.

**Container queries vs media queries — the 2026 model ("the new responsive"):**
- **Media queries** → the page shell / macro layout, and OS/user preferences.
- **Container queries** → inside reusable components, so a card adapts to its *slot*, not the
  viewport. `container-type: inline-size` (the safe default) + `@container (width > 700px) {…}`.
  Container units: `cqi`/`cqb` (1% inline/block) — pair with clamp: `clamp(2rem, 15cqi, 4rem)`.
  Size container queries are ~90%+ supported; **style queries are still immature — don't rely
  on them yet.**

**Breakpoints — content-driven, not device-driven.** Add one where the layout actually breaks.
De-facto baseline (Tailwind, min-width): `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`.

**Touch & ergonomics:**
- **Target size:** Apple HIG **44pt**, Material **48dp**, WCAG-AA floor **24px** (2.5.8),
  WCAG-AAA **44px** (2.5.5). **Design to 44–48px and you satisfy all of them.** Min **8px** (better
  ≈24px center-to-center) between targets.
- **Thumb zones:** primary actions belong in the **bottom-center natural zone**; top corners are
  the hard-to-reach zone. This is *why* mobile apps put nav at the bottom.
- **Bottom nav: ~3–5 items** (4 is the sweet spot) — more won't fit at a usable target size.
- **Safe-area insets** (notch/home indicator): set
  `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` then
  pad with `env(safe-area-inset-*)`:
  ```css
  .tabbar { padding-bottom: calc(0.5rem + env(safe-area-inset-bottom)); }
  ```
  Without `viewport-fit=cover` the insets resolve to 0; desktop (insets=0) is unaffected.
- Use `min-h-[100dvh]`, never `100vh` (mobile URL bar makes `vh` jump).

**Scaling up to desktop — add panes & gutters, don't stretch:**
- Constrain and center the outer container (`max-width: 75rem; margin-inline: auto`); widening
  adds whitespace, not line length. Keep prose at ~65ch even inside a wide shell.
- Go single-column → multi-pane intrinsically (RAM grid from §5, or Every Layout's *Sidebar* /
  *Switcher*). Material window-size classes mark the thresholds: **Compact 0–599** (1 col,
  touch) · **Medium 600–839** (first adaptation) · **Expanded 840–1199** (go **two-pane**) ·
  **Large 1200–1599** (persistent nav rail) · **XL 1600+** (three panes). Density = more panes +
  tighter spacing, never a wider single column.
- **List-detail / master-detail** (stacked on mobile, side-by-side on desktop) and the
  **sidebar/nav-rail shell** are the two workhorse responsive patterns.

*Sources: Utopia.fyi, Smashing (fluid type + a11y), Josh Comeau (pixels & a11y), web.dev (New
Responsive, CQ stable), Una Kravets, Tailwind, WCAG 2.2, Apple HIG, Material 3 (window-size
classes, panes), LukeW (thumb zones), NN/g (mobile nav), MDN (`env()`), Every Layout.*

## 10. PWA craft

What turns a responsive site into something that *feels* like an installed app.

**Manifest essentials:**
- **`display`** fallback chain `fullscreen → standalone → minimal-ui → browser`. **`standalone`**
  (own window, no browser chrome) is the usual choice. **`display_override`** (ordered array,
  evaluated first) is the only place for newer modes (`window-controls-overlay`, `tabbed`).
- **`theme_color`** (toolbar/title-bar), **`background_color`** (first-launch splash).
- **Icons:** at minimum **192×192 and 512×512** PNG. Provide a separate **`purpose: "maskable"`**
  icon — keep the logo inside the center circle of **radius = 40% of width** (outer ~10% edge may
  be cropped by adaptive shapes). Don't put `"any maskable"` on one icon; use distinct entries.
- **`id`** (stable identity so `start_url` can change later), **`start_url`**, **`scope`**,
  **`shortcuts`**.
- **`screenshots` + `form_factor`** upgrade the Android/Chromium install dialog to an app-store-
  style card. *(Chromium/Android only — not iOS Safari.)*

**Installability (verified, MDN):** HTTPS (or localhost) + a valid manifest with `name`/
`short_name`, both 192 & 512 icons, `start_url`, and `display`. **A service worker is NOT
required for installability**, and the old SW-fetch-handler requirement was removed (Chrome
108/112). Firefox doesn't install from a manifest; macOS Safari 17+ "Add to Dock" works
with/without one.

**Service worker / offline (Workbox cache strategies):**
- **Cache-first** — hash-versioned static assets (fastest).
- **Network-first** — HTML/API (fresh online, last copy offline).
- **Stale-while-revalidate** — "nice to be current" assets (avatars).
- **App-shell pattern:** precache a minimal HTML/CSS/JS shell on `install` → instant offline UI →
  fill content via runtime caching.

**iOS Safari PWA quirks (still true in 2026 — design around them):**
- Install is **Share → Add to Home Screen** only; **no `beforeinstallprompt`**, no auto banner.
- **No Background Sync / Periodic Sync / Background Fetch** — sync only while the app is visible.
- Caches may be evicted after ~7 days of non-use *(figure is secondary-sourced, not Apple-
  confirmed — treat as directional)*.
- **Web Push works on iOS/iPadOS 16.4+ but ONLY for PWAs installed to the Home Screen**, and the
  permission prompt **must be behind a user gesture (a tap)**. All iOS browsers are WebKit, so
  this applies everywhere on iOS. *(For a reminders/notifications PWA this is load-bearing: tell
  users to install to the Home Screen, and only request push from a tap.)*

**App-shell feel (make it not feel like a website):**
- **View Transitions API.** Same-document: `document.startViewTransition(() => updateDOM())`.
  Cross-document (MPA): `@view-transition { navigation: auto; }` in *both* documents; shared-
  element morph via unique `view-transition-name`. Always feature-detect. Same-document VT is
  Baseline (Chrome 111+, Safari 18+, Firefox 144+); cross-document lacks Firefox — degrade to
  instant nav. Next.js App Router support exists but is flagged experimental — the userland
  `next-view-transitions` is the stable option.
- **Kill scroll jank:** `overscroll-behavior-y: contain` (keeps bounce, stops chaining /
  accidental pull-to-refresh); `contain` on modals/drawers so inner scroll doesn't leak.
- **App-chrome polish** (on buttons/chrome, **not** body text): `touch-action: manipulation`
  (removes the 300ms double-tap delay), `-webkit-tap-highlight-color: transparent`,
  `user-select: none`, `-webkit-touch-callout: none`.
- **Detect installed:** `window.matchMedia('(display-mode: standalone)').matches` (plus iOS-only
  `navigator.standalone`); style with `@media (display-mode: standalone) {…}`.
- Persistent **bottom tab bar** in the shell + skeletons in route `loading` boundaries +
  optimistic mutations = stack-navigation, native-app feel.

*Sources: web.dev / MDN (manifest, installability, maskable icons, detection), Chrome docs
(display_override, Workbox, install criteria), firt.dev & MagicBell (iOS limitations/push),
Chrome/MDN/CSS-Tricks (View Transitions), NN/g (skeletons), React `useOptimistic`. Flagged:
iOS push "unchanged since 16.4", storage limits, and Next.js VT production-readiness are
secondary-sourced or experimental.*

## 11. Accessibility (WCAG 2.2)

Build to **AA**. Accessibility is craft a top practitioner bakes in, not a remediation pass —
and semantic HTML + reserved space + honored preferences gets you ~80% for free.

**Contrast** (numbers in §3): text 4.5:1, large 3:1, **non-text/UI/focus 3:1** (the forgotten one).

**Target size (2.5.8, AA):** ≥ 24×24px with exceptions; design to 44–48px anyway (§9).

**Focus — three criteria:**
- **2.4.7 Focus Visible (AA):** never `outline:none` without a replacement ring.
- **2.4.11 Focus Not Obscured (AA, new in 2.2):** the focused element can't be fully hidden
  behind sticky headers/footers — fix with `scroll-padding` on the scroll container.
- **2.4.13 Focus Appearance (AAA):** indicator ≥2px thick, ≥3:1 contrast change.

**Keyboard & input:** everything operable by keyboard (2.1.1); no keyboard trap (2.1.2 — modals
are the *managed* exception); **dragging needs a single-pointer alternative** (2.5.7, new).

**Forms, names, status:**
- Semantic HTML first — native `<button>/<a>/<nav>/<main>/<dialog>/<input>` ship roles, keyboard
  behavior, and focus for free. **No ARIA is better than bad ARIA**; reach for `role="button"` on
  a div only after exhausting native elements (then you owe it tabindex + key handlers +
  `aria-pressed`).
- Every control has a programmatic name (1.3.1 / 4.1.2). Associate labels; use `autocomplete`.
- **Don't make users re-enter info** in the same flow (3.3.7); **don't require a cognitive puzzle
  to log in** — allow paste & password managers (3.3.8).
- **Status messages** that appear without a focus change (toasts, "3 results", async validation)
  must be in an **ARIA live region**: `role="status"`/`aria-live="polite"` (info),
  `role="alert"`/`aria-live="assertive"` (errors). (4.1.3)

**SPA / route-change focus:** client navigation breaks the implicit "new page resets focus."
On route change, move focus to the new view's `<main>` or h1 (`tabindex="-1"` + `.focus()`) and
announce the route to a live region — otherwise keyboard/SR users are stranded.

**Modals:** prefer native `<dialog>` + `showModal()` (focus trap, inert backdrop, Esc for free).
Hand-rolled: trap Tab, mark the rest `inert`, close on Esc, **return focus to the trigger** on close.

**Skip link** first in the DOM (`<a href="#main">Skip to content</a>`, visible on focus) — 2.4.1.

**Honor preferences:** `prefers-reduced-motion`, `prefers-color-scheme`, `prefers-contrast: more`,
(experimental) `prefers-reduced-data`. **Color is never the only signal** (1.4.1).

**APCA vs WCAG 2 (2026 status — in flux):** APCA is perceptually better (accounts for size,
weight, polarity) and useful as a *design aid*, especially for dark mode and thin type — **but it
is non-normative**, was removed from the WCAG 3 draft pending evaluation (status "to be
determined" as of April 2026), and WCAG 3 won't be a Recommendation until ~2029–2030 (and will
coexist with, not replace, 2.2). **Ship to WCAG 2.2 AA for compliance**; use APCA only to choose
colors that pass *both*.

*Sources: W3C WCAG 2.2 + Understanding docs, WebAIM, MDN (ARIA, inert), Sara Soueidan (focus
indicators), Adrian Roselli / Eric Eggert (WCAG 3 & APCA status).*

## 12. Performance (Core Web Vitals)

Performance *is* perceived quality. Field data at the **75th percentile** is what counts (≥75% of
visits must hit "good").

| Metric | Measures | Good | Poor |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | loading | **≤ 2.5s** | > 4.0s |
| **INP** (Interaction to Next Paint) | responsiveness | **≤ 200ms** | > 500ms |
| **CLS** (Cumulative Layout Shift) | visual stability | **≤ 0.1** | > 0.25 |

**INP replaced FID** (March 2024) and is the hardest to pass — it's the *worst* interaction across
the whole visit, full duration. ~43% of sites still fail it.

- **LCP fixes:** the LCP image must be discoverable in the initial HTML (no JS-injected `src`);
  add **`fetchpriority="high"`** to the hero image (Google Flights: ~700ms win); `preload`
  late-discovered critical resources; `preconnect` to font/image CDNs; **never `loading="lazy"`
  the LCP image**; cut TTFB (cache/CDN/edge), inline critical CSS, avoid render-blocking JS.
- **INP fixes:** break up long tasks (>50ms) and `yield` to the main thread
  (`scheduler.yield()`); move heavy work to a Web Worker; debounce/throttle; avoid layout
  thrashing (batch DOM reads then writes); shrink the DOM; `content-visibility: auto` for
  offscreen sections. **Less JS is the dominant lever** — code-split by route, lazy-load
  below-the-fold, audit third-party scripts (each is a main-thread tax).
- **CLS fixes:** always set `width`/`height` or `aspect-ratio` on images/video/embeds/ads;
  reserve space for dynamic/async content; neutralize web-font reflow (§4); **animate only
  `transform`/`opacity`** (they don't trigger layout shift).

**Image craft:** serve **AVIF** (~40–50% smaller than WebP) with WebP + JPEG fallback via
`<picture>`; `srcset`+`sizes` for resolution; `loading="lazy"` below the fold (eager above);
explicit dimensions everywhere to prevent CLS.

**Loading:** skeletons that mirror layout for 2–10s full-page loads; spinners for short single
actions; progress bar for >10s; nothing under ~500ms.

*Sources: web.dev (LCP/INP/CLS, top-cwv, fetch-priority, fonts), Google Search Central, MDN
(image LCP), DebugBear (responsive images). Core Web Vitals set is stable at LCP/INP/CLS in 2026.*

---

# PART III — ENFORCEMENT

## 13. The anti-slop catalogue

These are the tells that mark an interface as AI-generated, templated, or amateur. Each has a
fix. Treat the list as a lint pass over your own work — if you catch yourself reaching for one,
stop and apply the fix.

**Color**
- ❌ Purple/violet gradients, cyan-on-dark (the signature tell) → ✅ one intentional accent on a
  neutral base; forbid "purple gradient" outright.
- ❌ Gradient text on headings/metrics → ✅ solid text color; emphasis via weight/size.
- ❌ Pure-black (`#000`) backgrounds/dark mode + colored glow shadows → ✅ near-black
  `oklch(~0.18–0.22)` / `#121212`, elevation via lighter layered surfaces.
- ❌ Cream/sand/beige "warm AI" body background (low-chroma warm at high lightness) → ✅ a true
  off-white (chroma 0), a real saturated brand color, or a darker tinted mid-tone.
- ❌ Gray text on a colored background (washed out) → ✅ a darker shade of that hue, or near-white.

**Typography**
- ❌ One font for everything; the overused faces (Inter, Roboto, Open Sans, Helvetica as
  *defaults*) → ✅ a distinctive display + refined body; name specific fonts (Geist, Outfit,
  Cabinet Grotesk, Satoshi, Plus Jakarta Sans…). Note: a font being common isn't disqualifying —
  *defaulting without a choice* is the tell.
- ❌ Flat hierarchy (sizes too close) → ✅ fewer sizes, ≥1.25× contrast.
- ❌ Tiny uppercase tracked "eyebrow" + `01 / 02 / 03` numbered markers on *every* section → ✅
  drop the scaffolding; numbers only when a real sequence carries meaning (max ~1 eyebrow per 3
  sections).
- ❌ Oversized italic-serif hero that just "screams"; all-caps body; crushed letter-spacing → ✅
  control hierarchy with weight + color; tracking per §4; reserve caps for short labels.
- ❌ Serif = "automatically creative" used as a default → ✅ serif only for genuinely editorial/
  luxury/heritage work you can justify.

**Layout & spacing**
- ❌ Three equal feature cards / identical card grids → ✅ vary size, hierarchy, content; 2-col
  zig-zag, asymmetric/bento grid, or grouped lists.
- ❌ Everything centered & symmetrical; centered headline + two buttons + gradient blob hero → ✅
  build layout from the real product (split/asymmetric, real imagery).
- ❌ Monotone even spacing, no grouping → ✅ tight within groups, generous between sections.
- ❌ Nested cards (cards-in-cards) → ✅ flatten with spacing/dividers.
- ❌ Hairline border **+** wide diffuse shadow on the same element (ghost-card) → ✅ pick edge *or*
  elevation.
- ❌ Thick colored accent stripe on one card side (most recognizable tell) → ✅ remove, or full
  border / background tint / leading icon.
- ❌ Over-rounded everything (24px+ on small cards) → ✅ cards ~12–16px; full-pill for tags/buttons
  only.
- ❌ No max-width (lines >80ch, content flush to edges) → ✅ `max-width: ~65–75rem`, ≥16px gutters.
- ❌ 3+ consecutive identical "left-text / right-image" splits → ✅ break the rhythm (full-width,
  vertical stack, bento).

**Icons & imagery**
- ❌ Emoji as feature icons; a rounded-square icon tile above every heading; an icon container
  bigger than its message; hand-drawn/sketchy SVG mascots; image scale/rotate on hover; broken
  placeholder `src` → ✅ a consistent real icon set (one family, one stroke weight); real or
  generated assets; decoration must never outweigh content.
- ❌ Generic avatars (SVG "egg" / default user glyph) → ✅ believable photos or generated marks.

**Motion**
- ❌ Bounce/elastic on UI chrome; animating layout props (width/height/padding) → ✅ ease-out
  (quart/quint/expo); transform + opacity (or `grid-template-rows` for height).
- ❌ `window.addEventListener('scroll', …)` for scroll effects → ✅ IntersectionObserver,
  `animation-timeline: view()`, or a scroll library.

**Copy**
- ❌ Em-dash overuse; buzzwords (streamline, empower, supercharge, leverage, seamless,
  world-class, next-gen, game-changer); "it's not X, it's Y" cadence; "X theater" → ✅ a specific
  verb + noun that states literally what it does.
- ❌ Lorem ipsum; "John Doe" / "Acme"; fake-perfect numbers (`99.99%`, `1,234,567`) → ✅ realistic,
  contextual placeholder content; organic numbers (or mark mock data explicitly).
- ❌ Title Case On Every Header → ✅ sentence case.

**The biggest tell of all:** no empty / loading / error states, and forms with no validation or
required markers. **Fix:** design all three states + real validation. This, more than any visual
trick, is what separates "generated" from "built."

*Sources: design-taste-frontend, impeccable (slop), high-end-visual-design,
redesign-existing-projects, prg.sh (purple-gradient), Mantlr (Stripe/Linear/Vercel).*

## 14. Checklists

### Pre-flight (mechanical — run before declaring a UI done)
- [ ] Hierarchy survives the squint test (clear primary → secondary → grouping).
- [ ] One accent color throughout; one corner-radius system; one light/dark theme per page.
- [ ] Type: ≤2–3 families, ≤3 weights, measure ≤ ~65–75ch, body ≥16px, ≥1.25× scale steps.
- [ ] Spacing from the scale only (no random 13px); tight-within-group, loose-between-sections.
- [ ] All eight interaction states present (default/hover/focus-visible/active/disabled/loading/
      error/success).
- [ ] **Empty, loading, and error states designed; forms validate with visible required markers.**
- [ ] Contrast: text ≥4.5:1, large ≥3:1, **non-text/UI/focus ≥3:1**; placeholder ≥4.5:1.
- [ ] Color is never the only signal (icon/text accompanies it).
- [ ] Touch targets 44–48px, ≥8px apart; primary actions in the thumb zone.
- [ ] Visible `:focus-visible` ring; keyboard-operable; no traps; skip link; route-change focus.
- [ ] Responsive verified at 360 / 768 / 1280px; no horizontal scroll; `100dvh` not `100vh`;
      safe-area insets applied.
- [ ] Motion ≤300ms (macro ≤500), ease-out, transform/opacity only, `prefers-reduced-motion`
      handled, hover gated behind `(hover: hover)`.
- [ ] No anti-slop tells from §13 (em-dashes, purple gradients, 3-equal-cards, side-stripe,
      ghost-card, fake product previews, section-number eyebrows on every section).
- [ ] Performance: LCP image eager + `fetchpriority="high"`, images have dimensions (no CLS),
      fonts preloaded with metric-matched fallback, JS code-split.
- [ ] PWA (if applicable): manifest valid (192+512+maskable), standalone tested, push only behind
      a tap and only when home-screen-installed (iOS).

### Polish pass (after functionally complete)
Pixel alignment to grid · token usage everywhere (no hard-coded values) · consistent
terminology & sentence case · icons one family/weight · `text-wrap: balance`/`pretty` ·
optical alignment (centroids, baselines) · concentric nested radii · tinted layered shadows ·
no console logs / dead code. **Fix root causes (the token/component), not one screen.**

### Heuristic audit (Nielsen's 10 — score 0–4 each, /40)
Visibility of system status · match to the real world · user control & freedom (undo/cancel/
escape) · consistency & standards · error prevention · recognition over recall · flexibility &
efficiency (shortcuts) · aesthetic & minimalist · help users recover from errors · help &
docs. *(36–40 excellent · 28–35 good · 20–27 acceptable · <20 needs work.)*

### Issue severity
**P0 blocking** (prevents the task — fix now) · **P1 major** (significant difficulty or WCAG-AA
violation — before release) · **P2 minor** (annoyance, workaround exists) · **P3 polish** (no user
impact — if time permits).

---

# PART IV — REFERENCE DATA

## 15. Font pairings, palettes, scales, framework mapping

### Font pairings (display + body, by mood)

| Use case | Display | Body | Mood |
|---|---|---|---|
| Modern SaaS | Geist / Outfit | Inter / Geist | clean, neutral, trustworthy |
| Premium / luxury | Playfair Display | Inter | elegant, editorial |
| Tech / developer | Space Grotesk | DM Sans | bold, futuristic |
| Editorial / publishing | Cormorant Garamond | Libre Baskerville | literary, refined |
| Minimal / Swiss | Inter (multi-weight) | Inter | functional, documentation |
| Wellness / calm | Lora | Raleway | organic, soft |
| Enterprise / trust | Lexend | Source Sans 3 | accessible, authoritative |
| Soft / friendly (pet, kids) | Varela Round / Fraunces | Nunito Sans / Geist | warm, approachable |
| Bold statement | Bebas Neue | Source Sans 3 | dramatic, headline-only |
| Fashion / creative | Syne | Manrope | avant-garde |

Mono (data/code): Geist Mono, JetBrains Mono, SF Mono. **Rule:** pair on contrast (serif+sans,
geometric+humanist); never two similar sans together. A common face is fine *if chosen*; the
tell is defaulting to Inter+purple without a decision.

### Example palettes (one accent on a neutral base)

| Mood | Background | Ink | Accent (≥3:1) |
|---|---|---|---|
| Trust SaaS | `#F8FAFC` | `#1E293B` | `#2563EB` (blue) |
| Approachable | `#F5F3FF` | `#1E1B4B` | `#6366F1` → `#059669` |
| E-commerce | `#ECFDF5` | `#064E3B` | `#059669` + `#EA580C` |
| Luxury | `#FAFAF9` | `#0C0A09` | `#A16207` (gold) |
| Financial / dark | `#020617` | `#F8FAFC` | `#22C55E` (status green) |

Construction: max one accent, chroma/saturation < ~80%, avoid pure black (use `#18181B`/`#0F172A`),
neutral base + single accent for flexibility, accent must pass 3:1 on its background.

### Scale cheat-sheet (copy-paste starting points)
```
Spacing (px):   4  8  12  16  24  32  48  64  96  128  192  256
Type (px):      12 14 16 18 20 24 30 36 48 60 72         (or ratio 1.25 from 16)
Radius (px):    sm 6 · md 8 · lg 12 · xl 16 · 2xl 24 · full 9999
Elevation:      sm (buttons) · md (dropdowns) · lg (modals)  — layered, tinted, one light source
Motion (ms):    micro 100–150 · standard 200–300 · macro 300–500
Breakpoints:    640 · 768 · 1024 · 1280 · 1536  (add where layout breaks, not at devices)
```

### Design-system / framework mapping (use the official kit when the brief implies it)

| Brief reads as | Reach for |
|---|---|
| Microsoft / enterprise | Fluent UI |
| Google / Material | Material Web + M3 tokens |
| IBM / analytics | Carbon |
| Shopify admin | Polaris |
| Atlassian-style | Atlaskit |
| GitHub devtool | Primer |
| UK / US public sector | GOV.UK Frontend / USWDS |
| Modern SaaS, owned code | **shadcn/ui** (Radix + Tailwind) + custom tokens |
| Accessible React baseline | Radix Themes |
| Aesthetic-led (bento, editorial, glass, brutalist) | Tailwind + native CSS + a motion lib |

**One design system per project** — don't mix Material + shadcn. With shadcn/Tailwind: CSS
variables for the token layer, `@apply` sparingly, and `class-variance-authority` (CVA) for
component variants. Toggle theme with `next-themes` (`attribute="class"`, `defaultTheme="system"`,
`disableTransitionOnChange`).

---

# PART V — WORKED EXAMPLE

## 16. Pawscriptions — "Tri-color Aussie" system

This project's own design system is a compact, real demonstration of nearly every principle
above. Source of truth: `src/app/globals.css` (tokens) + `DESIGN.md` (intent). Study it as a
reference for *applied* taste:

- **OKLCH semantic tokens, light + dark via `prefers-color-scheme`.** Warm-neutral ramp tinted
  toward the breed's brown hue (chroma ~0.006–0.02) — deliberately *not* the cream-AI cliché;
  the body is a barely-warm off-white and the warmth lives in the copper accent and espresso ink.
- **Restrained color strategy:** copper is the single accent, used only for primary action,
  active, and "given" state — never decoration. Inactive states never carry full saturation.
- **State color that fits the product's emotional register:** "due/overdue" is a warm `warning`,
  *not* alarming red; red is reserved for genuinely destructive actions. (Tone is a design
  decision, not a default.)
- **Tinted, layered, low-opacity shadows** carrying the warm hue (no harsh black) in light mode;
  in dark mode, depth comes from **lighter surfaces + borders + a 1px inner highlight**, not big
  shadows — exactly the elevation-by-lightness rule.
- **Two-family typography on a contrast axis:** Geist Sans for all functional UI (with
  `tabular-nums` on every dose/time/count so data aligns), Fraunces soft-serif for brand moments
  only (wordmark, greeting, empty/error titles) — never inside functional UI.
- **Concentric radius scale** (rows 1rem, cards 1.25rem, sheets 1.75rem, controls full) and a
  **Liquid Glass** floating header/tab bar that blurs + saturates content beneath it and
  **degrades to opaque** under `prefers-reduced-transparency` or no `backdrop-filter`.
- **Motion 150–280ms, ease-out `cubic-bezier(.22,1,.36,1)`**, `scale(.97)` press feedback, a
  gentle staggered list fade-up, bottom-sheet slide — with full `prefers-reduced-motion`
  collapse to instant.
- **Mobile-first patterns done right:** a bottom sheet (not a desktop modal) as the dose logger,
  a bottom tab bar, ≥44px touch targets, an on-brand copper `:focus-visible` ring, status never
  by color alone (icon + text), WCAG AA verified in both themes.

When extending this app, reference these tokens and components — don't introduce new one-offs.
The point of the worked example: a beautiful product UI is the *sum* of dozens of these small,
consistent, intentional decisions, exactly as catalogued in Parts II–III.

---

# PART VI — TOOLS

## 17. The installed design-skills catalog

Parts II–V are the *knowledge*. This section is the *tooling*: a portable catalog of the
design/UI/UX **agent skills** installed in this project — modular packages
([open agent skills](https://skills.sh/)) that apply the same philosophy hands-on. They live in
`.claude/skills/<name>/SKILL.md` and trigger by typing `/<skill-name>` or by the agent
auto-selecting one when a task matches. Reinstall them in any new project with the commands below.

### Install everything

```bash
# UI/UX intelligence + the "ckm" design suite (one repo, six skills)
npx skills add nextlevelbuilder/ui-ux-pro-max-skill

# Standalone design skills
npx skills add ryanthedev/design-for-ai
npx skills add Leonxlnx/taste-skill        # installs as "design-taste-frontend"
npx skills add emilkowalski/skill          # installs as "emil-design-eng"

# Impeccable manages itself via its own CLI (not the Skills CLI)
npx impeccable@latest                      # bootstraps into .claude/skills/impeccable
```

Housekeeping: `npx skills find <query>` · `npx skills check` · `npx skills update`. A
`skills-lock.json` at the project root pins each skill's source + content hash — commit/copy it
for reproducible installs. (Skills install into `.claude/skills/`, often git-ignored — decide
per project whether to track them.)

### The skills

**`ui-ux-pro-max`** — UI/UX design intelligence. A reference brain across web + mobile: 50+
styles, 161 palettes, 57 font pairings, 161 product types, 99 UX guidelines, 25 chart types, 10
stacks. *Best as the **first** step:* give it product type + stack + style up front, let it pick
palette/typography/guidelines, then hand off to build/polish skills.

**The `ckm:*` suite** (same repo, six skills): `ckm:design` (umbrella — brand identity, tokens,
logo/icon/banner/social generation via Gemini), `ckm:design-system` (three-layer tokens — the
systematic foundation), `ckm:ui-styling` (shadcn/Radix/Tailwind components, theming, dark mode),
`ckm:brand` (voice, messaging, style guides), `ckm:banner-design`, `ckm:slides`. *Start at the
system level (`ckm:design-system`) to lay tokens, then `ckm:ui-styling` to build against them.
Logo/banner/social generators need external tooling (Gemini key, headless browser) — verify
before relying on them.*

**`impeccable`** — production-grade frontend craft (self-managed: `npx impeccable@latest`). The
heavyweight build-and-polish skill: designs, redesigns, audits, critiques, polishes real
interfaces. Sub-commands (`craft`, `shape`, `audit`, `critique`, `polish`, `animate`, `bolder`,
`quieter`, `typeset`, `live`, `init`…) and live-in-browser iteration. *Invoke with sub-command +
target (`/impeccable audit src/app/page.tsx`). On a new project run `/impeccable init` first (it
expects a `PRODUCT.md`, optionally `DESIGN.md`). Reach for it when you want **ship-ready** output.*

**`emil-design-eng`** — UI polish philosophy (Emil Kowalski). A taste + craft lens for
interactions, component micro-details, and animation decisions. *Use on polish/review passes,
especially motion and transitions ("should this animate?", "make this dropdown feel right").
Complements impeccable: build with one, sanity-check feel with this.*

**`design-taste-frontend`** — anti-slop frontend (`Leonxlnx/taste-skill`). Reads the brief,
infers a non-templated direction, runs a strict pre-flight check. *Greenfield landing pages /
portfolios and redesigns where the explicit goal is to not look generic. Feed it a real brief
(audience, vibe, references).*

**`design-for-ai`** — visual-design principles from *Design for Hackers* (Kadavy). The reasoning
*behind* choices (why this ratio, why this palette). *Use as a teaching/review lens; pairs with
`ui-ux-pro-max` (it gives options, this explains/validates them).*

Other installed taste skills worth knowing: `high-end-visual-design`, `minimalist-ui`,
`industrial-brutalist-ui`, `stitch-design-taste`, `gpt-taste`, `redesign-existing-projects`.

### A practical pipeline for a new project
1. **Foundations** → `ckm:design-system` (tokens) + `ui-ux-pro-max` (palette, fonts, style).
2. **Brand** (if marketing) → `ckm:brand`, then `design-taste-frontend` for direction.
3. **Build** → `impeccable` (or `ckm:ui-styling` for shadcn component work).
4. **Polish & review** → `emil-design-eng` (motion/details) + `design-for-ai` (principles) +
   `/impeccable audit|critique`.
5. **Assets** → `ckm:design` (logo/icons/social), `ckm:banner-design`, `ckm:slides`.

Skills auto-trigger from their `description`, but you can always force one with `/<skill-name>`.
After installing, ask the agent "what skills do you have" to confirm everything registered.

---

*This manual synthesizes (a) the distilled craft knowledge inside the installed design skills
above and (b) cross-checked 2025–2026 web research from primary sources (web.dev, MDN, WCAG 2.2,
Apple HIG, Material Design 3, Refactoring UI, Josh Comeau, Emil Kowalski, Rauno Freiberg, NN/g,
Smashing, Every Layout, Utopia). Where sources disagreed, the disagreement is flagged in-line.
Carry this file into new projects so any agent can design from it.*

