import { useState } from 'react'
import { Button, Chip, Autocomplete, AutocompleteItem } from '@heroui/react'
import { Plus, X } from 'lucide-react'

interface ArrayInputProps {
  label: string
  placeholder?: string
  values: string[]
  onChange: (values: string[]) => void
  maxItems?: number
  suggestions?: string[]
}

export function ArrayInput({ 
  label, 
  placeholder = '', 
  values, 
  onChange, 
  maxItems = 10,
  suggestions = []
}: ArrayInputProps) {
  const [inputValue, setInputValue] = useState('')

  const addItem = () => {
    if (inputValue.trim() && !values.includes(inputValue.trim()) && values.length < maxItems) {
      onChange([...values, inputValue.trim()])
      setInputValue('')
    }
  }

  const removeItem = (index: number) => {
    const newValues = values.filter((_, i) => i !== index)
    onChange(newValues)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addItem()
    }
  }

  const handleSelectionChange = (key: React.Key | null) => {
    if (key && typeof key === 'string') {
      setInputValue(key)
    }
  }

  // Filter suggestions that aren't already in values
  const availableSuggestions = suggestions.filter(suggestion => 
    !values.includes(suggestion)
  )

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      
      <div className="flex gap-2">
        <Autocomplete
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSelectionChange={handleSelectionChange}
          placeholder={placeholder}
          onKeyDown={handleKeyPress}
          className="flex-1"
          allowsCustomValue
          menuTrigger="input"
        >
          {availableSuggestions.map((suggestion) => (
            <AutocompleteItem key={suggestion}>
              {suggestion}
            </AutocompleteItem>
          ))}
        </Autocomplete>
        <Button
          isIconOnly
          color="primary"
          variant="flat"
          onPress={addItem}
          isDisabled={!inputValue.trim() || values.includes(inputValue.trim()) || values.length >= maxItems}
        >
          <Plus size={16} />
        </Button>
      </div>

      {values.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {values.map((value, index) => (
            <Chip
              key={index}
              variant="flat"
              color="primary"
              endContent={
                <button
                  onClick={() => removeItem(index)}
                  className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              }
            >
              {value}
            </Chip>
          ))}
        </div>
      )}
      
      <p className="text-xs text-gray-500">
        {values.length}/{maxItems} 項目 • Enterで追加
      </p>
    </div>
  )
}