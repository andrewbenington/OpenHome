import { Button, DataList, DropdownMenu, TextField } from '@radix-ui/themes'
import { useContext, useState } from 'react'
import { LookupContext } from 'src/state/lookup'
import { OpenSavesContext } from 'src/state/openSaves'
import { HomeData } from 'src/types/SAVTypes/HomeData'
import { getBankName } from 'src/types/storage'

const nonDigitsRE = /[^0-9]/g

function removeNonDigits(input: string): string {
  return input.replaceAll(nonDigitsRE, '')
}

export default function BankSelector(props: { homeData: HomeData }) {
  const { homeData } = props
  const [, openSavesDispatch] = useContext(OpenSavesContext)
  const [lookupState] = useContext(LookupContext)
  const [newBankName, setNewBankName] = useState<string>()
  const [newBankBoxCount, setNewBankBoxCount] = useState('30')
  const [isOpen, setIsOpen] = useState(false)

  return (
    <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenu.Trigger>
        <Button variant="soft">
          {getBankName(homeData.getCurrentBank())}
          <DropdownMenu.TriggerIcon />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {homeData.banks.map((bank) => (
          <DropdownMenu.Item key={bank.index}>{getBankName(bank)}</DropdownMenu.Item>
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
                  />
                </DataList.Value>
              </DataList.Item>
            </DataList.Root>
            <Button
              size="1"
              onClick={() => {
                if (!lookupState.homeMons) return
                openSavesDispatch({
                  type: 'add_home_bank',
                  payload: {
                    name: newBankName,
                    box_count: parseInt(newBankBoxCount),
                    current_count: homeData.banks.length ?? 0,
                    switch_to_bank: true,
                    home_lookup: lookupState.homeMons,
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
