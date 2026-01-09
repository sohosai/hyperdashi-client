import { useState } from 'react'
import { Input, Button } from '@heroui/react'
import { Plus } from 'lucide-react'

// アイテム用インライン作成コンポーネント
export function ItemInlineCreator({ onSave }: {
    onSave: (value: { name: string; label_id: string }) => Promise<void>
}) {
    const [isCreating, setIsCreating] = useState(false)
    const [name, setName] = useState('')
    const [labelId, setLabelId] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        if (name.trim() && labelId.trim()) {
            setIsSaving(true)
            await onSave({
                name: name.trim(),
                label_id: labelId.trim(),
            })
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
                    placeholder="名称"
                    value={name}
                    onValueChange={setName}
                    onKeyDown={handleKeyDown}
                    size="sm"
                    className="flex-grow"
                    disabled={isSaving}
                />
                <Input
                    aria-label="Label ID"
                    placeholder="ラベルID"
                    value={labelId}
                    onValueChange={setLabelId}
                    onKeyDown={handleKeyDown}
                    size="sm"
                    className="w-40"
                    disabled={isSaving}
                />
                <Button
                    size="sm"
                    color="primary"
                    onPress={handleSave}
                    isLoading={isSaving}
                    disabled={!name.trim() || !labelId.trim()}
                >
                    保存
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
            新規備品作成...
        </Button>
    )
}
