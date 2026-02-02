export const STACK_BREAKPOINTS = ["xs", "sm", "md", "lg", "xl"] as const;
export type StackBreakpoint = (typeof STACK_BREAKPOINTS)[number];

export type ResponsiveProp<T> =
  | T
  | {
      [Breakpoint in StackBreakpoint]?: T;
    };
