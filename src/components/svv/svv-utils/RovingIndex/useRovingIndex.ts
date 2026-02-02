import type { HTMLAttributes } from 'react';
import { useContext } from 'react';

import { RovingIndexContext } from './RovingIndexRoot';


export const useRovingTabindex = (value: string) => {
  const {
    elements,
    getOrderedItems,
    setFocusableValue,
    focusableValue,
    onShiftTab,
  } = useContext(RovingIndexContext);

  return {
    getOrderedItems,
    isFocusable: focusableValue === value,
    getRovingProps: <T extends HTMLElement>(props: HTMLAttributes<T>) => ({
      ...props,
      ref: (element: HTMLElement | null) => {
        if (element) {
          elements.current.set(value, element);
        } else {
          elements.current.delete(value);
        }
      },
      onKeyDown: (e: React.KeyboardEvent<T>) => {
        props?.onKeyDown?.(e);
        if (e.shiftKey && e.key === 'Tab') {
          onShiftTab();
          
        }
      },
      onFocus: (e: React.FocusEvent<T>) => {
        props?.onFocus?.(e);
        setFocusableValue(value);
      },
      'data-roving-index-item': true,
      tabIndex: focusableValue === value ? 0 : -1,
    }),
  };
};