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
  /** 表示をエラー状態にする */
  isInvalid?: boolean
  /** エラーメッセージ */
  errorMessage?: string
  /** 必須入力フラグ */
  isRequired?: boolean
  /** サイズ指定 */
  size?: 'sm' | 'md' | 'lg'
  /** 入力不可状態 */
  isDisabled?: boolean
}

export const SingleLocationInput: React.FC<SingleLocationInputProps> = ({
  label,
  placeholder,
  value,
  onChange,
  suggestions = [],
  isReadOnly = false,
  description,
  isInvalid = false,
  errorMessage,
  isRequired = false,
  size = 'md',
  isDisabled = false,
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
      isInvalid={isInvalid}
      errorMessage={errorMessage}
      isRequired={isRequired}
      size={size}
      isDisabled={isDisabled}
      defaultItems={suggestions.map(s => ({ value: s, label: s }))}
    >
      {(item) => <AutocompleteItem key={item.value}>{item.label}</AutocompleteItem>}
    </Autocomplete>
  )
}