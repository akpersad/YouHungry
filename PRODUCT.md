# Product

## Register

product

## Users

Friends and small groups (plus solo users) deciding where to eat — on their
phones, often hungry, often mid-group-chat. The core context is social and
slightly impatient: someone opens the app to _end_ a "where should we eat?"
debate, not to browse. Secondary audience: hiring managers and engineers
reviewing the owner's portfolio — the app is a flagship piece, so craft is
part of the product.

## Product Purpose

Fork In The Road turns restaurant indecision into a decision. Users build
collections of restaurants (personal or group), then decide via a weighted
random spin (30-day decay keeps picks fresh) or tiered group voting
(ranked-choice, 3/2/1 points). Success looks like: a group goes from "idk,
you pick" to a confirmed restaurant in under a minute, and the result feels
fair and a little fun. It is a PWA with offline ambitions — installable,
fast, mobile-first.

## Brand Personality

**Fresh, playful, social.** Warm and appetizing in its foundation —
food-forward, not tech-forward — with the playfulness concentrated in the
decision moments (the spin, the vote reveal, empty states, copy). The voice
is confident and action-oriented: the app ends debates. Think Airbnb's warm,
human product craft crossed with Resy's dining-culture editorial sensibility;
the energy of a game night, not the chrome of a tool.

## Anti-references

- **Delivery-app generic** (DoorDash/UberEats): utilitarian red-and-white
  commerce UI, dense promo cards, transactional energy.
- **Corporate SaaS dashboard**: gray sidebar + KPI cards + default-shadcn
  look. The pre-redesign monochrome leaned this way; the redesign explicitly
  moves away from it.
- **Cartoonish / over-gamified**: mascots, confetti-everywhere, bouncy
  easing. Playful ≠ toy-like.
- **AI-template slop**: parchment-cream hero, gradient text, identical card
  grids, eyebrow kickers on every section, hero-metric blocks. If it looks
  generated, it failed.

## Design Principles

1. **End the debate.** Every screen drives toward a decision. The decide
   actions are always primary, never buried; the decision moment is the
   product's hero and gets the most design attention.
2. **Food first, chrome last.** Restaurant names, cuisines, photos, and
   places carry the interface. UI recedes to a warm stage; it never competes
   with the content people are actually choosing between.
3. **Playful in the moments, calm in the frame.** Personality lives in the
   spin, the vote reveal, empty states, and microcopy. The structural frame
   (nav, forms, lists) stays composed and quietly warm.
4. **Social presence is felt.** Groups, votes, and friends should feel alive
   — who's in, who's voted, what won — without nagging. The app celebrates
   group consensus.
5. **Honest craft.** No template scaffolding, no fabricated polish. Measured
   claims, tested states, real accessibility. (House rule repo-wide: the
   README badge honesty pass set the tone.)

## Accessibility & Inclusion

- **WCAG 2.1 AA is enforced in CI**: axe scan (`e2e/accessibility.spec.ts`)
  and Lighthouse accessibility category assert at **error** level (≥0.9) on
  every PR. Body text ≥4.5:1, large text ≥3:1 — verify on the warm palette,
  including text-on-accent and placeholder text.
- **Reduced motion is honored** (`prefers-reduced-motion`): PageTransition
  already adapts; every new animation needs a reduced-motion alternative
  (crossfade or instant). Decision-moment animations especially.
- Mobile-first PWA: touch targets ≥44px, one-handed reach for primary
  actions, works installed and offline-degraded.
- Color is never the only signal (vote states, weights, statuses carry icons
  or text too).
