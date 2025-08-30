import { Button, DataList, DropdownMenu, Spinner, TextField } from '@radix-ui/themes'
import { useContext, useState } from 'react'
import { OpenSavesContext } from 'src/state/openSaves'
import { PersistedPkmDataContext } from 'src/state/persistedPkmData'
import { HomeData } from 'src/types/SAVTypes/HomeData'
import { getBankName } from 'src/types/storage'

const nonDigitsRE = /[^0-9]/g

function removeNonDigits(input: string): string {
  return input.replaceAll(nonDigitsRE, '')
}

export default function BankSelector(props: { homeData: HomeData }) {
  const { homeData } = props
  const [openSavesState, openSavesDispatch] = useContext(OpenSavesContext)
  const [pkmDataState] = useContext(PersistedPkmDataContext)
  const [newBankName, setNewBankName] = useState<string>()
  const [newBankBoxCount, setNewBankBoxCount] = useState('30')
  const [isOpen, setIsOpen] = useState(false)

  if (!pkmDataState.homeMons) {
    return <Spinner />
  }

  const monLookup = pkmDataState.homeMons

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger>
        <Button variant="soft" size="1">
          {openSavesState.homeData && getBankName(openSavesState.homeData.getCurrentBank())}
          <DropdownMenu.TriggerIcon />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {homeData.banks.map((bank) => (
          <DropdownMenu.Item
            key={bank.index}
            onClick={() =>
              openSavesDispatch({
                type: 'set_home_bank',
                payload: { bank: bank.index, monLookup },
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
                    placeholder={`Bank ${homeData.banks.length + 2}`}
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
                if (!pkmDataState.homeMons) return
                openSavesDispatch({
                  type: 'add_home_bank',
                  payload: {
                    name: newBankName,
                    box_count: parseInt(newBankBoxCount),
                    current_count: homeData.banks.length ?? 0,
                    switch_to_bank: true,
                    home_lookup: pkmDataState.homeMons,
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
