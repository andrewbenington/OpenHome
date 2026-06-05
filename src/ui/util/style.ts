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

export type CssRemSize = `${number}rem`

const DEFAULT_BASE_FONT_SIZE = 14

export function updateStyleForUiScale(scale: number) {
  document.documentElement.style.setProperty('--scaling', (scale / 100).toString())
  document
    .querySelector('html')
    ?.style.setProperty('--base-font-size', `${(scale / 100) * DEFAULT_BASE_FONT_SIZE}px`)
}

export function cssClass(className: string): PendingState {
  return newPending(className)
}

function newPending(pendingClass: string, classes?: string[]): PendingState {
  return {
    with(newpendingClass: string) {
      return newPending(newpendingClass, [...(classes ?? []), pendingClass])
    },
    if(condition: unknown) {
      return newIfState(classes ?? [], pendingClass, condition)
    },
    build: () => buildFromState(classes),
  }
}

function newNotPending(classes?: string[]): NotPendingState {
  return {
    with(pendingClass: string) {
      return newPending(pendingClass, classes)
    },
    build: () => buildFromState(classes),
  }
}

function newIfState(classes: string[], pendingClass: string, condition: unknown): IfState {
  return {
    with(className: string) {
      classes = condition ? [...classes, pendingClass] : classes
      return newPending(className, classes)
    },
    or(orCondition: unknown) {
      return newIfState(classes ?? [], pendingClass, Boolean(condition) || Boolean(orCondition))
    },
    else(elseClass: string) {
      return newNotPending([...classes, condition ? pendingClass : elseClass])
    },
    build: () => buildFromState(condition ? [...classes, pendingClass] : classes),
  }
}

function buildFromState(classes: string[] | undefined) {
  return joinCssClasses(...(classes ?? []))
}

type IfStateBuilder = (condition: unknown) => IfState

type PendingStateBuilder = (pendingClass: string) => PendingState

type BuildFunction = () => string

type NotPendingState = {
  with: PendingStateBuilder
  build: BuildFunction
}

type PendingState = {
  with: PendingStateBuilder
  if: IfStateBuilder
  build: BuildFunction
}

type IfState = {
  with: PendingStateBuilder
  or: IfStateBuilder
  else(className: string): NotPendingState
  build: BuildFunction
}

export function joinCssClasses(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
