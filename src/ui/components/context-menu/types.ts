import { PKMInterface } from '@openhome-core/pkm/interfaces'
import { Option } from '@openhome-core/util/functional'
import React, { ReactNode } from 'react'
import PokemonIcon from '../PokemonIcon'

export type Element = ItemData | Separator | LabelData | SubmenuData | CheckboxData

type SingleElementBuilder = () => Element

type MultiElementBuilder = () => Element[]

export interface CtxMenuElementBuilder {
  build: SingleElementBuilder | MultiElementBuilder
}

export type CtxMenuSectionBuilders = Option<CtxMenuElementBuilder>[]

function buildElements(builder: CtxMenuElementBuilder): Element[] {
  const result = builder.build()
  return Array.isArray(result) ? result : [result]
}

type NoTag<T> = Omit<T, '__cm_type_tag'>

//* ITEM *//

type ItemData = {
  content: ElementContent
  action?: () => void
  disabled: boolean
  __cm_type_tag: 'item'
}

export class Item implements CtxMenuElementBuilder {
  content: ElementContent
  #action?: () => void
  #disabled: boolean = true

  private constructor(content: ElementContent) {
    this.content = content
  }

  static label(label: string): Item {
    return new Item({ label })
  }

  static component(component: ReactNode): Item {
    return new Item({ component })
  }

  action(action?: () => void): Item {
    this.#action = action
    return this
  }

  disabled(disabled: boolean): Item {
    this.#disabled = disabled
    return this
  }

  build(): ItemData {
    return {
      content: this.content,
      action: this.#action,
      disabled: this.#action === undefined,
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

type LabelData = {
  content: ElementContent
  __cm_type_tag: 'label'
}

export class Label implements CtxMenuElementBuilder {
  data: NoTag<LabelData>

  private constructor(content: ElementContent) {
    this.data = { content }
  }

  static label(label: string): Label {
    return new Label({ label })
  }

  static component(component: ReactNode): Label {
    return new Label({ component })
  }

  static mon(mon: PKMInterface): Label {
    return Label.component(
      React.createElement(
        React.Fragment,
        null,
        React.createElement(PokemonIcon, {
          dexNumber: mon.dexNum,
          formeNumber: mon.formNum,
          style: { width: '1.5rem', height: '1.5rem', marginRight: '0.25rem' },
        }),
        mon.nickname
      )
    )
  }

  build(): Element[] {
    return [{ ...this.data, __cm_type_tag: 'label' }, SeparatorData]
  }
}

//* SEPARATOR *//

export const SeparatorData = Object.freeze({ __cm_type_tag: 'separator' })

type Separator = typeof SeparatorData

export const Separator = Object.freeze({
  build() {
    return SeparatorData
  },
})

//* SUBMENU *//

type SubmenuData = {
  content: ElementContent
  items: Element[]
  disabled: boolean
  __cm_type_tag: 'submenu'
}

export class Submenu implements CtxMenuElementBuilder {
  content: ElementContent
  builders: CtxMenuElementBuilder[] = []
  #disabled: boolean = true

  private constructor(content: ElementContent) {
    this.content = content
  }

  static label(label: string): Submenu {
    return new Submenu({ label })
  }

  static component(component: ReactNode): Submenu {
    return new Submenu({ component })
  }

  with(...builders: CtxMenuElementBuilder[]): Submenu {
    this.builders.push(...builders)
    return this
  }

  disabled(disabled: boolean): Submenu {
    this.#disabled = disabled
    return this
  }

  build(): SubmenuData {
    return {
      content: this.content,
      items: this.builders.flatMap(buildElements),
      disabled: this.#disabled,
      __cm_type_tag: 'submenu',
    }
  }
}

//* CHECKBOX *//

type CheckboxData = {
  content: ElementContent
  onValueChanged: () => void
  getIsChecked: () => CheckedState
  disabled: boolean
  __cm_type_tag: 'checkbox'
}

type CheckedState = boolean | 'indeterminate'

export class Checkbox implements CtxMenuElementBuilder {
  content: CheckboxData['content']
  onValueChanged: Option<CheckboxData['onValueChanged']>
  getIsChecked: Option<CheckboxData['getIsChecked']>
  #disabled: CheckboxData['disabled'] = true

  private constructor(content: ElementContent) {
    this.content = content
  }

  static label(label: string): Checkbox {
    return new Checkbox({ label })
  }

  static component(component: ReactNode): Checkbox {
    return new Checkbox({ component })
  }

  handleValueChanged(handler: Checkbox['onValueChanged']): Checkbox {
    this.onValueChanged = handler
    return this
  }

  handleIsChecked(handler: Checkbox['getIsChecked']): Checkbox {
    this.getIsChecked = handler
    return this
  }

  disabled(disabled: boolean): Checkbox {
    this.#disabled = disabled
    return this
  }

  build(): CheckboxData {
    if (!this.onValueChanged) {
      throw Error('CheckboxBuilder not provided onValueChanged() function')
    }

    const notChecked = () => false

    return {
      content: this.content,
      onValueChanged: this.onValueChanged,
      getIsChecked: this.getIsChecked ?? notChecked,
      disabled: this.#disabled,
      __cm_type_tag: 'checkbox',
    }
  }
}

export type CtxMenuElement = Element
