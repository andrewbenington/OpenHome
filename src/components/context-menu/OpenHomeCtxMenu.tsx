import { ContextMenu as RadixCtxMenu } from 'radix-ui'
import { ReactNode } from 'react'
import './context-menu.css'
import { CtxMenuElement, contentIsLabel } from './types'

type ContextMenuProps = {
  getElements: () => CtxMenuElement[]
} & RadixCtxMenu.ContextMenuTriggerProps

export default function OpenHomeCtxMenu(props: ContextMenuProps) {
  const { getElements, ...otherProps } = props

  return (
    <RadixCtxMenu.Root modal={false}>
      <RadixCtxMenu.Trigger {...otherProps} asChild />
      <CtxMenuPortal>
        <CtxMenuContent>{getElements().map(componentFromElement)}</CtxMenuContent>
      </CtxMenuPortal>
    </RadixCtxMenu.Root>
  )
}

function CtxMenuPortal(props: RadixCtxMenu.ContextMenuPortalProps) {
  return <RadixCtxMenu.Portal {...props} />
}

function CtxMenuContent(props: RadixCtxMenu.ContextMenuContentProps) {
  return <RadixCtxMenu.Content className="ContextMenuContent" {...props} />
}

function CtxMenuItem(props: RadixCtxMenu.ContextMenuItemProps) {
  return <RadixCtxMenu.Item className="ContextMenuItem" {...props} />
}

function CtxMenuLabel(props: RadixCtxMenu.ContextMenuLabelProps) {
  return <RadixCtxMenu.Label className="ContextMenuLabel" {...props} />
}

function CtxMenuSeparator() {
  return <RadixCtxMenu.Separator className="ContextMenuSeparator" />
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
  }
}
