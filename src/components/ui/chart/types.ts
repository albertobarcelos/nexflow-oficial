import * as React from "react";
import { TooltipProps } from "recharts";

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<"light" | "dark", string> }
  );
};

export type ChartContextProps = {
  config: ChartConfig;
};

export type ChartTooltipContentProps = React.ComponentProps<"div"> &
  Pick<TooltipProps<any, any>, "payload" | "active"> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
    labelFormatter?: (value: any, payload: any[]) => React.ReactNode;
    formatter?: (
      value: any,
      name: string,
      props: any,
      index: number,
      payload: any
    ) => React.ReactNode;
    labelClassName?: string;
    color?: string;
    label?: React.ReactNode;
  };