import { Option } from '@openhome/core/util/functional'
import { ReactNode } from 'react'

export type Element = Item | Separator | Label | Submenu

export interface CtxMenuElementBuilder {
  build: () => Element
}

export type CtxMenuSectionBuilders = Option<CtxMenuElementBuilder>[]

function buildElement(builder: CtxMenuElementBuilder): Element {
  return builder.build()
}

type NoTag<T> = Omit<T, '__cm_type_tag'>

//* ITEM *//

type Item = {
  content: ElementContent
  action?: () => void
  disabled: boolean
  __cm_type_tag: 'item'
}

export class ItemBuilder implements CtxMenuElementBuilder {
  content: ElementContent
  action?: () => void
  disabled: boolean = true

  private constructor(content: ElementContent) {
    this.content = content
  }

  static fromLabel(label: string): ItemBuilder {
    return new ItemBuilder({ label })
  }

  static fromComponent(component: ReactNode): ItemBuilder {
    return new ItemBuilder({ component })
  }

  withAction(action?: () => void): ItemBuilder {
    this.action = action
    return this
  }

  withDisabled(disabled: boolean): ItemBuilder {
    this.disabled = disabled
    return this
  }

  build(): Item {
    return {
      content: this.content,
      action: this.action,
      disabled: this.action === undefined,
      __cm_type_tag: 'item',
    }
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
  disabled: boolean
  __cm_type_tag: 'submenu'
}

export class SubmenuBuilder implements CtxMenuElementBuilder {
  content: ElementContent
  builders: CtxMenuElementBuilder[] = []
  disabled: boolean = true

  private constructor(content: ElementContent) {
    this.content = content
  }

  static fromLabel(label: string): SubmenuBuilder {
    return new SubmenuBuilder({ label })
  }

  static fromComponent(component: ReactNode): SubmenuBuilder {
    return new SubmenuBuilder({ component })
  }

  withBuilder(builder: CtxMenuElementBuilder): SubmenuBuilder {
    this.builders.push(builder)
    return this
  }

  withBuilders(builders: CtxMenuElementBuilder[]): SubmenuBuilder {
    this.builders.push(...builders)
    return this
  }

  withDisabled(disabled: boolean): SubmenuBuilder {
    this.disabled = disabled
    return this
  }

  build(): Submenu {
    return {
      content: this.content,
      items: this.builders.map(buildElement),
      disabled: this.disabled,
      __cm_type_tag: 'submenu',
    }
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
