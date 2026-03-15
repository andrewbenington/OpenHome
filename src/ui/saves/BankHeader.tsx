import { EditIcon } from '@openhome-ui/components/Icons'
import ToggleButton from '@openhome-ui/components/ToggleButton'
import { Button, Card, DataList, DropdownMenu, Flex, Heading, TextField } from '@radix-ui/themes'
import { useState } from 'react'
import { bankNameOrDefault, useBanksAndBoxes } from '../state-zustand/banks-and-boxes/store'

export default function BankHeader() {
  const [editing, setEditing] = useState(false)
  const [bankNameEditValue, setBankNameEditValue] = useState('')
  const { getCurrentBankName, setCurrentBankName } = useBanksAndBoxes()

  return (
    <Card className="bank-ribbon">
      <div style={{ flexGrow: 1, width: 0 }}>{<BankSelector disabled={editing} />}</div>
      {editing ? (
        <TextField.Root
          size="1"
          value={bankNameEditValue || ''}
          style={{
            minWidth: 0,
            textAlign: 'center',
            fontSize: 18,
            fontFamily: 'var(--default-font-family)',
            fontWeight: 'bold',
          }}
          placeholder={getCurrentBankName()}
          onChange={(e) => setBankNameEditValue(e.target.value ?? undefined)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setCurrentBankName(bankNameEditValue)
              setEditing(false)
            } else if (e.key === 'Escape') {
              setEditing(false)
            }
          }}
          autoFocus
        />
      ) : (
        <Heading size="5">{getCurrentBankName()}</Heading>
      )}

      <Flex direction="row-reverse" flexGrow="1" width="0" gap="1">
        <ToggleButton
          state={editing}
          setState={setEditing}
          onSet={() => setBankNameEditValue(getCurrentBankName())}
          onUnset={() => setCurrentBankName(bankNameEditValue)}
          icon={EditIcon}
          hint="Change bank name"
        />
      </Flex>
    </Card>
  )
}

const nonDigitsRE = /[^0-9]/g

function removeNonDigits(input: string): string {
  return input.replaceAll(nonDigitsRE, '')
}

function BankSelector(props: { disabled?: boolean }) {
  const { disabled } = props
  const [newBankName, setNewBankName] = useState<string>()
  const [newBankBoxCount, setNewBankBoxCount] = useState('30')
  const [isOpen, setIsOpen] = useState(false)
  const { banks, switchToBank, addBank } = useBanksAndBoxes()

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger disabled={disabled}>
        <Button variant="soft" size="1">
          Switch Bank
          <DropdownMenu.TriggerIcon />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {banks.map((bank) => (
          <DropdownMenu.Item key={bank.index} onClick={() => switchToBank(bank.index)}>
            {bankNameOrDefault(bank)}
          </DropdownMenu.Item>
        ))}

        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>Add Bank...</DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            <DataList.Root style={{ gap: 8, padding: 8 }}>
              <DataList.Item align="center">
                <DataList.Label minWidth="80px">Bank Name</DataList.Label>
                <DataList.Value>
                  <TextField.Root
                    size="1"
                    placeholder={`Bank ${banks.length + 1}`}
                    onChange={(e) => setNewBankName(e.target.value || undefined)}
                  />
                </DataList.Value>
              </DataList.Item>
              <DataList.Item>
                <DataList.Label minWidth="80px">Box Count</DataList.Label>
                <DataList.Value>
                  <TextField.Root
                    size="1"
                    value={newBankBoxCount}
                    onChange={(e) => setNewBankBoxCount(removeNonDigits(e.target.value))}
                    autoFocus
                  />
                </DataList.Value>
              </DataList.Item>
            </DataList.Root>
            <Button
              size="1"
              onClick={() => {
                addBank(newBankName, parseInt(newBankBoxCount))
                setIsOpen(false)
              }}
            >
              Ok
            </Button>
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  )
}
