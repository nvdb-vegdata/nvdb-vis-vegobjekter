import React, { forwardRef, ReactElement, cloneElement } from "react";
import { RovingIndexElementProps, RovingIndexItemProps } from "./types";
import { useMergeRefs } from "./useMergeRefs";
import { useRovingTabindex } from "./useRovingIndex";

/** Get the next focusable RovingTabindexItem */
export function getNextFocusableValue(
  items: RovingIndexElementProps[],
  value: string,
): RovingIndexElementProps | undefined {
  const currIndex = items.findIndex((item) => item.value === value);
  return items.at(currIndex === items.length - 1 ? items.length - 1 : currIndex + 1);
}

/** Get the previous focusable RovingTabindexItem */
export function getPrevFocusableValue(
  items: RovingIndexElementProps[],
  value: string,
): RovingIndexElementProps | undefined {
  const currIndex = items.findIndex((item) => item.value === value);
  return items.at(currIndex === 0 ? 0 : currIndex - 1);
}

export const RovingIndexItem = forwardRef<HTMLElement, RovingIndexItemProps>(
  ({ value, children, ...rest }, ref) => {
    const Component = "div";

    const focusValue = value ?? (typeof children === "string" ? children : "");

    const { getOrderedItems, getRovingProps } = useRovingTabindex(focusValue);

    const rovingProps = getRovingProps<HTMLElement>({
      onKeyDown: (e) => {
        rest?.onKeyDown?.(e);
        const items = getOrderedItems();
        let nextItem: RovingIndexElementProps | undefined;

        if (e.key === "ArrowRight") {
          nextItem = getNextFocusableValue(items, focusValue);
        }

        if (e.key === "ArrowLeft") {
          nextItem = getPrevFocusableValue(items, focusValue);
        }

        nextItem?.element.focus();
      },
    });

    const mergedRefs = useMergeRefs([ref, rovingProps.ref]);

    if (React.Children.count(children) === 1) {
      const child = React.Children.toArray(children)[0] as ReactElement<any>;
      return (
        <>
          {cloneElement(child, {
            ...rest,
            ...rovingProps,
            ref: mergedRefs,
          })}
        </>
      );
    }
    return (
      <Component {...rest} {...rovingProps} ref={mergedRefs}>
        {children}
      </Component>
    );
  },
);

RovingIndexItem.displayName = "RovingIndexItem";
