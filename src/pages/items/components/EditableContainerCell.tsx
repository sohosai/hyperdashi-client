import { useState, useEffect } from 'react'
import { Select, SelectItem } from '@heroui/react'
import { Container } from '@/types'

// EditableContainerCell for selecting containers with double-click
export function EditableContainerCell({
    value,
    onSave,
    containers,
    children,
}: {
    value: string
    onSave: (value: string) => void
    containers: Container[]
    children: React.ReactNode
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [currentValue, setCurrentValue] = useState(value)

    useEffect(() => {
        setCurrentValue(value)
    }, [value])

    const handleDoubleClick = () => setIsEditing(true)

    if (isEditing) {
        return (
            <Select
                autoFocus
                aria-label="コンテナ選択"
                placeholder="コンテナを選択"
                selectedKeys={currentValue ? new Set([currentValue]) : new Set()}
                onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string
                    const newValue = selectedKey || ''
                    setCurrentValue(newValue)
                    // 選択時に即座に保存
                    if (newValue !== value) {
                        onSave(newValue)
                    }
                    setIsEditing(false)
                }}
                size="sm"
                className="min-w-[160px]"
                onClose={() => {
                    // 何も選択せずに閉じた場合は編集モードを解除
                    setIsEditing(false)
                    setCurrentValue(value)
                }}
            >
                {[
                    <SelectItem key="" textValue="なし">なし</SelectItem>,
                    ...containers.map((container: Container) => {
                        const displayText = `${container.name} - ${container.location}`
                        return (
                            <SelectItem key={container.id} textValue={displayText}>
                                {container.name} - <span className="text-default-500">{container.location}</span>
                            </SelectItem>
                        )
                    })
                ]}
            </Select>
        )
    }

    return (
        <div onDoubleClick={handleDoubleClick} className="cursor-pointer w-full h-full p-2 -m-2">
            {children}
        </div>
    )
}
