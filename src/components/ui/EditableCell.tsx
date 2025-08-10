import { useState, useEffect } from 'react'
import { Input } from '@heroui/react'

interface EditableCellProps {
  value: string;
  onSave: (value: string) => void;
  children: React.ReactNode;
}

export function EditableCell({ value, onSave, children }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [currentValue, setCurrentValue] = useState(value)

  useEffect(() => {
    setCurrentValue(value)
  }, [value])

  const handleDoubleClick = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    if (currentValue !== value) {
      onSave(currentValue)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setCurrentValue(value)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <Input
        autoFocus
        aria-label="Editable cell"
        value={currentValue}
        onValueChange={setCurrentValue}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        size="sm"
        className="w-full"
      />
    )
  }

  return (
    <div onDoubleClick={handleDoubleClick} className="cursor-pointer w-full h-full p-2 -m-2">
      {children}
    </div>
  )
}