import { Inset, ContextMenu as RadixCtxMenu } from '@radix-ui/themes'
import { ReactNode } from 'react'
import './context-menu.css'
import { CtxMenuElement, contentIsLabel } from './types'

type ContextMenuProps = {
  getElements: () => CtxMenuElement[]
} & RadixCtxMenu.TriggerProps

export default function OpenHomeCtxMenu(props: ContextMenuProps) {
  const { getElements, ...otherProps } = props

  return (
    <RadixCtxMenu.Root modal={false}>
      <RadixCtxMenu.Trigger {...otherProps} />
      {/* <CtxMenuPortal> */}
      <CtxMenuContent>{getElements().map(componentFromElement)}</CtxMenuContent>
      {/* </CtxMenuPortal> */}
    </RadixCtxMenu.Root>
  )
}

// function CtxMenuPortal(props: RadixCtxMenu.ContextMenuPortalProps) {
//   return <RadixCtxMenu.Portal {...props} />
// }

function CtxMenuContent(props: RadixCtxMenu.ContentProps) {
  return <RadixCtxMenu.Content className="ctx-menu" {...props} />
}

function CtxMenuItem(props: RadixCtxMenu.ItemProps) {
  return <RadixCtxMenu.Item {...props} />
}

function CtxMenuLabel(props: RadixCtxMenu.LabelProps) {
  return <RadixCtxMenu.Label {...props} />
}

function CtxMenuSeparator() {
  return (
    <Inset>
      <RadixCtxMenu.Separator />
    </Inset>
  )
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
