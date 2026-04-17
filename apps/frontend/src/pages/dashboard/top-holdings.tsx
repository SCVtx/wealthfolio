import { listPrivateAssetRows } from "@/adapters";
import { TickerAvatar } from "@/components/ticker-avatar";
import { useBalancePrivacy } from "@/hooks/use-balance-privacy";
import { Card, CardContent, CardHeader, CardTitle } from "@wealthfolio/ui/components/ui/card";
import { Skeleton } from "@wealthfolio/ui/components/ui/skeleton";
import { HoldingType, isAlternativeAssetKind, type AssetKind } from "@/lib/constants";
import { QueryKeys } from "@/lib/query-keys";
import { parseOccSymbol } from "@/lib/occ-symbol";
import { Holding, type PrivateAssetFreshnessState, type PrivateAssetListRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  AmountDisplay,
  Button,
  GainAmount,
  GainPercent,
  Icons,
  usePersistentState,
} from "@wealthfolio/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@wealthfolio/ui/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatPrivateAssetStrategy } from "../settings/private-assets/private-assets-utils";

const MAX_DISPLAYED_HOLDINGS = 5;
const MAX_STACKED_AVATARS = 5;
const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface TopHoldingsProps {
  holdings: Holding[];
  isLoading: boolean;
  baseCurrency: string;
}

interface PublicHoldingRowProps {
  holding: Holding;
  baseCurrency: string;
  isHidden?: boolean;
  showTotalReturn: boolean;
  onClick?: () => void;
}

interface PrivateAssetRowProps {
  row: PrivateAssetListRow;
  baseCurrency: string;
  isHidden?: boolean;
  onClick?: () => void;
}

interface PublicInvestmentItem {
  kind: "public";
  id: string;
  sortValue: number;
  sortGain: number;
  holding: Holding;
}

interface PrivateInvestmentItem {
  kind: "private";
  id: string;
  sortValue: number;
  row: PrivateAssetListRow;
}

type TopInvestmentItem = PublicInvestmentItem | PrivateInvestmentItem;

interface StackedAvatarsProps {
  investments: TopInvestmentItem[];
  totalRemaining: number;
  onClick?: () => void;
}

function formatAsOfDate(value?: string | null) {
  if (!value) {
    return "No reported mark";
  }

  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : SHORT_DATE_FORMATTER.format(parsed);
}

function formatFreshnessLabel(state: PrivateAssetFreshnessState) {
  switch (state) {
    case "CURRENT":
      return "Current";
    case "STALE":
      return "Stale";
    case "ESTIMATED":
      return "Estimated";
    case "MISSING":
      return "Missing";
  }
}

function getInvestmentAvatarSymbol(item: TopInvestmentItem) {
  if (item.kind === "public") {
    const symbol = item.holding.instrument?.symbol ?? item.holding.id;
    const parsed = parseOccSymbol(symbol);
    return parsed ? parsed.underlying : symbol;
  }

  return item.row.name;
}

function PublicHoldingRow({
  holding,
  baseCurrency,
  isHidden,
  showTotalReturn,
  onClick,
}: PublicHoldingRowProps) {
  const symbol = holding.instrument?.symbol ?? holding.id;
  const parsedOption = parseOccSymbol(symbol);
  const displayName = parsedOption ? parsedOption.underlying : symbol.split(".")[0];
  const subtitle = parsedOption
    ? `${new Date(parsedOption.expiration + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} $${parsedOption.strikePrice} ${parsedOption.optionType}`
    : `${(holding.quantity ?? 0).toLocaleString(undefined, { maximumFractionDigits: 3 })} shares`;
  const avatarSymbol = parsedOption ? parsedOption.underlying : symbol;
  const marketValue = holding.marketValue?.base ?? 0;
  const gainAmount = showTotalReturn
    ? (holding.unrealizedGain?.base ?? 0)
    : (holding.dayChange?.base ?? 0);
  const gainPercent = showTotalReturn
    ? (holding.unrealizedGainPct ?? 0)
    : (holding.dayChangePct ?? 0);

  return (
    <div
      className="border-border hover:bg-muted/30 group flex cursor-pointer items-center justify-between border-b py-3 transition-colors last:border-0"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      <div className="flex items-center gap-3">
        <TickerAvatar symbol={avatarSymbol} className="size-9" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{displayName}</span>
          <span className="text-muted-foreground text-xs">{subtitle}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <AmountDisplay
          value={marketValue}
          currency={baseCurrency}
          isHidden={isHidden}
          className="text-sm font-semibold"
        />
        <div className="flex items-center gap-2">
          <GainAmount
            value={gainAmount}
            currency={baseCurrency}
            displayCurrency={false}
            className="text-xs"
          />
          <GainPercent
            value={gainPercent}
            variant="badge"
            className="min-w-[60px] justify-center text-xs"
          />
        </div>
      </div>
    </div>
  );
}

function PrivateAssetRow({ row, baseCurrency, isHidden, onClick }: PrivateAssetRowProps) {
  const strategyLabel = formatPrivateAssetStrategy(row.strategyType);
  const relationshipLabel = row.fundManagerName ?? "Direct investment";
  const currentValue = row.latestSnapshot?.currentValue ?? 0;
  const freshnessLabel = formatFreshnessLabel(row.freshnessState);
  const asOfLabel = formatAsOfDate(row.latestSnapshot?.asOfDate);

  return (
    <div
      className="border-border hover:bg-muted/30 group flex cursor-pointer items-center justify-between border-b py-3 transition-colors last:border-0"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      <div className="flex items-center gap-3">
        <TickerAvatar symbol={row.name} className="size-9" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{row.name}</span>
          <span className="text-muted-foreground text-xs">{`${strategyLabel} • ${relationshipLabel}`}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <AmountDisplay
          value={currentValue}
          currency={baseCurrency}
          isHidden={isHidden}
          className="text-sm font-semibold"
        />
        <span className="text-muted-foreground text-xs">{`${freshnessLabel} • ${asOfLabel}`}</span>
      </div>
    </div>
  );
}

function StackedAvatars({ investments, totalRemaining, onClick }: StackedAvatarsProps) {
  const displayedInvestments = investments.slice(0, MAX_STACKED_AVATARS);

  return (
    <div
      className={cn(
        "border-border flex items-center gap-2 border-t py-3 transition-colors",
        onClick ? "hover:bg-muted/50 cursor-pointer" : "",
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      <div className="flex items-center">
        {displayedInvestments.map((item, index) => {
          const avatarSym = getInvestmentAvatarSymbol(item);
          return (
            <div
              key={item.id}
              className={cn("relative", index > 0 && "-ml-2")}
              style={{ zIndex: displayedInvestments.length - index }}
            >
              <TickerAvatar symbol={avatarSym} className="ring-background size-8 ring-2" />
            </div>
          );
        })}
      </div>
      <span className="text-muted-foreground text-xs">{`+${totalRemaining} more investments`}</span>
      {onClick && <Icons.ChevronRight className="text-muted-foreground ml-auto h-3 w-3" />}
    </div>
  );
}

function TopHoldingsSkeleton() {
  return (
    <Card className="w-full border-0 bg-transparent shadow-none">
      <CardHeader className="py-2">
        <CardTitle className="text-md">Top Investments</CardTitle>
      </CardHeader>
      <CardContent>
        <Card className="shadow-xs w-full">
          <CardContent className="px-4 pb-2 pt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-border border-b py-3 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex flex-col gap-1.5">
                      <Skeleton className="h-3.5 w-12" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-[60px] rounded-md" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

function TopHoldingsEmptyState() {
  return (
    <Card className="w-full border-0 bg-transparent p-0 shadow-none">
      <CardHeader className="px-0 py-2">
        <CardTitle className="text-md">Top Investments</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Card className="border-border/50 bg-success/10 shadow-xs w-full">
          <CardContent className="px-4 py-6">
            <div className="text-center">
              <p className="text-sm">No investments yet.</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/activities/manage"
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline"
                >
                  Add your first transaction
                  <Icons.ChevronRight className="h-3 w-3" />
                </Link>
                <Link
                  to="/settings/private-assets"
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline"
                >
                  Add your first private asset
                  <Icons.ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

export function TopHoldings({ holdings, isLoading, baseCurrency }: TopHoldingsProps) {
  const navigate = useNavigate();
  const { isBalanceHidden } = useBalancePrivacy();
  const privateRowsQuery = useQuery<PrivateAssetListRow[], Error>({
    queryKey: QueryKeys.privateAssetRows(false),
    queryFn: () => listPrivateAssetRows(false),
  });
  const [showTotalReturn, setShowTotalReturn] = usePersistentState<boolean>(
    "holdings-show-total-return",
    true,
  );
  const [sortBy, setSortBy] = usePersistentState<"value" | "gain">(
    "holdings-widget-sort-by",
    "value",
  );

  const sortedInvestments = useMemo(() => {
    const publicInvestments: PublicInvestmentItem[] = holdings
      .filter((h) => {
        if (h.holdingType === HoldingType.CASH) return false;
        if (h.assetKind && isAlternativeAssetKind(h.assetKind as AssetKind)) return false;
        return true;
      })
      .map((holding) => ({
        kind: "public",
        id: holding.id,
        sortValue: holding.marketValue?.base ?? 0,
        sortGain: showTotalReturn
          ? (holding.unrealizedGain?.base ?? 0)
          : (holding.dayChange?.base ?? 0),
        holding,
      }));

    const privateInvestments: PrivateInvestmentItem[] = (privateRowsQuery.data ?? []).map((row) => ({
      kind: "private",
      id: row.assetId,
      sortValue: row.latestSnapshot?.currentValue ?? 0,
      row,
    }));

    return [...publicInvestments, ...privateInvestments]
      .sort((a, b) => {
        if (sortBy === "gain") {
          // Private assets do not have truthful daily/total-return metrics in this widget yet,
          // so keep them below gain-sorted public holdings instead of inventing one.
          if (a.kind === "private" && b.kind === "private") {
            return b.sortValue - a.sortValue;
          }
          if (a.kind === "private") return 1;
          if (b.kind === "private") return -1;
          return b.sortGain - a.sortGain;
        }
        return b.sortValue - a.sortValue;
      });
  }, [holdings, privateRowsQuery.data, showTotalReturn, sortBy]);

  const isMixedMode = (privateRowsQuery.data?.length ?? 0) > 0;
  const showLegacyViewAll = !isMixedMode;
  const displayCount =
    sortedInvestments.length === MAX_DISPLAYED_HOLDINGS + 1
      ? MAX_DISPLAYED_HOLDINGS + 1
      : MAX_DISPLAYED_HOLDINGS;
  const topInvestments = sortedInvestments.slice(0, displayCount);
  const remainingInvestments = sortedInvestments.slice(displayCount);
  const hasRemainingInvestments = remainingInvestments.length > 0;

  if (isLoading || privateRowsQuery.isLoading) {
    return <TopHoldingsSkeleton />;
  }

  if (sortedInvestments.length === 0) {
    return <TopHoldingsEmptyState />;
  }

  return (
    <Card className="w-full border-0 bg-transparent p-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between px-0 py-2">
        <CardTitle className="text-md">Top Investments</CardTitle>
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:bg-success/10 h-8 w-8 p-0"
              >
                <Icons.ListFilter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="border-border/50 bg-card min-w-[200px] rounded-2xl border p-2 shadow-lg backdrop-blur-xl"
            >
              <p className="text-muted-foreground px-2 py-1.5 text-xs font-medium uppercase tracking-wider">
                Show
              </p>
              {(["total", "daily"] as const).map((v) => (
                <button
                  key={v}
                  className="hover:bg-accent flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors"
                  onClick={() => setShowTotalReturn(v === "total")}
                >
                  {v === "total" ? "Total Return" : "Daily Change"}
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full border-2",
                      (v === "total") === showTotalReturn
                        ? "border-primary bg-primary"
                        : "border-muted-foreground",
                    )}
                  >
                    {(v === "total") === showTotalReturn && (
                      <span className="bg-primary-foreground h-1.5 w-1.5 rounded-full" />
                    )}
                  </span>
                </button>
              ))}
              <div className="bg-border/70 mx-2 my-1.5 h-px" />
              <p className="text-muted-foreground px-2 py-1.5 text-xs font-medium uppercase tracking-wider">
                Sort by
              </p>
              {(["value", "gain"] as const).map((v) => (
                <button
                  key={v}
                  className="hover:bg-accent flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors"
                  onClick={() => setSortBy(v)}
                >
                  {v === "value" ? "Total Value" : "Gain"}
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full border-2",
                      sortBy === v ? "border-primary bg-primary" : "border-muted-foreground",
                    )}
                  >
                    {sortBy === v && (
                      <span className="bg-primary-foreground h-1.5 w-1.5 rounded-full" />
                    )}
                  </span>
                </button>
              ))}
            </PopoverContent>
          </Popover>
          {showLegacyViewAll && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:bg-success/10 text-xs"
              onClick={() => navigate("/holdings")}
            >
              View All
              <Icons.ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Card className="shadow-xs w-full">
          <CardContent className="px-4 pb-2 pt-4">
            {topInvestments.map((item) =>
              item.kind === "public" ? (
                <PublicHoldingRow
                  key={item.id}
                  holding={item.holding}
                  baseCurrency={baseCurrency}
                  isHidden={isBalanceHidden}
                  showTotalReturn={showTotalReturn}
                  onClick={() =>
                    navigate(
                      `/holdings/${encodeURIComponent(item.holding.instrument?.id ?? item.holding.id)}`,
                    )
                  }
                />
              ) : (
                <PrivateAssetRow
                  key={item.id}
                  row={item.row}
                  baseCurrency={baseCurrency}
                  isHidden={isBalanceHidden}
                  onClick={() => navigate(`/settings/private-assets/${encodeURIComponent(item.id)}`)}
                />
              ),
            )}
            {hasRemainingInvestments && (
              <StackedAvatars
                investments={remainingInvestments}
                totalRemaining={remainingInvestments.length}
                onClick={showLegacyViewAll ? () => navigate("/holdings") : undefined}
              />
            )}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

export default TopHoldings;
