import { useState } from 'react'
import { Button, Input } from '@heroui/react'
import { Plus } from 'lucide-react'

interface InlineCreatorRowProps {
  onSave: (value: { name: string; label_id: string }) => Promise<void>;
  placeholder?: string;
}

export function InlineCreatorRow({
  onSave,
  placeholder = "Create a new item...",
}: InlineCreatorRowProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [name, setName] = useState('')
  const [labelId, setLabelId] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (name.trim() && labelId.trim()) {
      setIsSaving(true)
      await onSave({ name: name.trim(), label_id: labelId.trim() })
      setIsSaving(false)
      setName('')
      setLabelId('')
      setIsCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setName('')
      setLabelId('')
      setIsCreating(false)
    }
  }

  if (isCreating) {
    return (
      <div className="flex gap-2 p-2">
        <Input
          autoFocus
          aria-label="New item name"
          placeholder="Name"
          value={name}
          onValueChange={setName}
          onKeyDown={handleKeyDown}
          size="sm"
          className="flex-grow"
          disabled={isSaving}
        />
        <Input
          aria-label="Label ID"
          placeholder="Label ID"
          value={labelId}
          onValueChange={setLabelId}
          onKeyDown={handleKeyDown}
          size="sm"
          className="flex-grow"
          disabled={isSaving}
        />
        <Button
          size="sm"
          color="primary"
          onPress={handleSave}
          isLoading={isSaving}
          disabled={!name.trim() || !labelId.trim()}
        >
          Save
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="light"
      color="default"
      className="w-full justify-start p-2"
      startContent={<Plus size={16} />}
      onPress={() => setIsCreating(true)}
    >
      {placeholder}
    </Button>
  )
}