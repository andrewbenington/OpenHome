import { Select as SelectPrimitive } from '@base-ui/react/select'
import { classNames } from '@openhome-ui/util/style'
import * as React from 'react'
import './Select.css'

const useIsoLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect

function ChevronDownIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path
        d="M4 6l3.5 3.5L11 6"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path
        d="M3.5 8l3 3 5-6.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* Context: tracks the current value + item labels so <Select.Value /> can     */
/* show the selected item's content automatically (like Radix does).           */

/* Base UI only unmounts/mounts the popup on open, so closed-state labels      */
/* can't come from mounted items. Instead we (1) scan the JSX tree under Root  */
/* for <Select.Item>s, and (2) fall back to items registering themselves when  */
/* mounted (covers items rendered inside your own wrapper components).         */

function collectItemLabels(
  node: React.ReactNode,
  acc: Record<string, React.ReactNode> = {}
): Record<string, React.ReactNode> {
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement<{ value?: unknown; children?: React.ReactNode }>(child)) return
    if (child.type === Item) {
      if (typeof child.props.value === 'string') acc[child.props.value] = child.props.children
    } else if (child.props.children !== null) {
      collectItemLabels(child.props.children, acc)
    }
  })
  return acc
}

interface SelectContextValue {
  value: string
  labels: Record<string, React.ReactNode>
  registerLabel: (value: string, label: React.ReactNode) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

function useSelectContext() {
  const ctx = React.useContext(SelectContext)
  if (!ctx) throw new Error('Select parts must be used inside <Select.Root>')
  return ctx
}

/* Root */

export type RootProps = Omit<
  SelectPrimitive.Root.Props<string>,
  'value' | 'defaultValue' | 'onValueChange' | 'multiple'
> & {
  /** Controlled value. Use "" for "nothing selected". */
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

function Root({ value, defaultValue = '', onValueChange, children, ...props }: RootProps) {
  const isControlled = value !== undefined
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const current = isControlled ? value : uncontrolled

  const [registered, setRegistered] = React.useState<Record<string, React.ReactNode>>({})
  const registerLabel = React.useCallback((v: string, label: React.ReactNode) => {
    setRegistered((prev) => (Object.is(prev[v], label) ? prev : { ...prev, [v]: label }))
  }, [])

  const ctx = React.useMemo(
    () => ({
      value: current,
      labels: { ...registered, ...collectItemLabels(children) },
      registerLabel,
    }),
    [current, registered, children, registerLabel]
  )

  return (
    <SelectContext.Provider value={ctx}>
      <SelectPrimitive.Root
        {...props}
        value={current === '' ? null : current}
        onValueChange={(next) => {
          const str = next ?? ''
          if (!isControlled) setUncontrolled(str)
          onValueChange?.(str)
        }}
      >
        {children}
      </SelectPrimitive.Root>
    </SelectContext.Provider>
  )
}

/* Value */

export interface ValueProps extends React.ComponentPropsWithoutRef<'span'> {
  placeholder?: React.ReactNode
}

const Value = React.forwardRef<HTMLSpanElement, ValueProps>(function SelectValue(
  { placeholder, className, ...props },
  ref
) {
  const { value, labels } = useSelectContext()
  const hasValue = value !== ''
  return (
    <span
      ref={ref}
      className={classNames('ui-select-value', className)}
      data-placeholder={hasValue ? undefined : ''}
      {...props}
    >
      {hasValue ? (labels[value] ?? value) : placeholder}
    </span>
  )
})

/* Trigger */

export interface TriggerProps extends Omit<SelectPrimitive.Trigger.Props, 'className'> {
  className?: string
  /** Shown when nothing is selected. Ignored if you pass your own children. */
  placeholder?: React.ReactNode
}

const Trigger = React.forwardRef<HTMLButtonElement, TriggerProps>(function SelectTrigger(
  { className, placeholder, children, ...props },
  ref
) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={classNames('ui-select-trigger', className)}
      {...props}
    >
      {children ?? <Value placeholder={placeholder} />}
      <SelectPrimitive.Icon className="ui-select-icon">
        <ChevronDownIcon />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
})

/* Content */

export interface ContentProps extends Omit<SelectPrimitive.Popup.Props, 'className'> {
  className?: string
  side?: SelectPrimitive.Positioner.Props['side']
  align?: SelectPrimitive.Positioner.Props['align']
  sideOffset?: SelectPrimitive.Positioner.Props['sideOffset']
  /** Defaults to false so the popup always opens below (or above if no room), like Radix "popper". */
  alignItemWithTrigger?: boolean
  /** Where to portal to. Pass your Radix <Theme> element to inherit its CSS variables / dark mode. */
  container?: SelectPrimitive.Portal.Props['container']
}

const Content = React.forwardRef<HTMLDivElement, ContentProps>(function SelectContent(
  {
    className,
    children,
    side = 'bottom',
    align = 'start',
    sideOffset = 4,
    alignItemWithTrigger = false,
    container,
    ...props
  },
  ref
) {
  return (
    <SelectPrimitive.Portal container={container}>
      <SelectPrimitive.Positioner
        className="ui-select-positioner"
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignItemWithTrigger={alignItemWithTrigger}
      >
        <SelectPrimitive.Popup
          ref={ref}
          className={classNames('ui-select-content', className)}
          {...props}
        >
          <SelectPrimitive.List className="ui-select-list">{children}</SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
})

/* Item (checkmark + text wired up automatically) */

export interface ItemProps extends Omit<SelectPrimitive.Item.Props, 'className' | 'value'> {
  className?: string
  value: string
}

const Item = React.forwardRef<HTMLDivElement, ItemProps>(function SelectItem(
  { className, children, value, ...props },
  ref
) {
  const { registerLabel } = useSelectContext()
  useIsoLayoutEffect(() => {
    registerLabel(value, children)
  }, [registerLabel, value, children])

  return (
    <SelectPrimitive.Item
      ref={ref}
      value={value}
      // Typeahead uses this; derive it from plain-string children.
      label={typeof children === 'string' ? children : undefined}
      className={classNames('ui-select-item', className)}
      {...props}
    >
      <SelectPrimitive.ItemIndicator className="ui-select-item-indicator">
        <CheckIcon />
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText className="ui-select-item-text">
        {children}
      </SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
})

/* Group / Label / Separator */

const Group = React.forwardRef<
  HTMLDivElement,
  Omit<SelectPrimitive.Group.Props, 'className'> & { className?: string }
>(function SelectGroup({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Group
      ref={ref}
      className={classNames('ui-select-group', className)}
      {...props}
    />
  )
})

const Label = React.forwardRef<
  HTMLDivElement,
  Omit<SelectPrimitive.GroupLabel.Props, 'className'> & { className?: string }
>(function SelectLabel({ className, ...props }, ref) {
  return (
    <SelectPrimitive.GroupLabel
      ref={ref}
      className={classNames('ui-select-label', className)}
      {...props}
    />
  )
})

const Separator = React.forwardRef<
  HTMLDivElement,
  Omit<SelectPrimitive.Separator.Props, 'className'> & { className?: string }
>(function SelectSeparator({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Separator
      ref={ref}
      className={classNames('ui-select-separator', className)}
      {...props}
    />
  )
})

export const Select = { Root, Trigger, Value, Content, Group, Label, Item, Separator }
export { Content, Group, Item, Label, Root, Separator, Trigger, Value }
