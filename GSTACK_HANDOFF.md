# gstack Handoff

Use this file when starting a fresh Codex window for this repo.

This handoff is not for implementation yet. It is for the gstack
interaction-controller and tutorial flow.

The next window should pick up where this one left off in `/office-hours`
planning, not restart the product discussion from zero.

## What This Repo Is

Repo path:

- `/Users/user2/Downloads/Codex/AltFolio`

Repo origin:

- `afadil/wealthfolio`

Current branch:

- `codex/private-assets-foundation`

This repo is a Wealthfolio fork being shaped into a local-first,
Mac-friendly asset tracker that is fluent in alternative assets.

Plain-English product thesis:

- Wealthfolio already handles the liquid side well enough
- the missing piece is a truthful model for private assets
- the user wants one believable balance-sheet view without spreadsheet
  theater
- the first magic is not PDF parsing
- the first magic is "the app actually understands how private assets work"

## User Preferences For Future Windows

These matter a lot. Treat them as active operating instructions.

- Explain everything like the user is a beginner.
- For each meaningful step, say:
  - what command or action you are taking
  - why you are taking it
  - what the result means
  - what the next step is
- Prefer fresh context windows for major gstack skill runs.
- Do not make the user juggle copy-paste unless necessary.
- If the user must do something manually, give a paste-ready prompt.
- Be honest about what the assistant can and cannot invoke directly.
- This repo is being worked on macOS. Prefer macOS-native tools and paths.
- Do not default to Linux-only package managers, shell assumptions, or PDF tooling when a Mac-compatible option is available.
- When a side window is doing bounded analysis, require it to return results in one fenced copyable block only.

## Fresh-Window Policy

Default policy:

- Start a fresh window for each major gstack skill run.

Why:

- the user wants cleaner context boundaries
- it reduces context-window pressure
- it keeps each skill run easier to reason about
- it makes handoffs and rollback simpler

Reasons to stay in the same window instead:

- an implementation task is actively in progress and context continuity
  matters more than cleanliness
- there is important live browser state, auth state, or tool state
- you are in the middle of a tight back-and-forth where reopening would slow
  things down more than it helps
- the user explicitly says to stay in the current window

Operational rule for the next window:

- Assume fresh windows are the default.
- If you want to stay in-window for the next skill, say why in one sentence.

## Important Repo Files

Read these first in a new window:

- `/Users/user2/Downloads/Codex/AltFolio/AGENTS.md`
- `/Users/user2/Downloads/Codex/AltFolio/GSTACK_HANDOFF.md`
- `/Users/user2/Downloads/Codex/AltFolio/PRIVATE_ASSETS_DESIGN.md`
- `/Users/user2/Downloads/Codex/AltFolio/ARCHITECTURE.md`
- `/Users/user2/Downloads/wealthfolio_private_assets_codex_handoff.md`

Important gstack-generated design doc:

- `/Users/user2/.gstack/projects/afadil-wealthfolio/user2-codex-private-assets-foundation-design-20260401-232331.md`

Repo-local gstack path:

- `/Users/user2/Downloads/Codex/AltFolio/.agents/skills/gstack`

## Important Environment Facts

Current date during this handoff:

- `2026-04-01` in `America/Chicago`

Telemetry status:

- explicitly set to `off`

What was verified:

- repo-local script `gstack-config` was used to set telemetry explicitly
- `~/.gstack/config.yaml` now contains `telemetry: off`
- this workflow is running on macOS, so future windows should prefer Mac-compatible tooling first

Why that mattered:

- before, telemetry was effectively off but stored as `unset`
- explicitly setting `off` removed ambiguity for future skill runs

## What Has Already Happened

### Repo and setup work

1. Wealthfolio was cloned into this repo.
2. `bun` was installed.
3. repo-local `gstack` was copied into `.agents/skills/gstack`.
4. `./setup --host codex` was run for the repo-local gstack install.
5. Branch `codex/private-assets-foundation` was created.
6. Repo-level docs were written:
   - `AGENTS.md`
   - `ARCHITECTURE.md`
   - `PRIVATE_ASSETS_DESIGN.md`

### Earlier implementation exploration

There was some earlier codebase exploration around private-assets foundations.
That is not the current focus.

Do not resume coding first.

The current focus is the gstack planning flow and user tutorial flow.

### gstack `/office-hours` work already completed

The office-hours conversation has already done the hard framing work.

The main findings were:

- the real pain is spreadsheet-driven balance-sheet consolidation
- private asset data is reported quarterly while liquid assets are fresher
- the user currently fakes freshness by dragging spreadsheet cells across
  periods
- cap call liability forecasting is not the main v1 pain
- the right first product is not PDF parsing
- the right first product is a local app that understands private assets
  cleanly and rolls them into the rest of Wealthfolio

### Landscape / category framing already done

The market framing already landed on this:

- too real for Excel
- too small for Addepar-class systems
- not enough staff to feed enterprise software
- still complex enough that spreadsheet theater breaks down

Short version:

- this is the "big SMB" gap for private-assets tracking

### Second-opinion pass already done

A second independent agent review was already done.

The most useful extra insight from that pass:

- "staleness-aware truth"

Meaning:

- the system should not pretend all asset values are equally fresh
- it should distinguish current, stale, estimated, and missing data

## Decisions Already Made

These are not open anymore unless the user explicitly reopens them.

### Product direction

- Build for a community the user is part of.
- Desktop-first and local-first.
- Wealthfolio is the base.
- Alternative assets must be first-class objects.
- The private-assets layer is the source of truth.
- Do not fake the workflow with `BUY` / `SELL` / `DIVIDEND` semantics.

### Sequencing

- Start with the private-assets foundation.
- Do not start with PDF parsing.
- Do not start with Juniper Square ingestion.
- Do not start with benchmarking or alerts.

### Recommended architecture direction

Chosen office-hours approach:

- `Approach B: Parallel Private Ledger`

Meaning:

- a dedicated private-assets subsystem beside existing Wealthfolio paths
- later projection into consolidated Wealthfolio views
- no UI-only overlay hack as the source of truth

## Current Design-Doc Status

Current design doc:

- `/Users/user2/.gstack/projects/afadil-wealthfolio/user2-codex-private-assets-foundation-design-20260401-232331.md`

Status:

- `DRAFT`

Quality state from adversarial review loop:

- survived 3 review rounds
- roughly `8/10`
- strong enough to continue planning
- now narrowed enough that remaining work is doc alignment and implementation
  planning, not reopening the product wedge

Important high-level design shape now in the doc:

- V1 is `snapshot-first`
- not full event-ledger-first
- `FundManager` is first-class
- `PrivateAsset` is the owned vehicle and `PrivateAsset.name` is the real
  vehicle name
- direct investments are explicit and allow `fund_manager_id = null`
- optional one-level `PrivateSubAsset` detail is in v1 but non-additive
- commitment is a current top-level fact on `PrivateAsset`, not a separate v1
  table
- freshness is derived at read time
- 90-day threshold is the simple v1 rule
- private assets project into Wealthfolio aggregates
- historical net worth uses carry-forward reported marks
- private assets do not create fake public-market activities
- multi-currency is out of the first slice
- archive is preferred over hard delete
- one parent-child layer max in v1

## Exact Resume Point

This handoff predates the final lock on the office-hours design.

Those earlier open questions have since been resolved:

1. One-level optional sub-assets are in v1.
2. Archived assets are hidden by default in active views.
3. Preset `vehicle_kind` values stay `FUND / CO_INVESTMENT / DIRECT /
   REAL_ESTATE / OTHER`.

Do not reopen those questions unless the user explicitly wants to revisit them.
Resume from aligned docs and continue into implementation planning.

## What The New Window Should Do First

In plain English:

1. Read the handoff and the design doc.
2. Briefly restate the locked v1 contract.
3. Do not restart product discovery from zero.
4. Use the aligned docs as source of truth for implementation planning.
5. Then recommend the next gstack step:
   - likely narrow implementation planning or build work
   - only revisit `/plan-ceo-review` or `/plan-eng-review` if the user wants a
     fresh review pass

## How To Behave As A gstack Interaction Controller

The user wants help not just with the product, but with using gstack cleanly.

So the next window should act like a controller and tutorial guide.

That means:

- tell the user which skill is next
- explain why that skill is next
- say whether a fresh window is recommended
- if yes, provide a ready-to-paste prompt
- if no, explain why continuity matters here
- be explicit when the user needs to type a slash command versus when the
  assistant can continue normally

Important truthfulness rule:

- Do not claim you can invoke slash skills programmatically unless the host
  clearly supports it in that session.
- If the user needs to trigger the skill, say that plainly.

## gstack Workflow For This Repo

For major feature work, the intended order is:

1. `/office-hours`
2. `/plan-ceo-review`
3. `/plan-eng-review`
4. build
5. `/review`
6. `/qa`
7. `/ship`

Current state in that sequence:

- `/office-hours` has effectively been completed
- the office-hours design doc and repo planning docs are aligned to the locked
  v1 contract
- next meaningful step is narrow implementation planning against that contract

## Scope Boundaries To Keep Repeating

These are the rails. Repeat them when needed.

In scope for the first slice:

- manual private-asset entry
- truthful alt-asset data shape
- commitment amount capture
- contributed / distributed / current value capture
- as-of date capture
- freshness display
- rollup into the existing consolidated Wealthfolio view

Not in scope for the first slice:

- PDF parsing
- Juniper Square ingestion
- bank or brokerage APIs
- benchmarking
- outlier alerts
- print-ready reporting
- full event ledger
- tax engine
- waterfalls
- full family office ERP behavior

## Why Snapshot-First Landed

The design currently says `snapshot-first` for v1.

Plain-English reason:

- the user's first pain is believable consolidated visibility
- that can be solved with correct current-state records faster than with a full
  capital-event engine
- a full event ledger can come later if the first slice proves insufficient

Do not casually widen scope back into event-ledger-first unless the user
explicitly wants to revisit that decision.

## Known Open Product Questions

There are no product-shape blockers carried over from the earlier
office-hours pass.

Everything listed above should be treated as decided enough to keep moving
unless the user explicitly reopens it.

## Existing User Language Worth Preserving

These phrases capture the user's real mental model and should be preserved:

- "community (of which i am one)"
- "too big for excel and quickbooks, too small for ERP"
- "wealthfolio but lets me add alternative assets cleanly"
- "the capital statements for alts are quarterly"
- "i just have to drag the cells over"
- "pretend like it is fresh data"

These are valuable because they describe the actual pain better than abstract
product language.

## Anti-Patterns For The Next Window

Do not do these:

- do not restart implementation planning from schema-first without resolving the
  current office-hours questions
- do not claim `/office-hours` needs to be redone from scratch
- do not jump into code
- do not start with PDF parsing
- do not broaden into a family office operating system
- do not add lots of new open questions when only 3 are left
- do not bury the user in process jargon without explaining it

## Suggested Next-Skill Order After The Revision

If the 3 open questions are answered quickly, the likely flow is:

1. tighten and save the office-hours design doc
2. start a fresh window for `/plan-ceo-review`
3. after that, start another fresh window for `/plan-eng-review`

Why separate windows likely help:

- each review has a different job
- separate windows keep the context clean
- the user explicitly prefers fresh windows when possible

## Paste-Ready Prompt For A Fresh Window

Paste this into the next fresh Codex window:

```text
We are resuming gstack planning work for:
/Users/user2/Downloads/Codex/AltFolio

Read these first:
- /Users/user2/Downloads/Codex/AltFolio/AGENTS.md
- /Users/user2/Downloads/Codex/AltFolio/GSTACK_HANDOFF.md
- /Users/user2/Downloads/Codex/AltFolio/PRIVATE_ASSETS_DESIGN.md
- /Users/user2/Downloads/Codex/AltFolio/ARCHITECTURE.md
- /Users/user2/Downloads/wealthfolio_private_assets_codex_handoff.md
- /Users/user2/.gstack/projects/afadil-wealthfolio/user2-codex-private-assets-foundation-design-20260401-232331.md

Important context:
- repo: /Users/user2/Downloads/Codex/AltFolio
- branch: codex/private-assets-foundation
- telemetry is explicitly off
- /office-hours work is already done
- do not restart from scratch
- do not jump to coding yet

Your role in this window:
- act as a gstack interaction controller and tutorial guide
- treat me like a beginner
- explain each step in plain English
- say what command or action you are taking, why, what the result means, and
  what the next step is
- prefer a fresh window for each major skill run unless you have a clear reason
  not to

Exact resume point:
The previous window ended at "revise once more" on the office-hours design doc.
Resume there.

The only open product questions to resolve right now are:
1. Sub-assets in v1, yes or no?
2. Archived assets hidden by default, yes or no?
3. Keep preset types as FUND / CO_INVESTMENT / DIRECT / REAL_ESTATE / OTHER,
   yes or no?

What to do first:
1. Read the handoff and design doc.
2. Briefly restate where we are.
3. Ask me only for those 3 decisions if I have not already answered them.
4. Tighten the design doc after I answer.
5. Then recommend the next skill, which will likely be /plan-ceo-review in a
   fresh window.

Important guardrails:
- keep the wedge narrow
- private assets are first-class objects
- private-assets layer is the source of truth
- do not fake the workflow with BUY/SELL/DIVIDEND semantics
- do not start with PDF parsing
- snapshot-first is the current v1 design unless we explicitly revisit it
```

## Optional Prompt For The Window After That

Use this only after the 3 open questions are resolved and the office-hours doc
is tightened.

```text
We are starting the next gstack review step for:
/Users/user2/Downloads/Codex/AltFolio

Read:
- /Users/user2/Downloads/Codex/AltFolio/AGENTS.md
- /Users/user2/Downloads/Codex/AltFolio/GSTACK_HANDOFF.md
- /Users/user2/.gstack/projects/afadil-wealthfolio/user2-codex-private-assets-foundation-design-20260401-232331.md

Treat me like a beginner.
Act as a gstack interaction controller and tutorial guide.
Explain each step, why it matters, and what the outcome means.

We have completed office-hours and tightened the design doc.
The next task is to run /plan-ceo-review, preferably in HOLD SCOPE mode unless
there is a strong reason to do otherwise.

Keep these constraints:
- local-first
- Wealthfolio fork
- alt-assets-native
- private-assets layer is source of truth
- no PDF parsing first
- no fake BUY/SELL/DIVIDEND modeling
- keep the wedge narrow
```

## One-Line Summary

The next window should act like a calm gstack guide, resume at the 3 open
office-hours decisions, tighten the existing design doc, and then move us into
the next skill in a fresh window.
