import { ReactNode } from 'react'

export type Element = Item | Separator | Label

type NoTag<T> = Omit<T, '__cm_type_tag'>

//* ITEM *//

type Item = {
  content: ElementContent
  action?: () => void
  __cm_type_tag: 'item'
}

export class ItemBuilder {
  data: NoTag<Item>

  private constructor(content: ElementContent) {
    this.data = { content }
  }

  static fromLabel(label: string): ItemBuilder {
    return new ItemBuilder({ label })
  }

  static fromComponent(component: ReactNode): ItemBuilder {
    return new ItemBuilder({ component })
  }

  build(): Item {
    return { ...this.data, __cm_type_tag: 'item' }
  }

  withAction(action: () => void): ItemBuilder {
    this.data.action = action
    return this
  }
}

export function contentIsLabel(content: ElementContent): content is { label: string } {
  return 'label' in content
}

type ElementContent = { label: string } | { component: ReactNode }

//* LABEL *//

type Label = {
  content: ElementContent
  __cm_type_tag: 'label'
}

export class LabelBuilder {
  data: NoTag<Label>

  private constructor(content: ElementContent) {
    this.data = { content }
  }

  static fromLabel(label: string): LabelBuilder {
    return new LabelBuilder({ label })
  }

  static fromComponent(component: ReactNode): LabelBuilder {
    return new LabelBuilder({ component })
  }

  build(): Label {
    return { ...this.data, __cm_type_tag: 'label' }
  }
}

//* SEPARATOR *//

export const Separator = Object.freeze({ __cm_type_tag: 'separator' })

type Separator = typeof Separator

export type CtxMenuElement = Element
