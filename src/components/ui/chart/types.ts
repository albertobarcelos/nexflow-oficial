import { ChartConfig } from "recharts/types/util/types";
import { ReactNode } from "react";

export type ChartContextProps = {
  config: ChartConfig;
};

export type ChartContainerProps = React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
};

export type ChartTooltipContentProps = React.ComponentProps<"div"> &
  Pick<RechartsPrimitive.TooltipProps, "payload" | "active"> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
    labelFormatter?: (value: any, payload: any[]) => React.ReactNode;
    formatter?: (value: any, name: string, props: any, index: number, payload: any) => React.ReactNode;
    labelClassName?: string;
    color?: string;
    label?: React.ReactNode;
  };