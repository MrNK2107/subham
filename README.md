# Subham · शुभम् · சுபம் · శుభం

**An India-first GenAI planner for weddings, birthdays, community events and festivals.** Describe your
celebration in one line, in English, Hindi, Tamil, Telugu or a mix like Tanglish, and Subham drafts a plan
for **every function** (haldi, mehendi, sangeet, muhurtham, reception, puja, community meal…) with a
**budget**, **timeline and run sheet**, **vendor checklist**, **guest list** and **personalised ideas**. An
assistant then helps you adjust it, and only changes what you approve.

Built for PromptWars Virtual, Challenge 5.

> _Create a GenAI-powered planning assistant that helps users organize weddings, birthdays, and community
> events with budgets, timelines, vendor checklists, and personalized ideas._

---

## What it does, mapped to the brief

| Brief asks for                        | How Subham delivers it                                                                                                                                                                                                                         | Code                                                                                                                                                             |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Weddings, birthdays, community events | An event is a set of **functions**. Each type starts with the usual ones (a wedding: haldi → reception; a community event: setup, puja, community meal, cultural programme) and you can add regional ones (nalangu, pellikuthuru…)             | [`presets.ts`](src/core/presets.ts), [`Wizard.tsx`](src/ui/wizard/Wizard.tsx)                                                                                    |
| **Budgets**                           | Split per function and per category to the exact rupee. Typing "15 lakh" or "80k" works. A **city-tier check** (metro / tier-2 / town) says whether the budget is tight, and payments show overruns in words                                   | [`allocate.ts`](src/core/allocate.ts), [`estimate.ts`](src/core/estimate.ts), [`money.ts`](src/core/money.ts), [`BudgetTab.tsx`](src/ui/dashboard/BudgetTab.tsx) |
| **Timelines**                         | To-dos counted back from each function's date (never in the past), a run sheet per function, `.ics` export and one-click Google Calendar links. A **date check** warns about monsoon, festival clashes, peak season and Kharmas / Pitru Paksha | [`schedule.ts`](src/core/schedule.ts), [`calendar.ts`](src/core/calendar.ts), [`ics.ts`](src/core/ics.ts), [`TimelineTab.tsx`](src/ui/dashboard/TimelineTab.tsx) |
| **Vendor checklists**                 | Every vendor from "to contact" to "booked" with the quote, plus questions to ask before paying an advance (GST, cancellation, what's included)                                                                                                 | [`VendorsTab.tsx`](src/ui/dashboard/VendorsTab.tsx)                                                                                                              |
| **Personalised ideas**                | Themes, decor, food, activities and gifts that fit the region, city, food preference (veg / Jain), vibe and budget. On Gemini, fresh ideas are **grounded with Google Search** and cite sources                                                | [`IdeasTab.tsx`](src/ui/dashboard/IdeasTab.tsx), [`/api/ideas`](src/app/api/ideas/route.ts)                                                                      |
| Planning **assistant**                | Chat in any language. It **calls typed tools** to propose changes (move budget, log a payment, add a task, book a vendor…), shows each in plain words, and applies only what you approve                                                       | [`Assistant.tsx`](src/ui/assistant/Assistant.tsx), [`tools.ts`](src/ai/tools.ts), [`changes.ts`](src/core/changes.ts)                                            |
| Beyond the brief                      | Guest list with RSVP, side and diet that tells the caterer how many plates; WhatsApp share; printable summary; family sharing with editor / viewer roles                                                                                       | [`guests.ts`](src/core/guests.ts), [`share.ts`](src/core/share.ts), [`ShareFamily.tsx`](src/ui/dashboard/ShareFamily.tsx)                                        |

## Built for India, in Indian languages

- **Interface in English, हिन्दी, தமிழ் and తెలుగు**, switchable anywhere and remembered. Every string goes through a typed dictionary, and a test checks the four have identical keys and placeholders.
- **Plans and replies in 10 languages**: English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati and Punjabi. The assistant answers in the language you write in.
- **Voice input** uses the browser's speech recognition in the plan's language (e.g. `ta-IN`).
- Function names are localised (மஞ்சள் நீராட்டு, పసుపు వేడుక, हल्दी) and still recognised as the same function for timing and budgeting.
- Indic text carries the right `lang` attribute, and Noto Sans Devanagari, Tamil and Telugu are self-hosted, so each script downloads only when it appears.

## How generative AI is used

| Step                | AI capability                                                                                                                                                                 | Where                                                   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| One-line quick-fill | Structured extraction from free text in any language ("12 lakh" → 1200000, "next Pongal" → a date). Every field is required-but-nullable so even small models answer each one | `extractBrief` in [`assistant.ts`](src/ai/assistant.ts) |
| Full plan draft     | Structured output: the JSON Schema is generated from the same zod schema the app validates with                                                                               | `blueprint`, [`prompts.ts`](src/ai/prompts.ts)          |
| Assistant           | Function calling with 7 tools declared from zod schemas                                                                                                                       | `converse`, [`tools.ts`](src/ai/tools.ts)               |
| Local ideas         | Google Search grounding with cited sources (Gemini), falling back to schema-constrained ideas                                                                                 | `ideas`                                                 |

**AI suggests, code decides.** The model returns _intent_: category percentages, "N days before"
offsets and proposed changes. Pure, tested code turns that into the plan:

- [`allocate`](src/core/allocate.ts) uses the largest-remainder method, so rupee amounts always add up to exactly the budget, even when the model's percentages don't sum to 100.
- [`dueDate`](src/core/schedule.ts) keeps every task between today and its function.
- [`cleanBlueprint`](src/core/assemble.ts) keeps each valid item and drops the rest (for example, a "category" that is just "5%").
- [`withFallbacks`](src/core/assemble.ts) fills any section a model left thin from curated Indian templates.
- [`applyChange`](src/core/changes.ts) re-validates the whole plan after every approved change.

**Resilient by design.**

- **Backends:** one `AiProvider` interface has two engines: **Gemini** (`@google/genai`, a model chain with per-attempt timeouts that moves to the next model on 404, 429, 5xx or timeout) and **Ollama**, for running fully offline on a local model such as Gemma 4.
- **No AI available:** the app still produces a complete plan from templates and offers to redraft later.
- **Caching:** identical drafts and idea requests are cached for 30 minutes.

## Google services

- **Gemini API**: structured output, function calling and Google Search grounding.
- **Firebase Authentication**: Google sign-in to sync plans across devices.
- **Cloud Firestore**: synced plans with family sharing. [Security rules](firestore.rules) enforce owner, editor and viewer roles and the document shape, and are tested on the emulator.
- **Google Cloud Run**: a container deployment ([`Dockerfile`](Dockerfile)) with a health check at `/api/health`.
- **Google Calendar**: `.ics` export and one-click "add to Google Calendar" links.
- **Google Fonts**: Fraunces and Noto Sans (Devanagari, Tamil, Telugu) via `next/font`, self-hosted at build time.

## Architecture

```mermaid
flowchart LR
  subgraph Browser
    UI[Landing · Wizard · Dashboard · Assistant]
    LS[(localStorage, zod-validated)]
    UI <--> LS
  end
  subgraph CloudRun[Cloud Run · Next.js]
    PX[proxy.ts · nonce CSP]
    API[/api/brief · plan · assistant · ideas/<br/>guard · throttle · cache]
    AI[AiProvider<br/>Gemini | Ollama | mock]
    CORE[core/ · pure logic<br/>allocate · schedule · calendar · changes · ics]
  end
  GEM[(Gemini + Google Search)]
  FB[(Firebase Auth + Firestore)]
  UI --> PX --> API --> AI --> GEM
  API --> CORE
  UI -- Google sign-in · role-based rules --> FB
```

```
src/core/      framework-free domain logic: types (zod), money, allocation, city tiers, date risks,
               scheduling, templates, plan assembly, changes, guests, iCal, WhatsApp text
src/ai/        provider contract, Gemini and Ollama engines, shared assistant, prompts, tools, mock
src/server/    request guard, per-client throttle, TTL cache, CSP builder, request schemas
src/i18n/      en / hi / ta / te dictionaries and the language hook
src/store/     validated local store, React hooks, lazy Firebase and Firestore sync
src/ui/        shell, landing, wizard, dashboard tabs, assistant
src/app/       routes and API handlers
e2e/  rules/   Playwright + axe suites, Firestore rules tests
```

## Security

Details and threat model in [SECURITY.md](SECURITY.md).

- **Secrets:** API keys stay on the server. The Firebase web config is public by design, and Firestore rules enforce access.
- **Content Security Policy:** a per-request nonce with `strict-dynamic` and no `unsafe-inline` or `unsafe-eval` in production. Plus HSTS, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy and Permissions-Policy (microphone for this site only).
- **API requests:** every route checks the content type and body size, validates with zod, applies a per-client rate limit, never caches responses, and returns error messages that reveal nothing internal.
- **Prompt injection:** user text goes inside fenced tags with `<` escaped, model output is schema-validated, and tool calls are allow-listed, re-checked against the real plan, and applied only after approval.
- **Dependencies:** `npm audit --omit=dev` reports 0 vulnerabilities, and CI checks it on every push.

## Accessibility

- **Audited:** axe-core (WCAG 2.2 AA) checks the landing page in English and Tamil, every wizard step including error states, every dashboard tab, the assistant and the plans list, on desktop and Pixel 7, in CI.
- **Structure and forms:** a skip link and semantic landmarks. Every input has a label, and inline errors are linked with `aria-describedby`. Focus moves to the first invalid field and to each new wizard step.
- **Keyboard:** WAI-ARIA tabs with roving tabindex and arrow, Home and End keys. Scrollable tables can be reached and scrolled by keyboard.
- **Announcements:** `aria-live` regions for assistant replies, AI progress and guest counts.
- **Not colour alone:** overruns, statuses and due dates are always stated in words.
- **Targets and motion:** touch targets are at least 44px, `prefers-reduced-motion` is respected, and a print stylesheet is included.

## Efficiency

- **Lazy loading:** the Firebase SDK loads with dynamic `import()` only when sign-in is used, so the landing page never downloads it.
- **Local maths:** budget, timeline, calendar and guest maths run locally and instantly. Only drafting, quick-fill, chat and ideas call the model.
- **Model chain:** each attempt has its own timeout within a fixed total time budget, thinking is set low for speed, and repeated requests hit the cache.

## Testing

| Suite                                      | Command                                                   | What it covers                                                                                                                                              |
| ------------------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit, component, API (Vitest, RTL)         | `npm run coverage`                                        | Domain logic, AI engines with fakes, prompts and tools, every API route (success, fallback, cache, 400/415/413/429), UI components                          |
| Firestore rules (emulator)                 | `npm run test:rules`                                      | Owner, editor and viewer permissions, strangers, malformed documents, closed collections                                                                    |
| End-to-end (Playwright, desktop + Pixel 7) | `npm run test:e2e`                                        | Describe → plan → overspend → approved fix → calendar export, persistence, language switching, axe audits, CSP and headers, no sideways scrolling on phones |
| Live model (opt-in)                        | `LIVE_AI=1 AI_PROVIDER=ollama npx vitest run src/ai/live` | A real model drafts a Tamil wedding, reads a Telugu-English description and proposes a valid change                                                         |

CI ([`ci.yml`](.github/workflows/ci.yml)) runs audit, Prettier, ESLint, the type check, coverage, rules tests and the e2e suite on every push.

## Run it locally

```bash
npm install
cp .env.example .env.local
# Option A: fully local AI with Ollama (no key needed)
#   ollama pull gemma4 && set AI_PROVIDER=ollama in .env.local
# Option B: Gemini
#   set GEMINI_API_KEY in .env.local
npm run dev            # http://localhost:3000
```

Without any AI configured, Subham still works from its built-in templates. Without Firebase config, sign-in
is hidden and plans stay on the device.

## Deploy to Cloud Run

```bash
gcloud run deploy subham --source . --region asia-south1 --allow-unauthenticated \
  --set-env-vars AI_PROVIDER=gemini --set-secrets GEMINI_API_KEY=gemini-api-key:latest
```

Pass the `NEXT_PUBLIC_FIREBASE_*` values as build arguments, and deploy the rules with
`firebase deploy --only firestore:rules`.

Tech: Next.js 16 (App Router), React 19, TypeScript (strict), zod 4, `@google/genai`, Firebase, Vitest, Playwright, axe-core.
