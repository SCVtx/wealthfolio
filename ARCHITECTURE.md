# Architecture

## Current Repo Shape

Wealthfolio is already split across frontend, transport, domain, and storage
layers.

- Frontend app: `apps/frontend/`
- Web server: `apps/server/`
- Shared domain logic: `crates/core/`
- SQLite storage and migrations: `crates/storage-sqlite/`
- Desktop shell and commands: `apps/tauri/`
- Shared packages and addon tooling: `packages/`

That separation is the whole opportunity. We can add a first-class
private-assets subsystem without lying through UI-only overlays.

## Runtime Flow

Standard path:

`frontend page -> command or adapter layer -> Tauri command or Axum API -> crates/core -> crates/storage-sqlite`

Private-assets work should preserve that seam.

## V1 Private-Assets Shape

V1 is snapshot-first and projection-first.

```
manual entry
   |
   v
FundManager / PrivateAsset / PrivateSubAsset / PrivateSnapshot
   |
   v
private-assets service layer
   |
   v
projection outputs
   |
   +--> current balance-sheet + net-worth
   |
   +--> historical net-worth carry-forward series
```

Important rule:

- private-assets data is the source of truth
- existing Wealthfolio public-asset semantics stay untouched
- projections feed existing views without pretending private assets are public
  holdings

## Storage

Add private-assets tables and migrations in `crates/storage-sqlite/`.

Expected v1 tables:

- `fund_managers`
- `private_assets`
- `private_sub_assets`
- `private_snapshots`

Explicitly not v1 tables:

- `commitments`
- `private_capital_events`
- `source_documents`
- parser or ingestion tables

Commitment is a current field on `private_assets`, not its own table.

## Domain

Add first-class private-assets models and services in `crates/core/`.

Expected service boundaries:

- fund-manager service
- private-asset service
- private-sub-asset service
- private-snapshot service
- projection service for current totals, freshness, and historical carry-forward

Explicitly defer:

- event-posting service
- document service
- parser service
- private performance service for IRR/XIRR style metrics

## API

Expose thin web handlers in `apps/server/src/api/` and thin Tauri commands in
`apps/tauri/src/commands/`.

Both should delegate to `crates/core` services for:

- manager create/select
- asset CRUD
- snapshot create/list/latest
- optional sub-asset CRUD
- projection reads for current and historical views

## Frontend

Add minimal private-assets UI through the existing React route structure.

Initial pages:

- private assets list
- private asset detail
- minimal create/edit flow with explicit direct toggle
- narrow mark-history surface

Not v1 pages:

- private documents page
- parser workbench
- import and review queue

## Compatibility Rule

Private assets are a parallel first-class ledger.

Do not overload `BUY`, `SELL`, `DIVIDEND`, or other public-market activities to
represent private lifecycle events. Optional cash-impact projections can come
later, but they are not the source of truth in v1.

## Historical Rule

Historical net worth includes private assets in v1.

Carry-forward rule:

- each reported private snapshot is treated as true from its `as_of_date`
  until a newer reported snapshot replaces it

V1 does not:

- infer intra-quarter changes
- interpolate missing marks
- compute synthetic private performance between reported snapshots

## Testing Priorities

The first slice should be test-heavy around state truth, not performance math.

Core required coverage:

- direct-investment path with nullable `fund_manager_id`
- `vehicle_kind` and `strategy_type` validation
- archived assets hidden by default
- `PrivateSubAsset` staying non-additive in consolidated totals
- freshness derivation for `CURRENT`, `STALE`, `ESTIMATED`, `MISSING`
- latest-snapshot rollups
- historical carry-forward net-worth projection
- narrow asset-level mark history ordering

Explicitly defer:

- IRR or XIRR tests
- event-ledger math
- document import and duplicate detection

## Current Delivery Strategy

The first useful product slice is:

1. schema
2. services
3. manual-entry UI
4. projection outputs for current totals and historical net worth
5. narrow asset history view

This keeps the wedge aligned with the real pain: believable consolidated private
asset visibility on macOS, before any parser or document workflow exists.
