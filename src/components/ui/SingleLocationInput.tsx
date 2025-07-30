import React, { useState } from 'react'
import { Autocomplete, AutocompleteItem } from '@heroui/react'

interface SingleLocationInputProps {
  label: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  suggestions?: string[]
  isReadOnly?: boolean
  description?: string
}

export const SingleLocationInput: React.FC<SingleLocationInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  suggestions = [],
  isReadOnly = false,
  description,
}) => {
  const [inputValue, setInputValue] = useState(value || '')

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)
    onChange(newValue)
  }

  const handleSelectionChange = (key: React.Key | null) => {
    if (key) {
      const selectedValue = key.toString()
      setInputValue(selectedValue)
      onChange(selectedValue)
    }
  }

  return (
    <Autocomplete
      label={label}
      placeholder={placeholder}
      value={value}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onSelectionChange={handleSelectionChange}
      description={description}
      isReadOnly={isReadOnly}
      allowsCustomValue
      className="w-full"
      variant="bordered"
      defaultItems={suggestions.map(s => ({ value: s, label: s }))}
    >
      {(item) => <AutocompleteItem key={item.value}>{item.label}</AutocompleteItem>}
    </Autocomplete>
  )
}