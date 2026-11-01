---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: []
---

# Surface brief: Subham landing + app

Scope: landing page (Persuade) plus wizard, dashboard, assistant and plans list (Operate), all in one world.
Audience: families planning their own celebration and community organisers, equally; phones first, Indian scripts.
Action: describe the celebration in one line (any language), or start step by step.
Proof: real slices of a plan by function (run sheet, vendors, food and guests, the assistant asking first), labelled as an example. No walls of figures.
Constraints: nonce CSP, axe WCAG 2.2 AA, prefers-reduced-motion, en/hi/ta/te, no fabricated proof.
Memorable moment: the page is one celebration evening; scrolling moves the clock from golden-hour haldi to the lit lane at midnight, and the light in every photograph changes with it.

## Direction contract

THESIS: The landing page is one celebration evening told as its own run sheet. Each time stamp opens a path-traced scene of a function with that function's plan beside it. Refuses the feature-card grid and the stat-strip demo.

OWN-WORLD: Photographic night world: Cycles renders (golden-hour courtyard, dusk terrace, lamp-lit mandap, late dinner, the lit lane) on a warm black ground (#0b0807), smoked-glass panels with a hairline warm border, marigold amber #ffb703 as the single action colour, warm white type. Baloo 2 display, Hind body.

STORY: The visitor sees the street, scrolls, and lives the evening hour by hour; at each hour they see exactly what Subham plans for it, then reaches the lit lane again and types their own celebration.

FIRST VIEWPORT: Unchanged hero: the relit lane full bleed, two-line headline lower left, the smoked-glass describe form with "Light it up". Below it a sticky time rail on the left edge carries the clock (4:30 pm to 11:00 pm) through every chapter.

FORM: One evening, start to finish (my grounded list, position 3; dealt). seed: ae1c6611b6fd3bc4

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Signature interaction: a sticky clock on the time rail advances with scroll; each scene's photograph scales and settles as its hour arrives, and the page's ambient light cools from gold to night.
Motion grammar: exponential ease-out (0.16, 1, 0.3, 1); scene plates scale 1.08 to 1 with scroll; headings reveal line by line once; everything static under reduced motion.
