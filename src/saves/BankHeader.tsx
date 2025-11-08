import { Button, Card, DataList, DropdownMenu, Flex, Heading, TextField } from '@radix-ui/themes'
import { useState } from 'react'
import { EditIcon } from 'src/components/Icons'
import { getBankName } from 'src/types/storage'
import ToggleButton from '../components/ToggleButton'
import { useOhpkmStore } from '../state/ohpkm/useOhpkmStore'
import { useSaves } from '../state/saves/useSaves'

export default function BankHeader() {
  const [openSavesState, openSavesDispatch] = useSaves()
  const [editing, setEditing] = useState(false)
  const [bankNameEditValue, setBankNameEditValue] = useState('')

  const homeData = openSavesState.homeData

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
              openSavesDispatch({
                type: 'set_home_bank_name',
                payload: { bank: homeData.currentBankIndex, name: bankNameEditValue },
              })
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
          onUnset={() =>
            openSavesDispatch({
              type: 'set_home_bank_name',
              payload: { bank: homeData.currentBankIndex, name: bankNameEditValue },
            })
          }
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
  const [{ homeData }, openSavesDispatch] = useSaves()
  const ohpkmStore = useOhpkmStore()
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
        {homeData.banks.map((bank) => (
          <DropdownMenu.Item
            key={bank.index}
            onClick={() =>
              openSavesDispatch({
                type: 'set_current_home_bank',
                payload: { bank: bank.index, getMonById: ohpkmStore.getById },
              })
            }
          >
            {getBankName(bank)}
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
                    placeholder={`Bank ${homeData.banks.length + 1}`}
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
                openSavesDispatch({
                  type: 'add_home_bank',
                  payload: {
                    name: newBankName,
                    boxCount: parseInt(newBankBoxCount),
                    currentCount: homeData.banks.length ?? 0,
                    switchToBank: true,
                    getMonById: ohpkmStore.getById,
                  },
                })

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
