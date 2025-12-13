import { Inset, ContextMenu as RadixCtxMenu } from '@radix-ui/themes'
import { ReactNode } from 'react'
import { Option } from 'src/core/util/functional'
import { filterUndefined } from 'src/core/util/sort'
import './context-menu.css'
import {
  CtxMenuElement,
  CtxMenuElementBuilder,
  CtxMenuSectionBuilders,
  SeparatorBuilder,
  contentIsLabel,
} from './types'

type ContextMenuProps = (
  | {
      sections: Option<CtxMenuSectionBuilders>[]
      elements?: undefined
    }
  | { sections?: undefined; elements: Option<CtxMenuElementBuilder>[] }
) &
  RadixCtxMenu.TriggerProps

export default function OpenHomeCtxMenu(props: ContextMenuProps) {
  const { elements, sections, ...triggerProps } = props

  const allElements: CtxMenuElementBuilder[] =
    elements?.filter(filterUndefined) ??
    sections?.filter(filterUndefined).flatMap((section, i) => {
      const builders = i > 0 ? [SeparatorBuilder, ...section] : section
      return builders.filter(filterUndefined)
    }) ??
    []

  return (
    <RadixCtxMenu.Root modal={false}>
      <RadixCtxMenu.Trigger {...triggerProps} />
      <CtxMenuContent>{allElements.map(buildComponent)}</CtxMenuContent>
    </RadixCtxMenu.Root>
  )
}

export function CtxMenuContent(props: RadixCtxMenu.ContentProps) {
  return <RadixCtxMenu.Content {...props} />
}

function CtxMenuItem(props: RadixCtxMenu.ItemProps) {
  return <RadixCtxMenu.Item {...props} />
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

function buildComponent(builder: CtxMenuElementBuilder, index: number): ReactNode {
  return componentFromElement(builder.build(), index)
}

function componentFromElement(element: CtxMenuElement, index: number): ReactNode {
  switch (element.__cm_type_tag) {
    case 'item':
      return (
        <CtxMenuItem key={index} onClick={element.action} disabled={element.disabled}>
          {contentIsLabel(element.content) ? element.content.label : element.content.component}
        </CtxMenuItem>
      )
    case 'label':
      return (
        <CtxMenuLabel key={index}>
          {contentIsLabel(element.content) ? element.content.label : element.content.component}
        </CtxMenuLabel>
      )
    case 'separator':
      return <CtxMenuSeparator key={index} />
    case 'submenu':
      return (
        <CtxMenuSubmenu key={index}>
          <CtxMenuSubmenuTrigger>
            {contentIsLabel(element.content) ? element.content.label : element.content.component}
          </CtxMenuSubmenuTrigger>
          <CtxMenuSubmenuContent>{element.items.map(componentFromElement)}</CtxMenuSubmenuContent>
        </CtxMenuSubmenu>
      )
  }
}
