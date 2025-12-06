import { ReactNode } from 'react'

export type Element = Item | Separator | Label | Submenu

export interface CtxMenuElementBuilder {
  build: () => Element
}

function buildElement(builder: CtxMenuElementBuilder): Element {
  return builder.build()
}

type NoTag<T> = Omit<T, '__cm_type_tag'>

//* ITEM *//

type Item = {
  content: ElementContent
  action?: () => void
  __cm_type_tag: 'item'
}

export class ItemBuilder implements CtxMenuElementBuilder {
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

export class LabelBuilder implements CtxMenuElementBuilder {
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

export const SeparatorBuilder = Object.freeze({
  build() {
    return Separator
  },
})

//* Submenu *//

type Submenu = {
  content: ElementContent
  items: Element[]
  __cm_type_tag: 'submenu'
}

export class SubmenuBuilder implements CtxMenuElementBuilder {
  content: ElementContent
  builders: CtxMenuElementBuilder[] = []

  private constructor(content: ElementContent) {
    this.content = content
  }

  static fromLabel(label: string): SubmenuBuilder {
    return new SubmenuBuilder({ label })
  }

  static fromComponent(component: ReactNode): SubmenuBuilder {
    return new SubmenuBuilder({ component })
  }

  build(): Submenu {
    return {
      content: this.content,
      items: this.builders.map(buildElement),
      __cm_type_tag: 'submenu',
    }
  }

  withBuilder(builder: CtxMenuElementBuilder): SubmenuBuilder {
    this.builders.push(builder)
    return this
  }

  withBuilders(builders: CtxMenuElementBuilder[]): SubmenuBuilder {
    this.builders.push(...builders)
    return this
  }
}

export function includeIf(builders: CtxMenuElementBuilder[] | undefined): CtxMenuElementBuilder[] {
  return builders ?? []
}

export function includeWithSeparatorIf(
  builders: CtxMenuElementBuilder[] | undefined
): CtxMenuElementBuilder[] {
  return builders ? [SeparatorBuilder, ...builders] : []
}

export type CtxMenuElement = Element
