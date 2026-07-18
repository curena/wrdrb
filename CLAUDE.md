@AGENTS.md

# wrdrb

A personal wardrobe manager. It keeps an inventory of the owner's clothing and
uses qualitative tags plus rule-based matching to recommend outfits: complete a
partially chosen outfit, suggest a matching item for a given piece, or generate
a full outfit from scratch.

The recommendation engine is the product; the inventory is the substrate that
feeds it.

## V1 scope

In scope:

- **Inventory CRUD** — items categorized as tops, bottoms, hats, accessories,
  footwear. Metadata: name, category, colors, pattern, formality,
  season/temperature band, purchase date/price (optional).
- **Photos** — one or more photos per item, captured via the phone camera or
  uploaded. Dominant colors are auto-extracted from the photo to pre-fill color
  tags (plain image processing — no AI/LLM dependency in V1). Manual override
  always wins.
- **Availability state** — clean / in laundry / at cleaners / in seasonal
  storage / lent out. Unavailable items are never recommended.
- **Matching engine (rule-based)** — three entry points:
  1. *Complete an outfit*: given one or more chosen items, fill the remaining
     slots.
  2. *Suggest an item*: given one item, recommend matching items of a requested
     category.
  3. *Generate an outfit*: build a full outfit from nothing, given
     occasion/formality and season.
- **Wear history** — log what was worn and when; used to avoid recent repeats
  and to compute cost-per-wear and "never worn" reports later.
- **Saved outfits** — persist generated or hand-built combos as named outfits;
  rate/favorite them. Accept/reject/tweak actions on suggestions are recorded
  for a future learning loop.

Explicitly deferred to V2+ (do not build speculatively):

- Live weather API integration (V1 uses static season/temperature-band tags).
- LLM-vision auto-tagging of category/pattern/formality from photos.
- Packing lists, calendar planning, gap/shopping analysis, versatility scores.
- Any ML-based recommendation. The engine stays rule-based and explainable.

## Domain model (V1)

- `Item` — category (top | bottom | hat | accessory | footwear), name, colors
  (ordered, dominant first), pattern (solid | striped | plaid | floral |
  graphic | other), formality (1–5 scale), seasons/temp band, availability
  state, photos, purchase info.
- `Outfit` — a set of slots, not a fixed 5-tuple. Slots are optional and some
  are repeatable (layering: base + mid + outer tops). A slot can be constrained
  (e.g. outer layer only exists below a temperature band).
- `WearLog` — item/outfit worn on a date, optional context tag.
- `SuggestionFeedback` — proposed combo, action taken (accepted / rejected /
  tweaked), timestamp. Write-only in V1; consumed by the learning loop in V2.

## Matching rules

Matching is rule-based and every suggestion must be explainable ("why these
items"). Dimensions, all first-class:

1. **Color** — basic color theory: neutrals match everything; otherwise prefer
   complementary/analogous relationships; limit an outfit to ~one statement
   color.
2. **Formality** — items in an outfit must be within 1 point of each other on
   the 1–5 scale (no sneakers with a suit).
3. **Season/temperature** — items must overlap the target season/temp band; the
   outer-layer slot disappears in hot bands (no jacket in an Austin summer).
4. **Pattern** — at most one bold pattern per outfit; solids are always safe.
5. **Availability** — hard filter, applied first.
6. **Recency** — soft penalty for items/outfits worn in the last N days.

Rules live in pure, unit-tested functions with no I/O so they can be exercised
exhaustively.

## Tech stack (decided)

- Mobile-first **PWA** (installable, camera capture front and center — adding
  items happens standing next to the closet).
- **Next.js 16 (App Router, Turbopack)**, TypeScript, Tailwind 4. Note: Next 16
  differs from older training data — consult `node_modules/next/dist/docs/`
  before using unfamiliar APIs.
- **No Serwist.** PWA is a generated `src/app/manifest.ts` plus a minimal
  hand-rolled `public/sw.js` registered by
  `src/app/service-worker-registration.tsx` — this follows Next's own PWA
  guide. Keep the service worker boring until offline caching is a real
  requirement.
- **SQLite** (better-sqlite3) via **Drizzle ORM**; single-user, no auth in V1.
  DB file lives in `data/` (gitignored); path overridable via `WRDRB_DB_PATH`.
  Migrations are generated into `drizzle/` and committed.
- Color extraction with **node-vibrant** — no external AI services.
- Tests run with **vitest** (`npm test`); config in `vitest.config.ts`.

## Repo layout

- `src/engine/` — the pure matching engine (`types.ts`, `rules.ts`,
  `outfit.ts`) and its unit tests. No I/O or framework imports allowed here.
- `src/db/` — Drizzle schema and client. `drizzle.config.ts` +
  `npm run db:generate` / `npm run db:push` manage migrations.
- `src/app/` — Next.js App Router pages (`/`, `/inventory`, `/outfits`),
  manifest, and service-worker registration.
- `public/` — static assets: `sw.js`, placeholder icons (`icon-192/512.png`,
  solid-color stand-ins to be replaced with real artwork).

## Conventions

- The matching engine is pure logic — keep it framework-free and covered by
  unit tests before wiring any UI to it.
- Prefer boring, explainable code over clever heuristics; every recommendation
  should be traceable to a named rule.
- Update this file when a deferred decision (framework choice, schema changes)
  gets made.
