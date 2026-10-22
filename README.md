# Valence: periodic table study

Valence is a personal study app for learning all 118 elements with flashcards. You learn the table ten elements at a time. Each section unlocks once you've mastered the one before it. Spaced repetition brings cards back right before you'd forget them, and cumulative reviews keep earlier sections fresh.

## Features

- **The full dataset**: all 118 elements with symbol, name, atomic mass, category, period, group, block, and state at room temperature.
- **Three card types**: symbol → name, name → symbol, and atomic number → element. You can switch each type on or off.
- **Sections of ten**: 12 sections in atomic-number order. A card is *mastered* after 3 successful recalls in a row. When 80% of a section's cards are mastered, the next section unlocks.
- **Spaced repetition**: an SM-2-style schedule. **Again** brings the card back 10 minutes later and resets its streak. **Hard**, **Good**, and **Easy** stretch the interval by different amounts. Each rating button shows the interval it will schedule.
- **Three session modes**:
  - **Learn**: one section. Due cards come first, then the cards with the lowest streaks (new cards included). If those run out, mastered cards are added as practice.
  - **Spaced review**: cards from your unlocked sections that are now due.
  - **Cumulative review**: draws evenly from every unlocked section, weakest cards first.
- **Missed cards come back** three cards later in the same session, up to twice.
- **Blank table**: the simplest way to study. Every square shows only its atomic number. Tap one to reveal its symbol and name, and tapping another hides the previous one. Escape or **Hide** clears it. Switch to **Number** mode to hide the table and guess from one big atomic number at a time, shuffled so every number comes up once before any repeats. You can limit it to numbers 1 through any maximum you choose, and that choice is saved.
- **Periodic table view**: color-coded by category. Locked sections are dimmed and mastered elements get a check mark. Tap an element to see its details and the status of each of its cards.
- **Progress page**: accuracy, mastery for each section, a day streak, and session history. It also has settings, JSON export and import, and a reset button.
- **Local persistence** with a versioned schema, validation, migrations, and recovery from corrupt data.

## Running locally

Requires Node 20 or later.

```bash
npm install
npm run dev          # http://127.0.0.1:4610
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server on port 4610 |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | Generate route types, then run `tsc --noEmit` (strict, plus `noUncheckedIndexedAccess`) |
| `npm run lint` | ESLint, including the architecture boundary rules |
| `npm test` | Vitest unit and integration tests |
| `npm run test:e2e` | Playwright on a desktop Chrome and a Pixel 7 profile. Run `npx playwright install chromium` once first. |
| `npm run check` | Typecheck, lint, and unit tests together |

## Architecture

Features follow **Data / Store → Hook → Service / Controller → View**:

```
app/(study)/            Routes: / (dashboard), /blank-table, /study, /periodic-table, /progress
components/             Views only: dashboard/, flashcards/, periodic-table/, progress/, ui/ (shadcn)
hooks/                  useStudySession, useStudyProgress, usePeriodicTable, useProgressData, useNow
controllers/            Thin workflows: study.controller (sessions, rating), progress.controller
                        (hydrate, import/export, settings). index.ts is the composition root.
stores/                 Zustand vanilla stores: study.store (progress, session, notices), settings.store
domain/                 Pure TypeScript. No React, Next.js, stores, or storage.
  elements/             Element types and queries
  study/                flashcard, spaced-repetition, mastery, section-unlock, cumulative-review,
                        session, stats, progress, settings services
data/                   Static element table, categories, section config, the default catalog
lib/persistence/        Zod schemas, migrations, codec (import/export), repository interface,
                        localStorage adapter
tests/                  unit/, integration/, e2e/
```

Key rules:

- **The domain is framework-free.** Services are pure functions that take a `StudyCatalog`, the progress, a clock value, and a random source as arguments. ESLint blocks `domain/` from importing React, Next.js, Zustand, stores, controllers, `lib/`, or `data/`. ESLint also blocks `stores/`, `controllers/`, `lib/`, and `data/` from importing UI code. `import/no-cycle` is enforced everywhere.
- **Controllers orchestrate.** `studyController.rateCard(rating)` records the rating and reschedules the card. It then advances the session and recalculates mastery (only on a successful recall). If the threshold is met it unlocks the next section, and it persists the result. Components call it through `useStudySession`.
- **Controllers take their dependencies as arguments.** `createStudyController(deps)` receives the catalog, repository, stores, clock, random source, and id factory. Tests build isolated instances with an in-memory storage and a fixed clock (see `tests/helpers.ts`).
- **Persistence goes through `StudyRepository`**, an async interface with methods to load and save progress and settings, plus `clear`. The localStorage adapter is the only code that touches `window.localStorage`. A database or sync backend can implement the same interface. Keys are namespaced per profile (`valence:<profile>:progress`).
- **Rendering is SSR-safe.** Stores start from a fixed initial state with no clock reads. `StudyProvider` hydrates from storage in an effect. `useNow` returns `0` on the server, because Next 16 Cache Components forbids reading the clock during prerendering. Views show skeletons until the stores are hydrated.

### Persisted data

Progress is stored as `{ schemaVersion: 2, data: ProgressRecord }`. On load, the data is:

1. parsed and validated with Zod, then
2. migrated step by step through `PROGRESS_MIGRATIONS`. Version 1 is the earlier prototype format (`reviews` plus `highestSection`).
3. normalized against the current curriculum: unknown cards are dropped, section 1 is always unlocked, and stale sessions are discarded.

If the stored data can't be read, the raw value is copied to a `…:corrupt-<timestamp>` key, the app starts fresh, and a toast explains what happened. Exports are a `valence-progress` bundle that contains the progress and settings envelopes. Import accepts a bundle or a bare progress envelope from any supported version.

Each card's review history is kept (the last 200 reviews per card), so you can recompute scheduling or statistics later.

## Extending

The seams for planned features:

- **Backend sync or multiple devices**: implement `StudyRepository` and pass it in `controllers/index.ts`.
- **Multiple profiles**: pass `profile` to `createLocalStorageRepository`.
- **New chemistry modules or decks**: add a `CardKind` with its prompt in `flashcard.service.ts`, or build another `StudyCatalog`.
- **New study modes**: add a queue builder in `domain/study` and a case in `studyController.startSession`.
