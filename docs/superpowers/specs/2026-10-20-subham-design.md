# Subham — design

## Intent

PromptWars Virtual, Challenge 5:

> Create a GenAI-powered planning assistant that helps users organize weddings, birthdays, and community events with budgets, timelines, vendor checklists, and personalized ideas.

Subham (शुभम् / சுபம் / శుభం, "auspicious") is that assistant for **Indian** celebrations. The goal is the highest
possible score from the PromptWars AI ranker, which judges: problem-statement alignment, code quality,
security, efficiency, testing, accessibility and use of Google services. Usability matters most to the user.

Time box: 4 hours to build and test, starting 2026-10-20.

Reference: `Harsha-code-per/UtsavOS` scored 96. We take inspiration from its *qualities* (requirement →
feature mapping in the README, "AI proposes, code guarantees", layered security, thorough tests) but **must
not copy it**: own name, concept, features, structure and code.

## Goals

1. Cover all four requirements visibly: budgets, timelines, vendor checklists, personalized ideas — for
   weddings, birthdays and community events (festivals as a bonus type).
2. India-first planning:
   - **Events are made of functions** (sub-events). Wedding → haldi, mehendi, sangeet, wedding ceremony,
     reception. Birthday → party (+ optional puja). Community → setup, puja/ceremony, bhandara/meal,
     cultural programme. Each function has its own budget share, date/time, tasks and vendors; everything
     rolls up to one plan total.
   - **City-tier cost awareness**: metro / tier-2 / tier-3 multipliers drive per-guest cost estimates and a
     "is this budget realistic?" check.
   - **Date-risk check**: warns about monsoon months, major festival clashes (vendor scarcity, traffic),
     peak wedding season pricing, and commonly avoided periods (Pitru Paksha, Kharmas) — stated as
     informational, never prescriptive.
   - **Guest list + RSVP**: side (bride/groom/host), RSVP status, dietary (veg, Jain, non-veg), headcount
     per function; confirmed headcount feeds the catering estimate.
3. Languages (user requirement):
   - Full UI in **English, Hindi, Tamil, Telugu**; switchable anywhere, remembered.
   - AI content (plan, ideas, assistant replies) in **10 languages**: en, hi, ta, te, kn, ml, bn, mr, gu, pa.
     The assistant replies in the language the user writes in (Tanglish/Hinglish ok).
   - Voice input via the browser speech API in the chosen language.
   - `lang` attributes on Indic text; fonts covering Devanagari, Tamil, Telugu.
4. AI assistant that **proposes plan changes via function calling**; nothing applies until the user approves.
5. Sharing: WhatsApp share of checklist/summary, printable summary (print CSS), `.ics` / Google Calendar
   links for tasks and functions.
6. Signed-in sync and family collaboration (Firebase Auth + Firestore), with share-by-email editor/viewer
   roles enforced by Firestore rules.
7. Strong engineering signals: strict TS, zod everywhere, nonce CSP + security headers, rate limits,
   prompt-injection hardening, unit + component + API + rules + e2e + axe tests, CI, README mapping each
   requirement to code, SECURITY.md threat model.

## Non-goals

- Real vendor marketplace/booking or payments.
- Translating UI into more than 4 languages (AI content covers the rest).
- Astrology/muhurat calculation (we only flag commonly avoided periods from a static table).

## Anti-goals (failure even if it "works")

- Visible copying of UtsavOS (names, file layout, prose, code).
- Budget numbers that don't add up, dates after the event, or AI output applied without validation.
- AI being required: the app must still produce a usable plan with no model available.
- Leaking keys to the browser.

## Constraints and decided how

- **Stack**: Next.js 16 App Router, React 19, TypeScript strict, zod 4, CSS modules (no UI framework).
- **AI providers behind one interface** (`AiProvider`):
  - `gemini` — `@google/genai`: structured output (`responseJsonSchema` from zod), function calling,
    Google Search grounding for ideas. Used in production.
  - `ollama` — local **gemma4** via Ollama HTTP API (`format` JSON schema, `tools`). Used for local testing
    now; the user will supply Gemini/GCP credentials after local works.
  - `mock` — deterministic, for unit/e2e tests.
  - Selected by `AI_PROVIDER` env (default: gemini if `GEMINI_API_KEY` set, else ollama if
    `OLLAMA_URL` set, else template fallback).
- **Principle**: the model returns intent (category percentages per function, "days before" offsets,
  proposed changes). Pure tested code produces exact rupee allocations (largest remainder, sums exactly to
  total), concrete dates (clamped to today..event date), and re-validates every change.
- **Fallback**: curated India templates per event type produce a full plan when AI fails.
- **Persistence**: localStorage (zod-validated) by default; Firestore when signed in.
- **Hosting**: Google Cloud Run (Dockerfile, Next standalone output). Firebase Auth + Firestore.
- **Tests**: Vitest + Testing Library; Firestore rules on emulator (Java 21 available); Playwright +
  axe-core (desktop + mobile) with `AI_PROVIDER=mock`.
- **CI**: GitHub Actions: audit, format, lint, typecheck, coverage, rules tests, e2e.

## Screens

1. **Landing**: one-line "describe your event" box (any language) → prefilled wizard; plus "start
   step by step". Language switcher in header.
2. **New plan wizard**: event type → functions (preselected per type, editable) → city (tier inferred from
   a city list, overridable), date, guests, budget (₹, supports lakh input), food preference, style/vibe,
   plan language. Inline validation, focus moves to first error.
3. **Plan dashboard** (tabs, WAI-ARIA): Overview (countdown, progress, date-risk alerts, budget realism),
   Budget (per function × category, log spend, overruns in text), Timeline (milestones + per-function run
   sheet, `.ics`), Vendors (checklist status todo/contacted/booked, quote, questions, WhatsApp share),
   Guests (list, RSVP, dietary, headcount per function), Ideas (AI, grounded with sources when on Gemini).
   Assistant panel available on every tab.
4. **My plans** list.

## API

`POST /api/brief` (free text → partial brief), `POST /api/plan` (brief → plan), `POST /api/assistant`
(plan + messages → reply + proposed changes), `POST /api/ideas` (brief → ideas + sources). All: JSON
content-type check, body size cap, zod validation, per-IP rate limit, no-store, safe error messages,
TTL cache for identical plan/ideas requests.

## Left to the builder

Visual design (warm, festive, readable; no generic AI look), exact copy, template contents, the static
festival/season table (2026–2027), city tier list, test breakdown.

## Calls made by Claude (not user-decided)

Name, Next.js + Cloud Run stack, function-based event model, city tiers, date-risk check, guest/RSVP,
collaboration via Firestore roles, non-streaming assistant replies (streaming dropped to fit the time box).
