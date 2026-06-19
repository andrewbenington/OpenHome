import { Option } from '@openhome-core/util/functional'
import { filterUndefined } from '@openhome-core/util/sort'

export function hiddenIf(condition: boolean | undefined) {
  return condition ? 'hidden' : undefined
}

export function classNames(...values: Option<string>[]): string {
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

function newPending(pendingClass: Option<string>, classes?: string[]): PendingState {
  return {
    with(newPendingClass: Option<string>) {
      const classesOrEmpty = classes ?? []
      return newPending(newPendingClass, allDefined(...classesOrEmpty, pendingClass))
    },
    if(condition: unknown) {
      return newIfState(classes ?? [], pendingClass, condition)
    },
    build: () => buildFromState(classes),
  }
}

function newNotPending(classes?: string[]): NotPendingState {
  return {
    with(pendingClass: Option<string>) {
      return newPending(pendingClass, classes)
    },
    build: () => buildFromState(classes),
  }
}

function newIfState(classes: string[], pendingClass: Option<string>, condition: unknown): IfState {
  return {
    with(className: Option<string>) {
      classes = condition ? allDefined(...classes, pendingClass) : classes
      return newPending(className, classes)
    },
    or(orCondition: unknown) {
      return newIfState(classes ?? [], pendingClass, Boolean(condition) || Boolean(orCondition))
    },
    else(elseClass: Option<string>) {
      return newNotPending(allDefined(...classes, condition ? pendingClass : elseClass))
    },
    build: () => buildFromState(condition ? allDefined(...classes, pendingClass) : classes),
  }
}

function allDefined(...args: Option<string>[]) {
  return args.filter(filterUndefined)
}

function buildFromState(classes: string[] | undefined) {
  return joinCssClasses(...(classes ?? []))
}

type IfStateBuilder = (condition: unknown) => IfState

type PendingStateBuilder = (pendingClass: Option<string>) => PendingState

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
  else(className: string | undefined): NotPendingState
  build: BuildFunction
}

export function joinCssClasses(...classes: Option<string>[]) {
  return classes.filter(Boolean).join(' ')
}

export type RadixColor =
  | 'gray'
  | 'gold'
  | 'bronze'
  | 'brown'
  | 'yellow'
  | 'amber'
  | 'orange'
  | 'tomato'
  | 'red'
  | 'ruby'
  | 'crimson'
  | 'pink'
  | 'plum'
  | 'purple'
  | 'violet'
  | 'iris'
  | 'indigo'
  | 'blue'
  | 'cyan'
  | 'teal'
  | 'jade'
  | 'green'
  | 'grass'
  | 'lime'
  | 'mint'
  | 'sky'
