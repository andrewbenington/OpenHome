import { Option } from '@openhome-core/util/functional'
import { filterUndefined } from '@openhome-core/util/sort'
import { Inset, ContextMenu as RadixCtxMenu, Spinner } from '@radix-ui/themes'
import { MouseEvent, ReactNode, useMemo, useState } from 'react'
import './style.css'
import {
  CtxMenuElement,
  CtxMenuElementBuilder,
  CtxMenuSectionBuilders,
  Separator,
  renderContent,
} from './types'

type ContextMenuProps = { onOpenChange?: (open: boolean) => void } & (
  | {
      sections: Option<CtxMenuSectionBuilders>[]
      elements?: undefined
    }
  | { sections?: undefined; elements: Option<CtxMenuElementBuilder>[] }
) &
  RadixCtxMenu.TriggerProps

export default function OpenHomeCtxMenu(props: ContextMenuProps) {
  const { elements, sections, onOpenChange, ...triggerProps } = props

  const allElements = useMemo(() => {
    const allBuilders =
      elements?.filter(filterUndefined) ??
      sections?.filter(filterUndefined).flatMap((section, i) => {
        const builders = i > 0 ? [Separator, ...section] : section
        return builders.filter(filterUndefined)
      }) ??
      []

    return allBuilders.map(buildComponent)
  }, [elements, sections])

  return (
    <RadixCtxMenu.Root modal={false} onOpenChange={onOpenChange}>
      <RadixCtxMenu.Trigger
        {...triggerProps}
        onContextMenuCapture={(e) => {
          // show native context menu if alt is held
          if (e.altKey) {
            e.stopPropagation()
          }
        }}
      />
      <CtxMenuContent>{allElements}</CtxMenuContent>
    </RadixCtxMenu.Root>
  )
}

function CtxMenuContent(props: RadixCtxMenu.ContentProps) {
  return <RadixCtxMenu.Content {...props} />
}

function CtxMenuItem(props: RadixCtxMenu.ItemProps) {
  return <RadixCtxMenu.Item {...props} />
}

function CtxMenuLoadingItem(
  props: RadixCtxMenu.ItemProps & { onClickAsync: (e: MouseEvent<HTMLDivElement>) => Promise<void> }
) {
  const [loading, setLoading] = useState(false)
  const { onClickAsync } = props

  function onClick(e: MouseEvent<HTMLDivElement>) {
    setLoading(true)
    void onClickAsync(e).then(() => setLoading(false))
  }

  return loading ? <Spinner /> : <RadixCtxMenu.Item {...props} onClick={onClick} />
}

function CtxMenuLabel(props: RadixCtxMenu.LabelProps) {
  return <RadixCtxMenu.Label className="ContextMenuLabel" {...props} />
}

function CtxMenuSeparator() {
  return (
    <Inset>
      <RadixCtxMenu.Separator />
    </Inset>
  )
}

function CtxMenuSubmenu(props: RadixCtxMenu.SubProps) {
  return <RadixCtxMenu.Sub {...props} />
}

function CtxMenuSubmenuTrigger(props: RadixCtxMenu.SubTriggerProps) {
  return <RadixCtxMenu.SubTrigger {...props} />
}

function CtxMenuSubmenuContent(props: RadixCtxMenu.SubContentProps) {
  return <RadixCtxMenu.SubContent {...props} />
}

function CtxMenuCheckboxItem(props: RadixCtxMenu.CheckboxItemProps) {
  return <RadixCtxMenu.CheckboxItem {...props} style={{ color: 'inherit', ...props.style }} />
}

function buildComponent(builder: CtxMenuElementBuilder): ReactNode[] {
  return componentsFromElements(builder.build())
}

function componentsFromElements(elements: CtxMenuElement | CtxMenuElement[]): ReactNode[] {
  return (Array.isArray(elements) ? elements : [elements]).flatMap(componentsFromElement)
}

function componentsFromElement(element: CtxMenuElement, index: number): ReactNode {
  switch (element.__cm_type_tag) {
    case 'item':
      return (
        <CtxMenuItem
          key={index}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            element.action?.()
          }}
          disabled={element.disabled}
        >
          {renderContent(element.content)}
        </CtxMenuItem>
      )
    case 'loading_item':
      return (
        <CtxMenuLoadingItem
          key={index}
          onClickAsync={async (e) => {
            e.preventDefault()
            e.stopPropagation()
            await element.action?.()
          }}
          // disabled={element.disabled}
        >
          {renderContent(element.content)}
        </CtxMenuLoadingItem>
      )
    case 'label':
      return <CtxMenuLabel key={index}>{renderContent(element.content)}</CtxMenuLabel>
    case 'separator':
      return <CtxMenuSeparator key={index} />
    case 'submenu':
      return (
        <CtxMenuSubmenu key={index}>
          <CtxMenuSubmenuTrigger>{renderContent(element.content)}</CtxMenuSubmenuTrigger>
          <CtxMenuSubmenuContent>
            {element.items.flatMap(componentsFromElement)}
          </CtxMenuSubmenuContent>
        </CtxMenuSubmenu>
      )
    case 'checkbox':
      return (
        <CtxMenuCheckboxItem
          key={index}
          checked={element.getIsChecked()}
          onClick={(e) => {
            element.onValueChanged()

            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <div className="ContextMenuCheckboxItem" style={{ color: 'inherit' }}>
            {renderContent(element.content)}
          </div>
        </CtxMenuCheckboxItem>
      )
  }
}
