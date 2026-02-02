import classNames from 'classnames'
import type React from 'react'
import { cloneElement, type ForwardedRef, forwardRef, isValidElement } from 'react'
import type { ButtonLinkType } from './Button.types'
import { useButtonTestId } from './test-parts'

/**
 * @deprecated SVVButtonLink er fjernet i nyere versjoner, og vil bli permanent fjernet 01.03.2026. Bruk SVVButton med as="a" for samme funksjonalitet.
 */
export const SVVButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkType>(function ButtonInternal(
  props: ButtonLinkType,
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  const { children, small, color, icon, iconPlacement, looksLikeLink, href, className, testId, ...restProps } = props

  const testIds = useButtonTestId(testId)
  const buttonCss = classNames(
    'svv-button',
    {
      'svv-button--small': small,
      'svv-button--secondary': color === 'secondary',
      'svv-button--icon': !!icon,
      'svv-button--icon-right': iconPlacement === 'right',
    },
    props.className,
  )

  return (
    <a ref={ref} href={href} {...restProps} className={looksLikeLink ? `svv-button--looks-like-link ${className}` : buttonCss} data-testid={testIds.root}>
      {icon && isValidElement(icon) && cloneElement(icon as React.ReactElement, { 'aria-hidden': true })}
      {children}
    </a>
  )
})

SVVButtonLink.displayName = 'SVVButtonLink'
