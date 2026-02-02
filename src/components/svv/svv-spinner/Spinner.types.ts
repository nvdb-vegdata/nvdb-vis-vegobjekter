import type React from 'react'
import type { WithTestId } from '../svv-testid'

export const SPINNER_SIZES = ['small', 'medium', 'large'] as const
export type SpinnerSize = (typeof SPINNER_SIZES)[number]

export type SpinnerProps = React.PropsWithChildren<{
  ariaLabel?: string
  centered?: boolean
  size?: SpinnerSize
  inline?: boolean
}> &
  WithTestId
