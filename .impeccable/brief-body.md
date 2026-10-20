# Surface brief: Subham landing + app

Scope: landing page (Persuade) plus wizard, dashboard, assistant and plans list (Operate), all in one world.
Audience: families planning their own celebration and community organisers, equally; phones first, Indian scripts.
Action: describe the celebration in one line (any language), or start step by step.
Proof: a working plan by function, so the product shows its mechanism live instead of claiming it.
Constraints: nonce CSP, axe WCAG 2.2 AA, prefers-reduced-motion, en/hi/ta/te, no fabricated proof.
Memorable moment: strands of serial lights sway over a night street; one strand per function, and its bulbs light up as that function's tasks get done.

## Direction contract

THESIS: A celebration plan is a street strung with serial lights. Each function is a strand, and progress is bulbs coming on. Refuses the cream-and-serif planner page and the split hero over a row of feature cards.

OWN-WORLD: Indigo night ground (#070a22 to #121845), with wire lines in #2a3166. Bulbs in marigold amber #ffb703, rani pink #ff4f8b, leaf green #2ee59d and warm white #fff3d6. Panels are dark lit glass with 1px wire borders. The active state glows; inactive bulbs are unlit glass. Type is the Baloo 2 / Thambi / Tammudu family for display and Hind / Madurai / Guntur for body, so one voice carries across Devanagari, Tamil and Telugu.

STORY: A visitor sees the street come alive, understands that every function gets its own strand, types the event in their own language, and gets a plan whose progress lights up.

FIRST VIEWPORT: A full-bleed Three.js night scene with 5 catenary strands of chasing bulbs over rooftop silhouettes, swaying with the pointer. A large two-line headline sits left of centre. The describe form is a lit doorway panel at lower left, with the primary action "Light it up" glowing amber. Function tags hang from the strands.

FORM: Diwali serial lights, my own top-ranked grounded candidate (IMPECCABLE'S PICK, chosen by the user). seed: df0b5cc613164a4f

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

Signature interaction: chase patterns run along the strands; scroll lights each strand in turn; in the app, progress is shown as bulb strands (tasks, budget, vendors, guests).
Motion grammar: Motion springs (stiffness 120, damping 18) for reveals and tab changes; bulbs warm up over 400ms with an ease-out glow; everything is static under reduced motion.
