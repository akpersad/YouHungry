## YouHungry — Portfolio Evaluation & Design Assets

### 1️⃣ Evaluation (for Senior Front-End Showpiece)

**Strengths**

- **Modern stack:** Next.js App Router + TypeScript + Tailwind + Clerk + MongoDB + Google Places + real-time updates. Shows full-stack fluency.
- **Strong hygiene:** Playwright end-to-end tests, ESLint config, Lighthouse scripts, Vercel setup.
- **Polish:** PWA support, dark mode, responsive design, auth flow, and clear UX for decision-making (search → shortlist → vote → finalize).

**Improvements**

1. **CASE_STUDY_README as case study**

- Add annotated screenshots or a short GIF.
- Include a **“Tech choices & tradeoffs”** table (e.g., App Router vs pages, Clerk vs NextAuth).

2. **Architecture diagram**

- Visualize flow: client → Next.js (server actions) → MongoDB → external APIs → notifications.

3. **Quality proof**

- CI & Lighthouse badges, Playwright screenshots, code coverage snippet.

4. **“Walk the code” section**

- Link to your 5 best files: one UI state component, one server action, one data layer, one utility (weighted randomizer), one error boundary.

6. **Security & performance**

- Mention Zod validation, rate-limit policy, and bundle optimization (show `next build` output).

---

### 2️⃣ Logo — SVG (Light/Dark Adaptable)

**Concept:** “Fork In The Road” — a **map pin splitting into two roads**, negative space forms a **fork**. Clean and scalable.

```svg
<!-- youhungry-logomark.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-labelledby="t d">
<title id="t">Fork In The Road – Logomark</title>
<desc id="d">A map pin whose inner negative space forms a fork; two roads split at the base.</desc>
<defs>
<mask id="cut">
<rect width="100%" height="100%" fill="white"/>
<g transform="translate(38,18)">
<rect x="6" y="20" width="8" height="22" rx="4" ry="4" fill="black"/>
<rect x="0" y="12" width="4" height="12" rx="2" fill="black"/>
<rect x="6" y="10" width="4" height="14" rx="2" fill="black"/>
<rect x="12" y="10" width="4" height="14" rx="2" fill="black"/>
<rect x="18" y="12" width="4" height="12" rx="2" fill="black"/>
</g>
</mask>
</defs>
<path fill="currentColor" mask="url(#cut)"
d="M48 6c-16.6 0-30 13.1-30 29.2 0 8.8 4.1 15.8 9.3 22.6 4.5 6 9.8 11.7 14.7 18.8 2.5 3.6 4.7 7.6 6 11.4 1.3-3.8 3.5-7.8 6-11.4 4.8-7.1 10.1-12.8 14.7-18.8 5.2-6.9 9.3-13.8 9.3-22.6C78 19.1 64.6 6 48 6z"/>
<path fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"
d="M30 76 Q45 70 62 76"/>
<path fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"
d="M30 86 Q45 80 62 86"/>
</svg>


Use color: #111827 for light UIs or color: #F9FAFB for dark UIs.




<!-- app-icon-light.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="YouHungry app icon">
<rect x="64" y="64" width="896" height="896" rx="200" fill="#FFFFFF"/>
<g transform="translate(192,160)" fill="#111827" stroke="#111827">
<g transform="scale(8.8)">
<path fill="#111827"
d="M48 6c-16.6 0-30 13.1-30 29.2 0 8.8 4.1 15.8 9.3 22.6 4.5 6 9.8 11.7 14.7 18.8 2.5 3.6 4.7 7.6 6 11.4 1.3-3.8 3.5-7.8 6-11.4 4.8-7.1 10.1-12.8 14.7-18.8 5.2-6.9 9.3-13.8 9.3-22.6C78 19.1 64.6 6 48 6z"/>
<path d="M30 76 Q45 70 62 76" fill="none" stroke="#111827" stroke-width="6" stroke-linecap="round"/>
<path d="M30 86 Q45 80 62 86" fill="none" stroke="#111827" stroke-width="6" stroke-linecap="round"/>
</g>
</g>
</svg>



<!-- app-icon-dark.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="YouHungry app icon (dark)">
<rect x="64" y="64" width="896" height="896" rx="200" fill="#0B1220"/>
<g transform="translate(192,160)" fill="#F9FAFB" stroke="#F9FAFB">
<g transform="scale(8.8)">
<path fill="#F9FAFB"
d="M48 6c-16.6 0-30 13.1-30 29.2 0 8.8 4.1 15.8 9.3 22.6 4.5 6 9.8 11.7 14.7 18.8 2.5 3.6 4.7 7.6 6 11.4 1.3-3.8 3.5-7.8 6-11.4 4.8-7.1 10.1-12.8 14.7-18.8 5.2-6.9 9.3-13.8 9.3-22.6C78 19.1 64.6 6 48 6z"/>
<path d="M30 76 Q45 70 62 76" fill="none" stroke="#F9FAFB" stroke-width="6" stroke-linecap="round"/>
<path d="M30 86 Q45 80 62 86" fill="none" stroke="#F9FAFB" stroke-width="6" stroke-linecap="round"/>
</g>
</g>
</svg>
```
