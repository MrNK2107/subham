---
name: Subham
description: A celebration plan as a night street strung with serial lights; every function is a strand, progress is bulbs coming on.
colors:
  amber: "#ffb703"
  amber-deep: "#e89a00"
  rani: "#ff4f8b"
  leaf: "#2ee59d"
  warm: "#fff3d6"
  night: "#070a22"
  night-2: "#0d1236"
  panel: "#121845"
  panel-2: "#1a2157"
  wire: "#2a3166"
  wire-bright: "#3d4686"
  unlit-glass: "#262c5c"
  unlit-rim: "#3a4180"
  ink: "#f3eedf"
  ink-2: "#c3bfdc"
  ink-3: "#9a96bd"
  on-amber: "#1a1206"
  danger: "#ff7a7a"
typography:
  display:
    fontFamily: "Baloo 2, Baloo Thambi 2, Baloo Tammudu 2, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 6vw, 5rem)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Baloo 2, Baloo Thambi 2, Baloo Tammudu 2, system-ui, sans-serif"
    fontSize: "clamp(1.6rem, 3.2vw, 2.6rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Baloo 2, Baloo Thambi 2, Baloo Tammudu 2, system-ui, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Hind, Hind Madurai, Hind Guntur, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
    fontFeature: "tnum"
  label:
    fontFamily: "Hind, Hind Madurai, Hind Guntur, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 600
    lineHeight: 1.15
rounded:
  pill: "999px"
  panel: "18px"
  field: "12px"
  bubble: "14px"
  focus: "8px"
spacing:
  gutter: "1.25rem"
  stack: "1rem"
  card: "1.35rem"
  section: "5rem"
  section-lg: "6rem"
components:
  button-primary:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.on-amber}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.65rem 1.3rem"
    height: "46px"
  button-primary-hover:
    backgroundColor: "#ffc633"
    textColor: "{colors.on-amber}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.65rem 1.3rem"
    height: "46px"
  button-secondary-hover:
    textColor: "{colors.warm}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "0.65rem 0.8rem"
  card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "{spacing.card}"
  input:
    backgroundColor: "{colors.night-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0.65rem 0.85rem"
    height: "46px"
  badge:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "0.15rem 0.65rem"
  chip-selected:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 0 0 0.9rem"
  tab-selected:
    textColor: "{colors.warm}"
    padding: "0.6rem 1rem"
    height: "44px"
---

# Design System: Subham

## Overview

**Creative North Star: "The Lit Street"**

Subham is a night street strung with serial lights. The ground is a deep indigo night, panels are dark lit glass edged with a single wire line, and colour arrives only as light: marigold, rani pink, leaf green and warm white bulbs. Every function of a celebration is a strand, and progress is shown literally as bulbs coming on. Things that are not yet done are unlit glass, never hidden; things that are done glow.

The system is dark-only (`color-scheme: dark`) and moderately dense: landing sections breathe on 5 to 6rem bands, while the app (wizard, dashboard, assistant) packs cards on a 1rem rhythm. One rounded, warm type family carries Latin, Devanagari, Tamil and Telugu with the same voice, so a plan in Tamil looks like it belongs to the same street as one in English. Motion is a bulb warming up: a soft blur-and-rise reveal, springs for tabs and steps, a chase along the WebGL strands. All of it falls still under reduced motion, and content is visible without JavaScript.

The world rejects the cream-and-serif planner page and the split hero over a row of feature cards; the build replaces both with a full-bleed night scene and features hung as tags from a wire.

**Key Characteristics:**
- Indigo night ground, tonal panel steps, 1px wire borders.
- Four bulb colours, used as light (glow shadows, lit states), not as flat fills for chrome.
- Progress is a strand of bulbs (lit vs unlit glass), exposed as an ARIA meter.
- Pill-shaped actions; amber is the single primary action colour and it glows.
- Catenary wire curves (a sagging 1.5px line) as the recurring connector between grouped items.
- One Indian-foundry type family (Baloo / Hind) across four scripts.

## Colors

A night palette: four cool indigo depths and three lavender inks, lit by four saturated bulb colours.

### Primary
- **Marigold Amber** (amber): the single action and "lit" colour. Primary buttons, links, focus border on fields, selected tab underline and its bulb, countdown and budget figures, the first bulb of every pattern. Pressed against it, text is **Lamp Soot** (on-amber), never white.
- **Deep Marigold** (amber-deep): reserved darker amber step; defined in tokens for pressed or shaded amber.

### Secondary
- **Rani Pink** (rani): the second bulb colour, the selection highlight, and the alarm state of a strand: an overspent budget turns every bulb rani and makes it flicker. Error badges tint toward it (#ffb3c9 text on 14% rani).

### Tertiary
- **Leaf Green** (leaf): the third bulb colour and the "good" badge tint.
- **Warm White** (warm): the fourth bulb, hover text colour for links/buttons/nav, and the focus ring. Hanging function tags use it as their paper.

### Neutral
- **Indigo Night** (night): page ground, scrollbar track, theme colour.
- **Night Two** (night-2): field wells, bot chat bubbles, icon-button hover.
- **Lit Panel / Lit Panel Two** (panel, panel-2): card gradient (panel-2 at top to panel at bottom), summary tiles, assistant panel, wizard type cards.
- **Wire** (wire): every 1px border, row divider, tablist rule, unlit progress track.
- **Bright Wire** (wire-bright): field strokes, secondary-button stroke, the sagging catenary lines, scrollbar thumb.
- **Unlit Glass / Unlit Rim** (unlit-glass, unlit-rim): the fill and stroke of a bulb that is off. Used in BulbStrand, the feature strand and the closing reprise; currently literal values, not custom properties.
- **Moon Ink / Dusk Ink / Haze Ink** (ink, ink-2, ink-3): primary text, secondary text and hints, placeholders and footnotes.
- **Ember Red** (danger): error text and invalid-field strokes.

### Named Rules
**The Light Is the Accent Rule.** Bulb colours appear as light: a lit bulb, a glow shadow, a tinted badge at 10 to 14% alpha, a coloured script word. Chrome (panels, borders, nav) stays in the indigo neutrals.

**The One Amber Action Rule.** Amber fill with a glow belongs to the primary action only. Secondary actions are bare wire (transparent with a bright-wire stroke) and turn amber only at the border on hover.

**The Bulb Order Rule.** Multi-bulb patterns cycle amber, rani, leaf, warm in that order (BulbStrand, the WebGL chase, the reprise, script words).

## Typography

**Display Font:** Baloo 2 (Latin, Devanagari), with Baloo Thambi 2 (Tamil) and Baloo Tammudu 2 (Telugu), falling back to system-ui
**Body Font:** Hind (Latin, Devanagari), with Hind Madurai (Tamil) and Hind Guntur (Telugu), falling back to system-ui

**Character:** Baloo is round, heavy and festive without being cute; Hind is a plain, legible reader. Both are Indian-foundry families with script siblings, so the voice holds across languages.

### Hierarchy
- **Display** (800, clamp(2.4rem, 6vw, 5rem), 1.08): page h1. The landing hero tightens to clamp(2.4rem, 4.9vw, 4.6rem) at 0.98 line-height and 22ch, with a night text-shadow so it reads over the scene. Script showcase words reuse the display face at 800, clamp(2rem, 5vw, 3.6rem).
- **Headline** (700, clamp(1.6rem, 3.2vw, 2.6rem), 1.08): section h2; inside cards it drops to clamp(1.25rem, 1.9vw, 1.55rem).
- **Title** (700, 1.3rem): h3, strand names, wizard overlay title. h4 is 1.1rem.
- **Body** (400, 1.0625rem, 1.6, tabular numerals on): all reading text; leads cap at 44 to 60ch.
- **Label** (600, 0.95rem): field labels, buttons, nav links, tab labels; hints and stat labels at 0.9rem in Dusk Ink. Stat values and summary figures use the display face at 600, 1.35 to 1.4rem.

### Named Rules
**The One Voice Rule.** Display and body each resolve through their script siblings via the font stack; never set a Latin-only face on text that may be localised.

**The Balanced Head Rule.** Headings use `text-wrap: balance` and slight negative tracking (-0.015em); body text is never tracked.

## Layout

A centred 1200px container with a 1.25rem gutter. The landing hero is full-bleed (min-height 100svh minus the 64px header) with content anchored bottom-left and the describe form as a doorway panel up to 560px wide. Landing sections are horizontal bands separated by 1px wire rules, padded 5 to 6rem, alternating night and a slightly lifted #0a0e2c with faint rani and leaf radial washes.

The dashboard is a two-column grid (fluid main + 360px sticky assistant) that collapses to one column at 960px, where the assistant becomes a bottom sheet. Card collections use auto-fit/auto-fill grids with `minmax(min(Npx, 100%), 1fr)` (160px stats, 280px vendors/ideas, 300px two-up) so nothing overflows on phones. The wizard is a single 820px column. Gaps run on 0.5 / 0.75 / 1 / 1.25rem. Breakpoints observed: 560, 640, 900, 960px. Every interactive target is at least 44px.

## Elevation & Depth

Depth is a hybrid of tonal layering and light. Surfaces step up from night to night-2 to panel to panel-2; a single deep, soft drop (lift) separates cards from the ground. Above that, elevation is expressed as glow: lit things cast coloured light downward, unlit things cast nothing. The sticky header and the doorway panel are translucent night glass with backdrop blur.

### Shadow Vocabulary
- **Lift** (`box-shadow: 0 18px 40px -18px rgb(0 0 0 / 70%)`): cards, the assistant panel, the doorway.
- **Amber Glow** (`box-shadow: 0 0 0 1px rgb(255 183 3 / 55%), 0 6px 24px -4px rgb(255 183 3 / 45%)`): primary button at rest; hover strengthens to 80% ring and `0 8px 34px -2px rgb(255 183 3 / 60%)`.
- **Bulb Glow** (`box-shadow: 0 3px 12px <bulb colour at 70-80%>`): any lit bulb; larger feature bulbs use `0 4px 16px`.
- **Lintel Glow** (`box-shadow: 0 -1px 0 rgb(255 183 3 / 60%), 0 -18px 50px -20px rgb(255 183 3 / 55%)`): the doorway panel's upward spill, paired with a 2px amber-to-warm gradient lintel.
- **Field Focus Halo** (`box-shadow: 0 0 0 3px rgb(255 183 3 / 22%)`): focused input, select, textarea.

### Named Rules
**The Lit Means Done Rule.** Glow is state. A bulb, tab marker or feature bulb glows only when its thing is active, selected or complete; at rest it is unlit glass.

## Shapes

Soft and round. Actions, badges, chips, the language switch and progress tracks are full pills (999px). Cards and strand rows use an 18px radius, fields 12px, chat bubbles 14px with the tail corner squared to 4px, focus rings 8px. Bulbs share one silhouette: `border-radius: 50% 50% 46% 46% / 60% 60% 40% 40%`, taller than wide (10x14, 12x17, 16x22px), with a 4px cap socket in #4a5293. Grouped items hang from a catenary: a 1.5px bright-wire bottom border on an element rounded `0 0 50% 50% / 0 0 100% 100%`; on mobile the feature catenary straightens into a vertical wire. Hanging tags have a 6px top and 10px bottom radius on a 1.5px string.

## Components

### Buttons
Lit bulbs and bare wire.
- **Shape:** full pill (999px), min-height 46px (small variant 44px, 0.95rem text).
- **Primary:** amber fill, Lamp Soot text, Amber Glow; often leads with the bulb icon.
- **Hover / Focus:** primary brightens to #ffc633 and the glow widens; secondary's stroke turns amber and text warm; ghost gains a 6% white wash. Active presses down 1px at 99% scale. Focus is the global 2px warm outline at 3px offset. Disabled drops to 55% opacity.
- **Secondary:** transparent with bright-wire stroke. **Ghost:** no stroke, Dusk Ink text, tighter inline padding.

### Chips and Badges
- **Badge:** pill, 0.82rem semibold, 7% white wash with wire stroke; good (leaf), warn (amber) and bad (rani) variants tint fill at 10 to 14% and stroke at 40 to 50%.
- **Function chip (wizard):** amber-tinted pill (10% fill, 40% stroke) with a 44px round remove target.

### Cards / Containers
- **Corner Style:** 18px.
- **Background:** vertical gradient panel-2 to panel.
- **Shadow Strategy:** Lift.
- **Border:** 1px wire.
- **Internal Padding:** 1.35rem. Selected selection cards (wizard type) take an amber stroke and 12% amber wash.

### Inputs / Fields
- **Style:** night-2 well, 1px bright-wire stroke, 12px radius, 46px min-height (textarea 96px), Haze Ink placeholders, amber caret.
- **Focus:** amber border plus the 3px amber halo; no outline.
- **Error / Disabled:** `aria-invalid` turns the stroke Ember Red; error text is 0.9rem semibold Ember Red. Checkboxes and radios take amber accent colour.

### Navigation
- **Header:** sticky translucent night glass (72% night, 14px blur), 64px, hairline bright-wire rule. Wordmark in display 800 at 1.55rem. Links are semibold Dusk Ink pills, warm on hover, amber when `aria-current`. Below 640px the nav wraps to its own full-width row.
- **Tabs:** underline tabs on a 2px wire rule; each tab carries an 8x11 bulb that lights amber with a glow when selected, and the selected label goes warm over a 3px amber underline.

### Bulb Strand (signature)
The progress indicator for tasks, budget, vendors and guests. A sagging 1.5px wire with up to 12 bulbs that follow its curve (middle bulbs hang lowest), coloured in Bulb Order. Lit count is the done share, and any progress above zero lights at least one bulb. Overspent: every bulb turns rani and flickers (1.6s). Exposed as `role="meter"` with a spoken value. Bulbs warm over 0.4s background and 0.5s glow on the house ease (`cubic-bezier(0.16, 1, 0.3, 1)`).

### Night Street Scene (signature)
Full-bleed WebGL hero: five parabolic strands at increasing depth and sag, 26 bulbs per strand scaled by aspect, phase-offset sway and a chase wave in which every fourth bulb stays as a base glow. Function tags hang from strings and sway ±3° (hidden below 900px). A bottom shade gradient keeps the headline and doorway legible.

### Assistant Panel
Sticky lit-glass column with an amber hairline on top. User bubbles are amber with Lamp Soot text, bot bubbles night-2; proposals sit in small 10px-radius wire cards behind a dashed divider. Becomes a fixed bottom sheet below 960px.

## Do's and Don'ts

### Do:
- **Do** show progress as a Bulb Strand (lit vs unlit glass, Bulb Order) with a meter role and spoken value.
- **Do** keep one amber, glowing primary action per view; pair it with a bare-wire secondary.
- **Do** connect grouped items with the 1.5px sagging catenary wire in bright-wire.
- **Do** draw icons from the shared Icon set (24px grid, 1.75 stroke, round caps and joins).
- **Do** use the house ease `cubic-bezier(0.16, 1, 0.3, 1)` for state changes and springs (stiffness 120, damping 18) for tab and step entrances; keep content visible without JS and still under reduced motion.
- **Do** keep every interactive target at least 44px and focus visible with the 2px warm outline.

### Don't:
- **Don't** use a cream or paper ground with serif display type; the world is the night street.
- **Don't** compose a split hero over a row of feature cards.
- **Don't** glow anything that is not active, selected or complete; unlit is the honest resting state.
- **Don't** fill chrome (panels, nav, borders) with bulb colours; they are light, not paint.
- **Don't** set white text on amber; use Lamp Soot (on-amber).
- **Don't** introduce a Latin-only typeface for localisable text.
