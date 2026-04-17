import { zodResolver } from "@hookform/resolvers/zod";
import { formatDateISO } from "@/lib/utils";
import { useIsMobileViewport } from "@/hooks/use-platform";
import type { PrivateSnapshot } from "@/lib/types";
import { useForm, type Resolver, type SubmitHandler } from "react-hook-form";
import { useMemo } from "react";
import * as z from "zod";

import {
  getPrivateStatementAmountLabel,
  privateSnapshotCashFlowTypeOptions,
  privateSnapshotValueSourceOptions,
} from "../private-assets-utils";
import { usePrivateAssetMutations } from "../use-private-asset-mutations";
import { Button } from "@wealthfolio/ui/components/ui/button";
import { Dialog, DialogContent } from "@wealthfolio/ui/components/ui/dialog";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@wealthfolio/ui/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@wealthfolio/ui/components/ui/form";
import { Icons } from "@wealthfolio/ui/components/ui/icons";
import { Textarea } from "@wealthfolio/ui/components/ui/textarea";
import { DatePickerInput, MoneyInput, ResponsiveSelect, type ResponsiveSelectOption } from "@wealthfolio/ui";

const requiredNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return typeof value === "string" ? Number(value) : value;
}, z.number().finite());

const snapshotSchema = z.object({
  contributedAmount: requiredNumber,
  distributedAmount: requiredNumber,
  cashFlowType: z
    .enum(["TOTAL_TO_DATE", "PERIOD_ONLY"])
    .optional()
    .refine((value) => value !== undefined, "Statement basis is required"),
  currentValue: requiredNumber,
  asOfDate: z.date({
    required_error: "As-of date is required",
  }),
  valueSourceType: z.enum(["MANUAL", "STATEMENT", "ESTIMATED"]),
  notes: z.string().optional(),
});

interface SnapshotFormValues {
  contributedAmount: number;
  distributedAmount: number;
  cashFlowType?: "TOTAL_TO_DATE" | "PERIOD_ONLY";
  currentValue: number;
  asOfDate: Date;
  valueSourceType: "MANUAL" | "STATEMENT" | "ESTIMATED";
  notes?: string;
}

interface PrivateSnapshotEditModalProps {
  privateAssetId: string;
  snapshot?: PrivateSnapshot | null;
  open: boolean;
  onClose: () => void;
}

export function PrivateSnapshotEditModal({
  privateAssetId,
  snapshot,
  open,
  onClose,
}: PrivateSnapshotEditModalProps) {
  const { createPrivateSnapshotMutation, updatePrivateSnapshotMutation } = usePrivateAssetMutations();

  const formValues = useMemo(
    () => ({
      contributedAmount: snapshot?.contributedAmount ?? 0,
      distributedAmount: snapshot?.distributedAmount ?? 0,
      cashFlowType: snapshot?.cashFlowType ?? "TOTAL_TO_DATE",
      currentValue: snapshot?.currentValue ?? 0,
      asOfDate: snapshot?.asOfDate ? new Date(`${snapshot.asOfDate}T00:00:00`) : new Date(),
      valueSourceType: snapshot?.valueSourceType ?? "STATEMENT",
      notes: snapshot?.notes ?? "",
    }),
    [open, snapshot],
  );

  const form = useForm<SnapshotFormValues>({
    resolver: zodResolver(snapshotSchema) as Resolver<SnapshotFormValues>,
    values: formValues,
  });

  const isPending =
    createPrivateSnapshotMutation.isPending || updatePrivateSnapshotMutation.isPending;
  const selectedCashFlowType = form.watch("cashFlowType") ?? "TOTAL_TO_DATE";

  const handleSubmit: SubmitHandler<SnapshotFormValues> = async (values) => {
    if (!values.cashFlowType) {
      form.setError("cashFlowType", { message: "Statement basis is required" });
      return;
    }

    const payload = {
      contributedAmount: values.contributedAmount,
      distributedAmount: values.distributedAmount,
      cashFlowType: values.cashFlowType,
      currentValue: values.currentValue,
      asOfDate: formatDateISO(values.asOfDate),
      valueSourceType: values.valueSourceType,
      notes: values.notes?.trim() ? values.notes.trim() : null,
    };

    if (snapshot?.id) {
      await updatePrivateSnapshotMutation.mutateAsync({
        privateSnapshotId: snapshot.id,
        privateAssetId,
        payload,
      });
    } else {
      await createPrivateSnapshotMutation.mutateAsync({
        privateAssetId,
        ...payload,
      });
    }

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()} useIsMobile={useIsMobileViewport}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[620px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <DialogHeader>
              <DialogTitle>{snapshot?.id ? "Edit Statement" : "Add Statement"}</DialogTitle>
              <DialogDescription>
                Record the latest reported statement values for this asset. Most partner
                statements show since-inception totals, so only switch the basis if you are
                entering MTD, QTD, or YTD activity instead.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="contributedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{getPrivateStatementAmountLabel(selectedCashFlowType, "contributed")}</FormLabel>
                    <FormControl>
                      <MoneyInput {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="distributedAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{getPrivateStatementAmountLabel(selectedCashFlowType, "distributed")}</FormLabel>
                    <FormControl>
                      <MoneyInput {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Value</FormLabel>
                    <FormControl>
                      <MoneyInput {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cashFlowType"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Contribution / Distribution Basis</FormLabel>
                    <FormControl>
                      <ResponsiveSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        options={privateSnapshotCashFlowTypeOptions as unknown as ResponsiveSelectOption[]}
                        placeholder="Choose how this statement reports cash flows"
                        sheetTitle="Contribution / Distribution Basis"
                        sheetDescription="Choose whether the contribution and distribution amounts below come from a since-inception / ITD column or only the statement period's MTD, QTD, or YTD activity."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="asOfDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>As-Of Date</FormLabel>
                    <FormControl>
                      <DatePickerInput value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valueSourceType"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Value Source</FormLabel>
                    <FormControl>
                      <ResponsiveSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        options={privateSnapshotValueSourceOptions as unknown as ResponsiveSelectOption[]}
                        placeholder="Select source"
                        sheetTitle="Value Source"
                        sheetDescription="Estimated values show as estimated; statement and manual values use freshness rules."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Optional notes for this statement" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <Icons.Spinner className="h-4 w-4 animate-spin" />
                    Saving
                  </span>
                ) : (
                  snapshot?.id ? "Save changes" : "Save statement"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
