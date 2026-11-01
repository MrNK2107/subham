---
name: Subham
description: A celebration planner lit like a festival night; the landing page is one evening photographed hour by hour, the app is a night street of serial lights where progress is bulbs coming on.
colors:
  amber: "#ffb703"
  amber-deep: "#e89a00"
  rani: "#ff4f8b"
  leaf: "#2ee59d"
  warm: "#fff3d6"
  ink: "#f3eedf"
  on-amber: "#1a1206"
  danger: "#ff7a7a"
  ground: "#0b0807"
  ground-haldi: "#170e07"
  ground-sangeet: "#0f0a10"
  ground-ceremony: "#100806"
  ground-sendoff: "#07070b"
  glass-top: "rgb(26 19 16 / 60%)"
  glass-bottom: "rgb(10 8 9 / 76%)"
  hairline: "rgb(255 236 205 / 13%)"
  hour-white: "#fff1d6"
  bulb-off: "#2c211d"
  bulb-off-rim: "#5a463b"
  bulb-lit: "#ffcf7a"
  bulb-lit-rim: "#ffe2a8"
  night: "#070a22"
  night-2: "#0d1236"
  panel: "#121845"
  panel-2: "#1a2157"
  wire: "#2a3166"
  wire-bright: "#3d4686"
  unlit-glass: "#262c5c"
  unlit-rim: "#3a4180"
  ink-2: "#c3bfdc"
  ink-3: "#9a96bd"
typography:
  display:
    fontFamily: "Baloo 2, Baloo Thambi 2, Baloo Tammudu 2, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 6vw, 5rem)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.015em"
  hour:
    fontFamily: "Baloo 2, Baloo Thambi 2, Baloo Tammudu 2, system-ui, sans-serif"
    fontSize: "clamp(3rem, 6.4vw, 5.75rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
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
  lead:
    fontFamily: "Hind, Hind Madurai, Hind Guntur, system-ui, sans-serif"
    fontSize: "clamp(1.05rem, 1.4vw, 1.25rem)"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Hind, Hind Madurai, Hind Guntur, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 600
    lineHeight: 1.15
rounded:
  pill: "999px"
  doorway: "22px 22px 18px 18px"
  panel: "18px"
  field: "12px"
  bubble: "14px"
  focus: "8px"
spacing:
  gutter: "1.25rem"
  stack: "1rem"
  card: "1.35rem"
  glass: "1.4rem"
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
  input:
    backgroundColor: "{colors.night-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0.65rem 0.85rem"
    height: "46px"
  smoked-glass-panel:
    backgroundColor: "{colors.glass-bottom}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "1.1rem 1.25rem 0.5rem"
  doorway:
    backgroundColor: "{colors.glass-bottom}"
    textColor: "{colors.ink}"
    rounded: "{rounded.doorway}"
    padding: "{spacing.glass}"
  card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "{spacing.card}"
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

**Creative North Star: "Lights On"**

Subham is a celebration seen at night by the light of its own decorations. It lives in two connected worlds that share one type family, one marigold action colour and one idea: light means something is happening.

**The landing world** (`/`) is photographic. Its ground is the warm black of a night photograph (ground), never the app's indigo. Path-traced Cycles renders carry the page: the lit lane in the hero (relit live in WebGL), four close still lifes for the hours of one evening (haldi, sangeet, ceremony, send-off), and the lane again at midnight. Type is cream on that warm black, panels are smoked glass the photographs blur through, and the only things that glow are real light sources: a bulb, the lintel over the describe form, the primary action. As the visitor scrolls, the air between photographs shifts from one hour's tint to the next and each photograph settles into place.

**The app world** (wizard, dashboard, plans list, assistant) is the indigo night street: a deep indigo ground, tonal lit-glass panels edged with one wire line, and four bulb colours (marigold, rani, leaf, warm white) used as light. Every function is a strand and progress is bulbs coming on. Both worlds are dark only (`color-scheme: dark`). On the landing page alone, the shared header and footer take the warm ground so the first screen reads as one photograph; everywhere else they stay indigo. Motion in both is a light warming up, and it all falls still under reduced motion.

**Key Characteristics:**
- Landing: warm-black photographic ground with an hour-tinted `--ground`, cream type at opacity steps, smoked-glass panels with a warm hairline.
- App: indigo night ground, tonal panel steps, 1px wire borders, four bulb colours as light.
- Marigold amber is the single action colour in both worlds.
- Glow belongs to light sources only.
- Pill actions; 18px panels; round bulbs.
- One Indian-foundry type family (Baloo / Hind) across Latin, Devanagari, Tamil and Telugu.

## Colors

Two grounds, one fire: a warm photographic black for the landing story, an indigo night for the working app, and marigold light shared by both.

### Primary
- **Marigold Amber** (amber): the one action colour everywhere: primary buttons, links, the focus stroke on fields, the active hour's name on the time rail, row times in a run-sheet slice, the function name beside each chapter's time. Text on amber is **Lamp Soot** (on-amber), never white.
- **Deep Marigold** (amber-deep): reserved darker amber step for pressed or shaded amber.

### Secondary
- **Rani Pink** (rani): app only. The second bulb colour, the text selection highlight, and the alarm state of a strand (an overspent budget turns every bulb rani and flickers). Error badges tint toward it (#ffb3c9 text on 14% rani).

### Tertiary
- **Leaf Green** (leaf): app only. The third bulb colour and the "good" badge tint.
- **Warm White** (warm): the fourth bulb, link and button hover text, and the global 2px focus ring.

### Neutral: the landing world
- **Lamp-Black Ground** (ground): page, hero, kinds band and close background on `/`; also the html, body, header (at 72%) and footer there. Every shade over a photograph is this warm black at varying alpha (`rgb(11 8 7 / n%)` or `rgb(9 7 8 / n%)`).
- **Hour Grounds** (ground-haldi, ground-sangeet, ground-ceremony, ground-sendoff): golden, dusk, lamp-lit and night tints of the evening section's `--ground`. It is registered with `@property` as a `<color>`, so it fades between hours over 1400ms on the house ease. Each chapter's photograph fades into it at top and bottom.
- **Cream Ink** (ink): the same value as the app's Moon Ink, declared on the landing page as `--cream`. Landing type uses it at stepped opacity: 90% for slice row text, 86% for leads, 80% for section copy, 74% for resting kinds rows, 72% for small tags, 68% for hints, 52% for inactive rail items, 50% for placeholders.
- **Hour White** (hour-white): the big chapter times and the active rail time. It is a touch warmer than cream so the clock reads as lamplight.
- **Smoked Glass** (glass-top to glass-bottom): the vertical gradient of every landing panel, over a backdrop blur.
- **Warm Hairline** (hairline): the 1px border of glass panels and the phone rail strip. Dividers use the same warm white at 8 to 12%, field strokes at 16% (30% on hover), secondary-button strokes at 26%.
- **Off Bulb / Off Rim, Lit Bulb / Lit Rim** (bulb-off, bulb-off-rim, bulb-lit, bulb-lit-rim): the 12 to 13px round bulbs on the time rail and the kinds list.

### Neutral: the app world
- **Indigo Night** (night): app page ground, scrollbar track, theme colour.
- **Night Two** (night-2): field wells, bot chat bubbles, icon-button hover.
- **Lit Panel / Lit Panel Two** (panel, panel-2): card gradient (panel-2 at the top to panel at the bottom), summary tiles, the assistant panel.
- **Wire / Bright Wire** (wire, wire-bright): every 1px border and divider; field and secondary-button strokes, catenary lines, scrollbar thumb.
- **Unlit Glass / Unlit Rim** (unlit-glass, unlit-rim): a Bulb Strand bulb that is off, with a #4a5293 cap socket.
- **Dusk Ink / Haze Ink** (ink-2, ink-3): secondary text and hints; placeholders and footnotes.
- **Ember Red** (danger): error text and invalid-field strokes in both worlds.

### Named Rules
**The Two Grounds Rule.** A surface is warm black or indigo, never both. The landing page and its header and footer are warm black (scoped with `body:has(#hero-title)`). The wizard, dashboard, plans list and assistant are indigo. Shades over a photograph are always the warm black, never the UI indigo.

**The One Amber Action Rule.** An amber fill belongs to the primary action. Secondary actions are bare wire (transparent with a stroke) and turn amber only at the border on hover. Elsewhere amber appears as type or light, not as fill.

**The Light Is the Accent Rule.** In the app, the bulb colours appear as light: a lit bulb, a glow, a badge tinted at 10 to 14%. Chrome stays in the neutrals. On the landing page the photographs carry the colour, and the UI adds only amber.

**The Bulb Order Rule.** App multi-bulb patterns (Bulb Strand, the wordmark) cycle amber, rani, leaf, warm in that order.

## Typography

**Display Font:** Baloo 2 (Latin, Devanagari), with Baloo Thambi 2 (Tamil) and Baloo Tammudu 2 (Telugu), falling back to system-ui
**Body Font:** Hind (Latin, Devanagari), with Hind Madurai (Tamil) and Hind Guntur (Telugu), falling back to system-ui

**Character:** Baloo is round, heavy and festive without being cute. Hind is a plain, legible reader. Both are Indian-foundry families with script siblings, so the voice holds across languages.

### Hierarchy
- **Display** (800): the app h1. The landing hero tightens it to clamp(2.4rem, 4.9vw, 4.6rem) at 0.98 line-height and 22ch, and the midnight close to clamp(2.4rem, 5.4vw, 4.75rem) at line-height 1 and 15ch. Both sit on a soft black text-shadow over the photograph.
- **Hour** (800, tabular): the chapter time ("4:30 pm") in Hour White, locked on one line with the function name in amber Hind 600 (1.15rem). It never wraps. On phones it is clamp(2.1rem, 9.6vw, 3.25rem).
- **Headline** (700): the app h2. Landing section heads run larger: the evening intro at clamp(2.2rem, 4.6vw, 4rem) and 1.02, the kinds head at clamp(2rem, 3.8vw, 3.25rem) and 1.04. Chapter h3s are clamp(1.6rem, 2.8vw, 2.5rem) at 20ch. Inside app cards, h2 drops to clamp(1.25rem, 1.9vw, 1.55rem).
- **Title** (700, 1.3rem): h3 in the app. Panel heads on the landing page use display 700 at 1.2 to 1.25rem (doorway label, slice head).
- **Body** (400, 1.0625rem, 1.6, tabular numerals): all reading text. **Lead** (clamp(1.05rem, 1.4vw, 1.25rem)) caps at 46 to 52ch. The kinds sentences are display 600 at clamp(1.25rem, 2.1vw, 1.75rem), each tagged with its own `lang`.
- **Label** (600, 0.95rem): field labels, buttons, nav links and tabs. Hints are 0.9rem. Rail names are 0.9rem and slice tags 0.8rem at weight 500.

### Named Rules
**The One Voice Rule.** Display and body each resolve through their script siblings via the font stack. Never set a Latin-only face on text that may be localised.

**The Balanced Head Rule.** Headings use `text-wrap: balance` and slight negative tracking (-0.015em; -0.02em on the hour numerals). Body text is never tracked.

## Layout

Both worlds use a centred 1200px container with a 1.25rem gutter. Every interactive target is at least 44px.

**Landing.** The page runs in full-bleed bands on the warm ground. In order:
- **Hero:** min-height 100svh minus the 64px header, content anchored bottom-left in a column up to 860px, the describe form up to 560px wide.
- **Evening:** an intro, then four chapters of min-height 100svh with content bottom-aligned (22vh top, 12vh bottom padding). Each chapter is a three-column grid (9.5rem rail gutter, 34rem copy, the glass slice pushed to the end at up to 27rem). A time rail sticks at `calc(64px + 22vh)` down the left edge.
- **Kinds:** a 0.8fr / 1.4fr split with a sticky head and hairline-ruled rows.
- **Close:** the midnight photograph at min-height 88svh, copy beside a second describe form up to 32rem.

At 900px and below, everything stacks to one column. Each chapter photograph becomes a 4:3 plate that its copy overlaps by 3.5rem. The rail becomes a pill strip stuck under the header (its offset is tracked from the header's real height): the active hour shows its time and name, and the other hours shrink to their bulbs, with their names kept for screen readers. Photographs re-aim their `object-position` for portrait so the lit side stays behind the words.

**App.** The dashboard is a two-column grid (fluid main + 360px sticky assistant) that collapses at 960px, where the assistant becomes a bottom sheet. Card collections use `minmax(min(Npx, 100%), 1fr)` auto grids (160px stats, 280px vendors and ideas, 300px two-up). The wizard is a single 820px column. Gaps run 0.5 / 0.75 / 1 / 1.25rem. Breakpoints observed: 560, 640, 900, 960px.

## Elevation & Depth

**Landing.** Depth comes from the photograph and the air over it. Warm-black gradients ("night air") are darkest where the words sit and open where the light is, and they fade into the ground at each band's edge. Overlay layers bleed 2px past their box, and photographs inset 3px over solid ground, so fractional heights never show a seam. Glass panels sit on the photograph with a backdrop blur (16 to 18px, saturate 130 to 135%), a 7 to 8% inner top highlight and a deep black drop.

**App.** Tonal layering from night to night-2 to panel to panel-2, plus a single soft drop (lift). Lit things cast coloured light, and unlit things cast nothing.

### Shadow Vocabulary
- **Glass Drop** (`box-shadow: inset 0 1px 0 rgb(255 244 225 / 7%), 0 30px 60px -24px rgb(0 0 0 / 85%)`): landing slices. The doorway uses an 8% highlight and an 80% drop.
- **Lintel Spill** (`0 -14px 44px -22px rgb(255 183 3 / 45%)`): the doorway's upward amber light, under a 2px amber-warm-amber gradient lintel inset 12% from each side.
- **Bulb Halo** (`box-shadow: 0 0 0 3px rgb(255 183 3 / 18%), 0 0 18px 4px rgb(255 170 60 / 55%)`): the active rail bulb. A hovered kinds bulb uses `0 0 14px 3px rgb(255 170 60 / 55%)`.
- **Night Text Shade** (`text-shadow: 0 2px 6px rgb(0 0 0 / 45%), 0 6px 48px rgb(0 0 0 / 70%)` and lighter variants): type over photographs. It is a shade, not a glow.
- **Lift** (`0 18px 40px -18px rgb(0 0 0 / 70%)`): app cards and the assistant panel.
- **Amber Glow** (`0 0 0 1px rgb(255 183 3 / 55%), 0 6px 24px -4px rgb(255 183 3 / 45%)`): the primary button at rest. Hover raises it to an 80% ring and `0 8px 34px -2px rgb(255 183 3 / 60%)`.
- **Bulb Glow** (`0 3px 12px <bulb colour at 70-80%>`): a lit Bulb Strand bulb in the app.
- **Field Focus Halo** (`0 0 0 3px rgb(255 183 3 / 22%)`): a focused input, select or textarea.

### Named Rules
**The Light Source Rule.** Glow is emitted only by a light source: a bulb, the doorway lintel, the primary action (drawn as a lit bulb). Panels, type and photographs never glow. Darkening shadows are always black or warm black.

**The Lit Means Now Rule.** A bulb lights only when its thing is active, selected, hovered or complete: the hour on screen, the example under the pointer, the work that is done. At rest it is an off bulb, visible and unlit.

## Shapes

Soft and round in both worlds:
- **Pills (999px):** actions, badges, chips, the language switch, progress tracks, the slice tag, the kinds arrow button and the phone rail strip.
- **Radii:** landing glass panels and app cards are 18px. The doorway is 22px at the top and 18px at the bottom. Fields are 12px, chat bubbles 14px with the tail corner squared to 4px, and focus rings 8px.
- **Bulbs:** landing bulbs are plain circles (11 to 13px) with a 1px rim. App strand bulbs are taller than wide (`border-radius: 50% 50% 46% 46% / 60% 60% 40% 40%`, 10x14 to 16x22px) with a 4px cap socket. In the app, grouped bulbs hang from a 1.5px bright-wire catenary.
- **Lines:** landing dividers and the desktop rail line are 1px warm-white lines. The rail line fades at both ends.

## Components

### Buttons
Lit bulbs and bare wire. Shared by both worlds.
- **Shape:** full pill (999px), min-height 46px (the small variant is 44px with 0.95rem text).
- **Primary:** amber fill, Lamp Soot text, Amber Glow, often led by the bulb icon ("Light it up").
- **Hover / Focus:** primary brightens to #ffc633 and its glow widens. Secondary's stroke turns amber and its text warm. Ghost gains a 6% white wash. Active presses down 1px at 99% scale. Focus is the global 2px warm outline at 3px offset. Disabled drops to 55% opacity.
- **Secondary:** transparent with a stroke: bright wire in the app, and warm white at 26% over a 4% wash inside landing glass. **Ghost:** no stroke, Dusk Ink text, tighter inline padding.

### Inputs / Fields
- **Style (app):** a night-2 well with a 1px bright-wire stroke, 12px radius, 46px min-height (textarea 96px), Haze Ink placeholders and an amber caret.
- **Style (landing glass):** a 32% black well with a warm-white stroke at 16% (30% on hover), placeholders in cream at 50% and hints in cream at 68%.
- **Focus:** amber border plus the 3px amber halo, no outline, in both worlds.
- **Error:** `aria-invalid` turns the stroke Ember Red. Error text is 0.9rem semibold Ember Red with `role="alert"`.

### Cards / Containers
- **Smoked Glass Panel (landing):** the glass gradient, a 16 to 18px backdrop blur, the warm hairline, an 18px radius and the Glass Drop. Used for chapter run-sheet slices, where the head is display 700 with a dashed-outline "Example plan" pill and rows are a tabular amber time over cream text on 10% warm dividers.
- **Lit Panel Card (app):** a panel-2 to panel gradient, 1px wire border, 18px radius, Lift, 1.35rem padding. Selected selection cards take an amber stroke and a 12% amber wash.

### Navigation
- **Header:** sticky translucent glass, 64px, with a hairline bottom rule. In the app it is indigo (72% night, 14px blur). On `/` it is warm black at 72% with a 10% warm hairline. The wordmark is display 800 at 1.55rem. Links are semibold pills, warm on hover and amber when `aria-current`.
- **Tabs (app):** underline tabs on a 2px wire rule. Each tab carries an 8x11 bulb that lights amber when selected.

### Describe Form, "the doorway" (landing signature)
The one action on the page, offered twice with shared text: in the hero over the lit lane, and at the midnight close. It is smoked glass (the doorway variant, 1.4rem padding) with a lit lintel and Lintel Spill, a display label, a three-row textarea, a hint, the primary "Light it up" button and a secondary link into the step-by-step wizard. Picking a kinds sentence fills the closing form, scrolls to it (smoothly unless reduced motion is set) and focuses it.

### Time Rail (landing signature)
The evening's clock, an ordered list of hour links (`aria-current="step"`), driven by which chapter crosses mid-screen.
- **Desktop:** a sticky column on the left edge. A fading 1px line threads one bulb per hour. The active hour's time scales to 1.45x in Hour White, its name turns amber and its bulb lights with the Bulb Halo. Inactive hours sit at 52% cream.
- **Phones:** a blurred warm-black pill strip under the header.

### Kinds List (landing)
Real celebration sentences, each in its own script, in hairline-ruled rows: an off bulb, the sentence and a 44px round arrow button. On hover or focus the row goes full cream, the bulb lights and the arrow fills amber and nudges toward the form below. Keyboard focus is a 2px amber outline.

### Street Lights (landing hero)
A photographic hero, not a 3D scene:
- **Compositor:** a WebGL2 sum of baked Cycles light-group layers (ambient, four chase phases, two curtain sets) with weights from a controller that cycles serial-light modes (chase, alternate flash, steady breath; 9s each with 1.2s crossfades). It applies the same AgX view transform the scene was lit under, a soft bloom taken from mip levels 3 and 5 at 7%, a vignette and fine grain.
- **Behaviour:** a submitted description flares the whole street. The camera drifts slightly toward the pointer. The layer is never server-rendered: it loads when the page is idle, pauses offscreen and in background tabs, and shows a single still frame under reduced motion. Data Saver users keep the baked poster, which also shows first and stays if the layers fail.
- **Text:** no text sits inside the scene. A warm-black shade darkens the lower left for the headline (on phones it shades from top to bottom).

### Evening Chapters (landing)
Four Cycles still lifes, encoded as 1080 and 1920 WebP. They are plain `<img>` with `srcset`, explicit dimensions, lazy loading and real `alt` text, because `next/image` emits style attributes that the nonce CSP blocks. Each raster has a `.json` provenance sidecar. They are produced by `scripts/blender/*.py`.

### Bulb Strand (app signature)
The progress meter for tasks, budget, vendors and guests: a sagging 1.5px wire with up to 12 bulbs in Bulb Order. The lit count is the done share, and any progress above zero lights at least one bulb. When overspent, every bulb turns rani and flickers (1.6s). Exposed as `role="meter"` with a spoken value.

### Assistant Panel (app)
A sticky lit-glass column with an amber hairline on top. User bubbles are amber with Lamp Soot text and bot bubbles are night-2. It becomes a fixed bottom sheet below 960px.

### Motion
- **Ease:** the house ease is `cubic-bezier(0.16, 1, 0.3, 1)`.
- **Landing (pure CSS):** scroll-driven animation with `animation-timeline: view()`, so nothing is written as an inline style. Chapter photographs settle from 1.14x scale at 40% brightness. Chapter copy and slices rise 44px out of a 6px blur. The midnight plate pulls back from 1.18x at 35% brightness. Kinds rows slide in 24px. All of it is wrapped in `@supports (animation-timeline: view())` and `prefers-reduced-motion: no-preference`, so without support or with reduced motion the page is fully static and fully visible.
- **Hero:** the hero lead and doorway reveal on mount. The headline never fades, because it is the largest paint.
- **App:** a blur-and-rise reveal, and springs (stiffness 120, damping 18) for tabs and steps.

## Do's and Don'ts

### Do:
- **Do** set the landing page on the warm-black ground (#0b0807) with cream type at opacity steps. Keep the wizard, dashboard, plans list and assistant on the indigo tokens.
- **Do** make landing panels smoked glass: the glass gradient, a 16 to 18px backdrop blur and the 13% warm hairline, so the photograph shows through.
- **Do** keep one amber primary action per form, paired with a bare-wire secondary. Text on amber is Lamp Soot.
- **Do** let only light sources glow: bulbs, the lintel, the primary action.
- **Do** darken photographs with warm-black gradients that fade into the ground, with overlays bleeding 2px past their box.
- **Do** drive landing motion with CSS scroll timelines behind `@supports` and `prefers-reduced-motion: no-preference`. Use the house ease `cubic-bezier(0.16, 1, 0.3, 1)` for state changes.
- **Do** ship rasters as pre-sized plain `<img>` with `srcset`, explicit width and height, and a provenance sidecar.
- **Do** show app progress as a Bulb Strand with a meter role and spoken value.
- **Do** keep every interactive target at least 44px, with focus visible: the 2px warm outline, or 2px amber on landing rows and rail links.

### Don't:
- **Don't** put the app's indigo on the landing page or warm black in the app. Never shade a photograph with the UI indigo.
- **Don't** glow panels, type or photographs. Text-shadows over photographs are black shade only.
- **Don't** fill landing chrome with any colour but amber. On the landing page the photographs carry the colour.
- **Don't** compose a split hero over a row of feature cards, or a stat strip.
- **Don't** use a cream or paper ground with serif display type.
- **Don't** set white text on amber.
- **Don't** introduce a Latin-only typeface for localisable text.
- **Don't** use `next/image` or server-rendered style attributes; the nonce CSP blocks them.
