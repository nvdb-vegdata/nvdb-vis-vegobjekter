import tokens from "@komponentkassen/svv-tokens/dist/external/tokens.json";

export const HIDDEN_BREAKPOINTS = ["xs", "sm", "md", "lg", "xl"] as const;
export type HiddenBreakpoint = (typeof HIDDEN_BREAKPOINTS)[number];

export const breakpointValues: Record<HiddenBreakpoint, number> = {
  xs: Number(tokens.layout.breakpoint.xs),
  sm: Number(tokens.layout.breakpoint.sm.replace("px", "")),
  md: Number(tokens.layout.breakpoint.md.replace("px", "")),
  lg: Number(tokens.layout.breakpoint.lg.replace("px", "")),
  xl: Number(tokens.layout.breakpoint.xl.replace("px", "")),
};
export type HiddenProps = {
  children: React.ReactNode;
  above?: HiddenBreakpoint;
  below?: HiddenBreakpoint;
};
