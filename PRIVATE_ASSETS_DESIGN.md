# Private Assets Design

## Summary

This fork adds a local-first private-assets foundation to Wealthfolio.

The wedge stays narrow on purpose:

- private assets are first-class objects
- the private-assets layer is the source of truth
- v1 is snapshot-first
- projection into existing Wealthfolio views is required
- PDF parsing, event-ledger workflows, and performance analytics come later

This is not a family-office ERP. It is not partnership accounting. It is not a
parser-first project.

## Operating Guardrails

- Prefer macOS-native tooling and paths while planning and implementing.
- Do not assume Linux-only package managers, shell behavior, or PDF tools when a
  Mac-compatible path exists.
- Do not fake private assets with `BUY`, `SELL`, or `DIVIDEND` semantics.
- Do not restart from scratch. Extend Wealthfolio through the existing
  core/storage/API/frontend seams.
- Do not start with PDF parsing before the private ledger exists.

## Locked V1 Contract

- `FundManager` is first-class and has no `type` field.
- Direct investments are allowed through an explicit UI toggle or checkbox.
- `fund_manager_id` is nullable for direct investments.
- `PrivateAsset` is the actual owned vehicle.
- `PrivateAsset.name` is the actual vehicle name.
- There is no separate `fund_name` field in v1.
- Use `vehicle_kind`, not `asset_type`.
- V1 `vehicle_kind` values stay `FUND`, `CO_INVESTMENT`, `DIRECT`,
  `REAL_ESTATE`, `OTHER`.
- `PrivateAsset` requires `strategy_type`.
- V1 `strategy_type` values stay `VENTURE`, `PRIVATE_EQUITY`, `HEDGE_FUND`,
  `PRIVATE_CREDIT`, `FUND_OF_FUNDS`, `ENERGY`, `REAL_ESTATE`, `OTHER`.
- `PrivateSubAsset` is optional one-level look-through detail only.
- `PrivateSubAsset` can carry statement math.
- `PrivateSubAsset.strategy_type` is optional.
- `PrivateSubAsset.reporting_basis` is required with `UNKNOWN`, `GROSS`, `NET`.
- `PrivateSubAsset` never rolls into consolidated totals in v1.
- Commitment is one optional current top-level fact on `PrivateAsset`.
- Commitment is edited in place.
- There is no separate `Commitment` table in v1.
- There is no `PrivateSubAsset` commitment in v1.
- Archived assets are hidden by default in active views.
- IRR and XIRR are out for v1.
- Historical net-worth series is in v1 using carry-forward reported marks.
- V1 does not infer intra-quarter changes, interpolate missing marks, or compute
  synthetic private performance between snapshots.
- Asset-level history is narrow in v1: old marks plus current mark,
  chronological list, optional simple step chart.

## V1 Scope

In scope:

- Manual private-asset entry
- First-class `FundManager` create/select flow
- Explicit direct-investment toggle
- `PrivateAsset` create and edit flow
- Optional current commitment on `PrivateAsset`
- Latest contributed, distributed, and current value capture
- `as_of_date` capture
- Freshness display derived from snapshots
- Optional one-level `PrivateSubAsset` detail added after setup
- Projection into current balance-sheet and current net-worth surfaces
- Projection into historical net-worth series with carry-forward marks
- Asset-level mark history view

Out of scope:

- PDF parsing
- Source-document registry
- Parser workbench or review queue
- Juniper Square integration
- Bank or brokerage APIs
- Benchmarking
- Alerts
- Full event ledger
- Separate commitment history or schedules
- Sub-asset commitment math
- IRR, XIRR, TVPI, DPI, RVPI
- Multi-currency private-assets support

## Data Model

### `FundManager`

Required fields:

- `id`
- `name`
- `notes` nullable
- `created_at`
- `updated_at`

Rules:

- First-class object
- No `type` field in v1

### `PrivateAsset`

Required fields:

- `id`
- `name`
- `fund_manager_id` nullable
- `vehicle_kind`
- `strategy_type`
- `currency`
- `status`
- `created_at`
- `updated_at`

Optional fields:

- `commitment_amount`
- `notes`

Rules:

- `name` is the owned vehicle name
- `fund_manager_id = null` is valid for direct investments
- `status` is narrow in v1: `ACTIVE`, `REALIZED`, `ARCHIVED`
- No separate `fund_name`
- No separate commitment history object

### `PrivateSubAsset`

Required fields:

- `id`
- `private_asset_id`
- `name`
- `reporting_basis`
- `created_at`
- `updated_at`

Optional fields:

- `strategy_type`
- `cost_basis`
- `current_value`
- `ownership_percent`
- `notes`

Rules:

- One level only
- Informational look-through detail only
- Can store statement math
- Does not aggregate into consolidated totals in v1

### `PrivateSnapshot`

This is the v1 rollup source.

Required fields:

- `id`
- `private_asset_id`
- `contributed_amount`
- `distributed_amount`
- `current_value`
- `as_of_date`
- `value_source_type`
- `created_at`

Optional fields:

- `notes`

Rules:

- Store reported facts, not inferred movements
- Append snapshots over time to preserve mark history
- Corrections can be handled by writing a replacement or newer snapshot in v1
- `value_source_type` stays narrow: `MANUAL`, `STATEMENT`, `ESTIMATED`

## Initial Setup Flow

1. Create or select a `FundManager`, or mark the asset as direct.
2. Create the `PrivateAsset` with real vehicle name, `vehicle_kind`,
   required `strategy_type`, and optional current commitment.
3. Add the latest snapshot with contributed, distributed, current value, and
   `as_of_date`.
4. Add `PrivateSubAsset` rows later from detail UI if look-through detail is
   useful.

This keeps setup truthful without dragging the user into statement decomposition
before the owned vehicle exists.

## Freshness Rules

Freshness is derived at read time from the latest snapshot.

Displayed states:

- `CURRENT`
- `STALE`
- `ESTIMATED`
- `MISSING`

V1 derivation:

- `ESTIMATED` when `value_source_type = ESTIMATED`
- `MISSING` when `current_value` or `as_of_date` is absent
- `STALE` when the latest reported snapshot is more than 90 days old
- `CURRENT` otherwise

## Projection-First Integration

Private assets stay separate from Wealthfolio's public-market lot and quote
paths.

```
PrivateSnapshot + PrivateAsset + FundManager
                   |
                   v
          private-assets projection layer
                   |
        +----------+----------+
        |                     |
        v                     v
 current balance-sheet   historical net worth
    and net worth          carry-forward marks
```

Rules:

- Do not create fake public-market activities as the main source of truth.
- Projection should expose per-asset rows plus aggregate totals.
- `PrivateSubAsset` detail stays informational and non-additive.
- `ARCHIVED` assets are hidden by default in active views.
- `MISSING` values are excluded from current-value aggregates with explicit UI
  explanation.

Projection outputs should include:

- `total_private_asset_value`
- `total_private_contributed`
- `total_private_distributed`
- `latest_private_as_of_date`
- per-asset `freshness_state`
- per-asset `status`

## Historical Net-Worth Rule

Historical private-asset values use carry-forward reported marks.

Rule:

- each reported private snapshot is treated as true from its `as_of_date`
  until a newer reported snapshot replaces it

Not allowed in v1:

- inferred daily movement
- interpolated missing marks
- synthetic private performance curves
- sub-asset historical aggregation into consolidated totals

## Repo Insertion Points

- Core domain models and services: `crates/core/`
- SQLite schema and repositories: `crates/storage-sqlite/`
- Tauri command wiring: `apps/tauri/src/commands/`
- Axum handlers: `apps/server/src/api/`
- Frontend routes and pages: `apps/frontend/src/routes.tsx`,
  `apps/frontend/src/pages/`
- Frontend command/adapters: `apps/frontend/src/commands/`,
  `apps/frontend/src/adapters/`

## First Implementation Slice

1. Add schema for `fund_managers`, `private_assets`, `private_sub_assets`, and
   `private_snapshots`.
2. Add core services for CRUD, latest-snapshot retrieval, freshness derivation,
   and projection outputs.
3. Add minimal manual-entry UI for manager selection, asset creation, direct
   toggle, latest snapshot entry, and archive filter behavior.
4. Add history read paths for chronological marks and carry-forward
   net-worth projection.

Do not start with PDF ingestion, parser scaffolding, or event posting.

## Definition Of Done For V1 Foundation

The first slice is done when a user can:

1. create a private asset with a first-class manager or direct toggle
2. store an optional current commitment on the asset
3. add and update reported snapshots with `as_of_date`
4. see whether each asset is current, stale, estimated, or missing
5. add optional one-level `PrivateSubAsset` look-through detail later
6. see private assets included in current balance-sheet and net-worth totals
7. see historical net-worth reflect carry-forward reported marks
8. review prior marks for an asset without implied daily performance math

## Later, Not Now

- PDF upload and statement mapping
- document provenance tables
- deterministic parsers and review queues
- full event ledger for capital calls and distributions
- IRR, XIRR, TVPI, DPI, RVPI
- commitment history and schedules
- sub-asset commitment modeling
- multi-currency private-assets handling
