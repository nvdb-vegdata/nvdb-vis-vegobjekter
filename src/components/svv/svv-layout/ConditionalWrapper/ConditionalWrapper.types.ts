import { PropsWithChildren } from "react";

export type ConditionalWrapperProps = PropsWithChildren<{
  condition: boolean;
  renderWrapper: any;
}>;
