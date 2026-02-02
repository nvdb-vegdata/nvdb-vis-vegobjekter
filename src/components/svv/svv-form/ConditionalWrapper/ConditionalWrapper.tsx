import { ConditionalWrapperProps } from "./ConditionalWrapper.types";

export function SVVConditionalWrapper({
  condition,
  renderWrapper,
  children,
}: ConditionalWrapperProps) {
  return condition ? renderWrapper(children) : children;
}

SVVConditionalWrapper.displayName = "SVVConditionalWrapper";
