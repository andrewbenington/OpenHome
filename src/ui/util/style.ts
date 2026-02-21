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

export function includeClass(className: string) {
  return {
    with(otherClassName: string) {
      return {
        if(condition: boolean | undefined) {
          return condition ? `${className} ${otherClassName}` : className
        },
      }
    },
    if(condition: boolean | undefined) {
      return condition ? className : undefined
    },
  }
}

export type CssRemSize = `${number}rem`
