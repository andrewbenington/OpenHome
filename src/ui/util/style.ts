import { filterUndefined } from '../../core/util/sort'

export function hiddenIf(condition: boolean | undefined) {
  return condition ? 'hidden' : undefined
}

export function classNames(...values: (string | undefined)[]): string {
  return values.filter(filterUndefined).join(' ')
}

export function grayscaleIf(condition: boolean | undefined) {
  return condition ? 'grayed-out' : undefined
}

// completely unnecessary but it makes it readable
export function includeClass(className: string) {
  return {
    with(withClassName: string) {
      return {
        if(condition: boolean | undefined) {
          return condition ? `${className} ${withClassName}` : className
        },
        unless(condition: boolean | undefined) {
          return {
            then(conditionClassName: string) {
              return condition
                ? `${className} ${conditionClassName}`
                : `${className} ${withClassName}`
            },
          }
        },
      }
    },
    if(condition: boolean | undefined) {
      return condition ? className : undefined
    },
    unless(unlessCondition: boolean | undefined) {
      return {
        then(conditionClassName: string) {
          return unlessCondition
            ? `${className} ${conditionClassName}`
            : `${className} ${className}`
        },
      }
    },
  }
}

export type CssRemSize = `${number}rem`

const DEFAULT_BASE_FONT_SIZE = 14

export function updateStyleForUiScale(scale: number) {
  document.documentElement.style.setProperty('--scaling', (scale / 100).toString())
  document
    .querySelector('html')
    ?.style.setProperty('--base-font-size', `${(scale / 100) * DEFAULT_BASE_FONT_SIZE}px`)
}
