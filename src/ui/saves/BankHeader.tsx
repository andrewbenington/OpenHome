import { EditIcon } from '@openhome-ui/components/Icons'
import ToggleButton from '@openhome-ui/components/ToggleButton'
import { useSaves } from '@openhome-ui/state/saves'
import { Button, Card, DataList, DropdownMenu, Flex, Heading, TextField } from '@radix-ui/themes'
import { useState } from 'react'

export default function BankHeader() {
  const savesAndBanks = useSaves()
  const [editing, setEditing] = useState(false)
  const [bankNameEditValue, setBankNameEditValue] = useState('')

  const homeData = savesAndBanks.homeData

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
          placeholder={homeData.getCurrentBankName()}
          onChange={(e) => setBankNameEditValue(e.target.value ?? undefined)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              savesAndBanks.setCurrentBankName(bankNameEditValue)
              setEditing(false)
            } else if (e.key === 'Escape') {
              setEditing(false)
            }
          }}
          autoFocus
        />
      ) : (
        <Heading size="5">{homeData.getCurrentBankName()}</Heading>
      )}

      <Flex direction="row-reverse" flexGrow="1" width="0" gap="1">
        <ToggleButton
          state={editing}
          setState={setEditing}
          onSet={() => setBankNameEditValue(homeData.getCurrentBankName())}
          onUnset={() => savesAndBanks.setCurrentBankName(bankNameEditValue)}
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
  const savesAndBanks = useSaves()
  const [newBankName, setNewBankName] = useState<string>()
  const [newBankBoxCount, setNewBankBoxCount] = useState('30')
  const [isOpen, setIsOpen] = useState(false)

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger disabled={disabled}>
        <Button variant="soft" size="1">
          Switch Bank
          <DropdownMenu.TriggerIcon />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {savesAndBanks.homeData.banks.map((bank) => (
          <DropdownMenu.Item
            key={bank.index}
            onClick={() => savesAndBanks.switchToBank(bank.index)}
          >
            {bank.nameOrDefault()}
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
                    placeholder={`Bank ${savesAndBanks.homeData.banks.length + 1}`}
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
                savesAndBanks.addBank(newBankName, parseInt(newBankBoxCount))
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
