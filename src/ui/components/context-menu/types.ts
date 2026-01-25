import { Option } from '@openhome-core/util/functional'
import React, { ReactNode } from 'react'
import { PKMInterface } from '../../../core/pkm/interfaces'
import PokemonIcon from '../PokemonIcon'

export type Element = Item | Separator | Label | Submenu | Checkbox

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
export function renderContent(content: ElementContent): ReactNode {
  return contentIsLabel(content) ? content.label : content.component
}

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

  static fromMon(mon: PKMInterface, size: number = 16): LabelBuilder {
    return LabelBuilder.fromComponent(
      React.createElement(
        React.Fragment,
        null,
        React.createElement(PokemonIcon, {
          dexNumber: mon.dexNum,
          formeNumber: mon.formeNum,
          style: { width: size, height: size, marginRight: 8 },
        }),
        mon.nickname
      )
    )
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

//* SUBMENU *//

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

//* CHECKBOX *//

type Checkbox = {
  content: ElementContent
  onValueChanged: () => void
  getIsChecked: () => boolean
  disabled: boolean
  __cm_type_tag: 'checkbox'
}

export class CheckboxBuilder implements CtxMenuElementBuilder {
  content: ElementContent
  onValueChanged: Option<() => void>
  getIsChecked: Option<() => boolean>
  disabled: boolean = true

  private constructor(content: ElementContent) {
    this.content = content
  }

  static fromLabel(label: string): CheckboxBuilder {
    return new CheckboxBuilder({ label })
  }

  static fromComponent(component: ReactNode): CheckboxBuilder {
    return new CheckboxBuilder({ component })
  }

  handleValueChanged(handler: () => void): CheckboxBuilder {
    this.onValueChanged = handler
    return this
  }

  handleIsChecked(handler: () => boolean): CheckboxBuilder {
    this.getIsChecked = handler
    return this
  }

  withDisabled(disabled: boolean): CheckboxBuilder {
    this.disabled = disabled
    return this
  }

  build(): Checkbox {
    if (!this.onValueChanged) {
      throw Error('CheckboxBuilder not provided onValueChanged() function')
    }

    const notChecked = () => false

    return {
      content: this.content,
      onValueChanged: this.onValueChanged,
      getIsChecked: this.getIsChecked ?? notChecked,
      disabled: this.disabled,
      __cm_type_tag: 'checkbox',
    }
  }
}

export type CtxMenuElement = Element
