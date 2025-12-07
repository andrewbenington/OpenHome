import { Inset, ContextMenu as RadixCtxMenu } from '@radix-ui/themes'
import { ReactNode } from 'react'
import { filterUndefined } from 'src/util/Sort'
import './context-menu.css'
import { CtxMenuElement, CtxMenuElementBuilder, SeparatorBuilder, contentIsLabel } from './types'

type ContextMenuProps = {
  sections: ((CtxMenuElementBuilder | undefined)[] | undefined)[]
} & RadixCtxMenu.TriggerProps

export default function OpenHomeCtxMenu(props: ContextMenuProps) {
  const { sections, ...otherProps } = props

  return (
    <RadixCtxMenu.Root modal={false}>
      <RadixCtxMenu.Trigger {...otherProps} />
      <CtxMenuContent>
        {sections.filter(filterUndefined).flatMap((section, i) => {
          const builders = i > 0 ? [SeparatorBuilder, ...section] : section
          return builders.filter(filterUndefined).map(buildComponent)
        })}
      </CtxMenuContent>
    </RadixCtxMenu.Root>
  )
}

export function CtxMenuContent(props: RadixCtxMenu.ContentProps) {
  return <RadixCtxMenu.Content className="ctx-menu" {...props} />
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
        <CtxMenuItem key={index} onClick={element.action}>
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
      return <CtxMenuSeparator />
    case 'submenu':
      return (
        <CtxMenuSubmenu>
          <CtxMenuSubmenuTrigger>
            {contentIsLabel(element.content) ? element.content.label : element.content.component}
          </CtxMenuSubmenuTrigger>
          <CtxMenuSubmenuContent>{element.items.map(componentFromElement)}</CtxMenuSubmenuContent>
        </CtxMenuSubmenu>
      )
  }
}
