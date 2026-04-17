# Private Assets Thread Handoff

Use this file to resume work in a fresh Codex thread if context compacts.

## Repo

- Repo: `/Users/user2/Downloads/Codex/AltFolio`
- Branch: `codex/private-assets-foundation`
- Platform: macOS
- Telemetry: off

## Read First

- `/Users/user2/Downloads/Codex/AltFolio/AGENTS.md`
- `/Users/user2/Downloads/Codex/AltFolio/GSTACK_HANDOFF.md`
- `/Users/user2/Downloads/Codex/AltFolio/PRIVATE_ASSETS_DESIGN.md`
- `/Users/user2/Downloads/Codex/AltFolio/ARCHITECTURE.md`
- `/Users/user2/.gstack/projects/afadil-wealthfolio/user2-codex-private-assets-foundation-design-20260401-232331.md`
- `/Users/user2/Downloads/Codex/AltFolio/THREAD_HANDOFF_2026-04-14_PRIVATE_ASSETS.md`

## Locked Product Decisions

- Private assets are first-class objects.
- The private-assets layer is the source of truth.
- Snapshot-first is the v1 model.
- Historical net-worth series is in v1 using last-known-mark carry-forward.
- Do not fake private assets with `BUY` / `SELL` / `DIVIDEND` semantics.
- Do not start with PDF parsing, document ingestion, or parser work.
- `IRR/XIRR` is out for v1.
- `FundManager` is first-class and has no type field.
- Direct investments are allowed.
- `fund_manager_id` is nullable for direct investments.
- `vehicle_kind` is used instead of `asset_type`.
- `strategy_type` is required on `PrivateAsset`.
- `PrivateSubAsset` is optional, one-level only, and non-additive.
- Commitment is one optional current top-level fact on `PrivateAsset`.
- Archived assets are hidden by default.

## What Shipped In This Slice

### Private-assets foundation

- Core private-assets model, traits, services, and projection service exist.
- SQLite schema and repositories exist for:
  - `fund_managers`
  - `private_assets`
  - `private_snapshots`
  - `private_sub_assets`
- Web and Tauri transport seams exist.
- Frontend private-assets list/detail/create/edit flows exist.
- Snapshot create works.
- Snapshot edit/correction works in place.
- Sub-assets remain informational and non-additive.

### Main wealth views

- Private assets are now projected into main current net-worth / balance-sheet surfaces.
- Private assets are now projected into main historical net-worth surfaces using carry-forward marks.
- Dashboard/net-worth API responses include explicit private-assets contribution.

### Hardening completed

- DB-level invariant added:
  - `DIRECT` requires `fund_manager_id IS NULL`
  - non-`DIRECT` requires `fund_manager_id IS NOT NULL`
- Silent storage coercion was removed:
  - malformed enums, timestamps, decimals, reporting bases, and snapshot source values now fail loudly instead of defaulting

## Verified Behavior

### Web path

Web QA/manual verification passed.

Verified:

- create direct asset
- create manager-backed asset
- create snapshot
- edit/correct snapshot
- create/edit sub-asset
- archived hidden by default
- private-assets list/detail/totals/history
- main net-worth current surface
- main net-worth historical surface

Known dogfood fixture in `web-dev.db`:

- asset: `Dogfood Direct Asset 1776139993239`
- corrected latest snapshot:
  - contributed `120,000`
  - distributed `30,000`
  - current value `95,000`
  - as-of `2026-04-10`
  - note `corrected fat-finger`
- earlier snapshot:
  - contributed `100,000`
  - distributed `25,000`
  - current value `90,000`
  - as-of `2026-03-31`

### Tauri path

Tauri build/launch smoke passed.

Verified:

- `pnpm tauri dev` builds and launches
- visible native `Wealthfolio` window appears
- desktop runtime initializes cleanly

Not fully automated:

- the desktop app is interrupted by the `New Update Available` modal
- that modal is hard to drive through macOS accessibility because of webview exposure limits
- native interactive private-assets smoke was not fully completed by automation

## Current Known Non-Blocking Issue

- `New Update Available` modal is intrusive during dogfood and manual verification.

## Post-Sync State

- Branch was fast-forwarded onto latest `origin/main`.
- Private-assets work was reapplied on top after the sync.
- One overlap conflict in
  `crates/core/src/portfolio/net_worth/net_worth_service_tests.rs` was
  resolved by keeping both:
  - upstream `NegativeBalanceInfo` trait shape
  - private-assets net-worth test coverage
- Post-sync validation passed:
  - `pnpm --filter frontend type-check`
  - `cargo test -p wealthfolio-core net_worth --lib`
- Quick web smoke after backend startup passed for:
  - private-assets settings list
  - private-asset detail
  - dashboard net-worth tab showing private-assets value

## Important Immediate Next Item After This Slice

Put this on the board as the first follow-up after the private-assets foundation slice:

### Private assets should roll up as peer categories in dashboard Investments

User intent:

- private assets should not feel second-class
- they should appear in the same first-class rollup surface as the main web app
- the reference mental model is the dashboard Investments screen with peer rows
  like `Taxable`, `Retirement`, and other top-level buckets
- private categories like `Venture`, `Private Equity`, and `FoF` should be able
  to sit as peers in that rollup instead of living only in settings

Important nuance:

- do **not** fake them into public-market holdings semantics
- do **not** pretend they are normal tradable positions
- this is **not** just "add private rows to `/holdings`"
- the likely target seam is the dashboard Investments rollup surface, especially
  `apps/frontend/src/pages/dashboard/dashboard-content.tsx` and
  `apps/frontend/src/pages/dashboard/accounts-summary.tsx`
- the design should let public account buckets like `Taxable` and `Retirement`
  coexist with private buckets like `Venture`, `Private Equity`, and `FoF`
  without pretending they are the same underlying object type

Current status:

- this is **not** part of the completed foundation slice
- current code intentionally covers:
  - private-assets settings surfaces
  - net-worth / balance-sheet current totals
  - net-worth history
- current dashboard Investments surface still uses account-summary logic and does
  not yet roll private assets into peer buckets
- current `/holdings` surface still uses the regular holdings pipeline and does
  not include private assets

This should be treated as an immediate next fix after the current slice is wrapped.

## Recommended Next Step

Because context is getting lighter in the current window, prefer a fresh thread
with this handoff rather than continuing to compact repeatedly.

Live-statement dogfood notes from 2026-04-15 sample docs:

- sampled Ranger / Satori PE and venture statements showed `Inception to Date`
  or `ITD` columns on the same page as `MTD` and/or `YTD` columns
- none of the sampled statements were period-only-only on the first page
- for manual entry, `TOTAL_TO_DATE` is the safer default for new statements
  because real statements commonly surface ITD alongside period activity
- the remaining open dogfood question is not whether period-only exists as a
  concept, but whether we need stronger import-time heuristics later for
  statements that expose multiple bases side by side

Immediate next slice:

1. dogfood the new statement cash-flow semantics against live PE / venture statements
2. confirm which statements are `TOTAL_TO_DATE` vs `PERIOD_ONLY` in real user docs
3. tighten any wording/defaults that feel confusing after real usage

Next major step after that:

- stabilize and ship the private-assets foundation as a truthful manual-entry product
- do this in fresh manual windows:
  - `/review`
  - `/qa`
  - `/ship`
- do not reopen PDF/parser/IRR/event-ledger scope before that confidence pass is done

Only after live-statement dogfood and ship-confidence work should the branch reopen
the next major product phase:

- document-backed ingestion readiness grounded in real statements, not speculative parser work

## Notes For A Fresh Thread

- Treat the current private-assets foundation slice as functionally complete on the web path.
- Do not reopen PDF/parser/IRR/event-ledger scope.
- Do not restart planning from zero.
- Be explicit about what is already done vs what is the next slice.

## Open TODOs

- Private-assets detail/modal language cleanup:
  use user-facing `statement` wording where appropriate, avoid internal `snapshot`
  wording on polished screens, and keep modal/button language consistent.
- Private-assets detail page polish:
  latest statement card action should stay minimal (`Edit` is enough in-context),
  and direct assets should not show irrelevant manager/sub-asset surfaces.
- Statement math semantics:
  do not assume statement contribution/distribution fields are cumulative totals.
  We need explicit support for cumulative vs per-period statement values before
  relying on those fields for totals/history math.
- Live-statement dogfood:
  collect and test real PE / venture statements that show per-period vs total
  fields so the statement model, defaults, labels, and later import behavior
  are grounded in what users actually see.
- Live-statement sample finding:
  current sampled statements commonly show both period columns and ITD /
  inception-to-date columns on the same statement. Keep `PERIOD_ONLY` support,
  but bias manual-entry defaults and wording toward `TOTAL_TO_DATE`.
- Hedge-fund wording parking lot:
  later, if the asset strategy is `HEDGE_FUND`, consider adapting statement
  field labels from `Contributed` / `Distributed` to user-facing
  `Subscriptions` / `Redemptions` while keeping the core model unchanged.
- Ship-confidence pass:
  after live-statement dogfood, run fresh manual `/review`, `/qa`, and `/ship`
  windows instead of adding more product surface area first.
- Upstream dev-doc checklist:
  before proposing anything to the upstream maintainer, find the project's
  developer documentation for formatting and linting, then run those exact
  documented steps and capture any repo-specific cleanup they require.
