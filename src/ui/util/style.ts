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
  }
}

export type CssRemSize = `${number}rem`
