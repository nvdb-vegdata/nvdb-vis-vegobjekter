import { createContext, useRef, useState, forwardRef, useMemo } from "react";
import type { FocusEvent } from "react";
import { useMergeRefs } from "./useMergeRefs";
import { RovingIndexRootProps, RovingIndexElementProps, RovingIndexProps } from "./types";

export const RovingIndexContext = createContext<RovingIndexProps>({
  elements: { current: new Map<string, HTMLElement>() },
  getOrderedItems: () => [],
  setFocusableValue: () => {
    /* intentionally empty, will be inherited from RovingIndexRoot */
  },
  onShiftTab: () => {
    /* intentionally empty, will be inherited from RovingIndexRoot */
  },
  focusableValue: null,
});

export const RovingIndexRoot = forwardRef<HTMLElement, RovingIndexRootProps>(
  ({ valueId, onBlur, onFocus, ...rest }, ref) => {
    const [focusableValue, setFocusableValue] = useState<string | null>(null);
    const [isShiftTabbing, setIsShiftTabbing] = useState(false);
    const elements = useRef(new Map<string, HTMLElement>());
    const myRef = useRef<HTMLElement>(null);

    const refs = useMergeRefs([ref, myRef]);

    const getOrderedItems = (): RovingIndexElementProps[] => {
      if (!myRef.current) return [];
      const elementsFromDOM = Array.from(
        myRef.current.querySelectorAll<HTMLElement>("[data-roving-index-item]"),
      );

      return Array.from(elements.current)
        .sort((a, b) => elementsFromDOM.indexOf(a[1]) - elementsFromDOM.indexOf(b[1]))
        .map(([value, element]) => ({ value, element }));
    };

    const rovingIndexContextValue = useMemo(() => {
      return {
        elements,
        getOrderedItems,
        focusableValue,
        setFocusableValue,
        onShiftTab: () => {
          setIsShiftTabbing(true);
        },
      };
    }, [elements, focusableValue, setFocusableValue]);

    return (
      <RovingIndexContext.Provider value={rovingIndexContextValue}>
        <div
          {...rest}
          tabIndex={isShiftTabbing ? -1 : 0}
          onBlur={(e: FocusEvent<HTMLElement>) => {
            onBlur?.(e);
            setIsShiftTabbing(false);
          }}
          onFocus={(e: FocusEvent<HTMLElement>) => {
            onFocus?.(e);
            if (e.target !== e.currentTarget) return;
            const orderedItems = getOrderedItems();
            if (orderedItems.length === 0) return;

            if (focusableValue != null) {
              elements.current.get(focusableValue)?.focus();
            } else if (valueId != null) {
              elements.current.get(valueId)?.focus();
            } else {
              orderedItems.at(0)?.element.focus();
            }
          }}
          ref={refs}
        />
      </RovingIndexContext.Provider>
    );
  },
);

RovingIndexRoot.displayName = "RovingIndexRoot";
