# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences with equal weight:

- **Families planning their own celebration**: a bride's or groom's family, parents planning a child's birthday. Non-professionals juggling relatives, a fixed budget and many vendors, mostly on a phone, often in Hindi, Tamil, Telugu or a mix with English.
- **Community organisers**: society, temple, club or neighbourhood committees running a Ganesh pandal, Pongal, Onam, a community meal or an annual day, with volunteers and pooled contributions.

## Product Purpose

Subham is a GenAI planning assistant for Indian weddings, birthdays, community events and festivals (PromptWars Virtual Challenge 5). From one line or a short wizard it drafts a budget, timeline, vendor checklist, guest list and personalised ideas for every function of the event, and an assistant refines the plan with the person's approval. Success: a usable, trustworthy plan in minutes, in the person's language.

## Positioning

Events are planned as their real **functions** (haldi, mehendi, sangeet, muhurtham, reception; setup, puja, community meal), each with its own budget, tasks, run sheet and vendors. India-specific judgement is built in: city-tier cost checks, monsoon / festival / peak-season / Kharmas date checks, lakh-and-crore amounts, veg and Jain food preferences. The AI suggests; tested code guarantees budgets that add up and dates that make sense, and nothing changes without approval.

## Operating Context

Planned over weeks or months, revisited often, shared with family on WhatsApp, printed for elders, added to Google Calendar. Used on phones in Indian scripts as much as on laptops.

## Capabilities and Constraints

- Next.js 16 App Router, React 19, TypeScript, CSS modules; strict nonce-based CSP (no inline scripts).
- UI in English, Hindi, Tamil, Telugu; AI content in 10 Indian languages; voice input.
- AI: Gemini in production, local Ollama (Gemma 4) for development, template fallback without AI.
- Firebase Auth + Firestore sync and family sharing; Cloud Run deployment.
- Judged by an AI ranker on problem alignment, code quality, security, efficiency, testing, accessibility and Google services; axe WCAG 2.2 AA end-to-end audits must keep passing.

## Brand Commitments

- Name: **Subham** (शुभम् / சுபம் / శుభం, "auspicious").
- The user asked for: a celebratory, festive feel on the front end; a Three.js scene; Framer Motion for smooth motion; a strong, polished front end.
- Must be clearly original and must not resemble the UtsavOS reference project (github.com/Harsha-code-per/UtsavOS) in look, motifs or layout. That project used a cream ground, Rozha One / Mukta, and a toran (door garland) strip motif.

## Evidence on Hand

No real testimonials, customers, usage numbers or press. Never fabricate them. Demonstration plans in the UI must be labelled as examples.

## Product Principles

1. Plan the way Indian families actually celebrate: by function, not as one flat event.
2. The AI suggests; the person decides. Every change is visible and needs approval.
3. Speak the person's language: script, amounts in lakh, local customs.
4. Work without AI, without sign-in and on a slow phone.

## Accessibility & Inclusion

WCAG 2.2 AA, verified by axe in CI on every page and tab, desktop and mobile. Respect prefers-reduced-motion. Correct `lang` on Indic text. Touch targets of at least 44px.
