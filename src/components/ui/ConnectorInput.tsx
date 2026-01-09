import { useState } from 'react'
import { Button, Chip, Autocomplete, AutocompleteItem, Tooltip } from '@heroui/react'
import { Plus, X, Plug } from 'lucide-react'
import { useConnectors, useCreateConnector } from '@/hooks/useConnectors'

interface ConnectorInputProps {
    label: string
    placeholder?: string
    values: string[]
    onChange: (values: string[]) => void
    maxItems?: number
    isReadOnly?: boolean
    description?: string
}

export function ConnectorInput({
    label,
    placeholder = 'コネクタ名を入力...',
    values,
    onChange,
    maxItems = 10,
    isReadOnly = false,
    description
}: ConnectorInputProps) {
    const [inputValue, setInputValue] = useState('')

    // Fetch connectors from master
    const { data: connectorsData, isLoading } = useConnectors({ per_page: 100 })
    const createConnector = useCreateConnector()

    const connectorNames = connectorsData?.data?.map(c => c.name) || []

    const addItem = () => {
        if (inputValue.trim() && values.length < maxItems) {
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

    const handleAddAndRegister = async () => {
        if (!inputValue.trim()) return

        const trimmedValue = inputValue.trim()

        // Check if it's a new connector (not in master)
        if (!connectorNames.includes(trimmedValue)) {
            try {
                await createConnector.mutateAsync({ name: trimmedValue })
            } catch (error) {
                console.error('Failed to register connector:', error)
            }
        }

        // Add to values
        onChange([...values, trimmedValue])
        setInputValue('')
    }

    // Filter suggestions based on input
    const filteredSuggestions = connectorNames.filter(name =>
        name.toLowerCase().includes(inputValue.toLowerCase())
    )

    const isNewConnector = inputValue.trim() && !connectorNames.includes(inputValue.trim())

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
                <Plug size={14} className="text-primary" />
                {label}
            </label>
            {description && (
                <p className="text-xs text-default-500">{description}</p>
            )}

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
                    isDisabled={isReadOnly}
                    isLoading={isLoading}
                    startContent={<Plug size={14} className="text-default-400" />}
                >
                    {filteredSuggestions.map((name) => (
                        <AutocompleteItem key={name}>
                            {name}
                        </AutocompleteItem>
                    ))}
                </Autocomplete>

                {isNewConnector ? (
                    <Tooltip content="新しいコネクタとしてマスターに登録して追加">
                        <Button
                            color="success"
                            variant="flat"
                            onPress={handleAddAndRegister}
                            isDisabled={isReadOnly || values.length >= maxItems}
                            isLoading={createConnector.isPending}
                            className="whitespace-nowrap"
                        >
                            <Plus size={16} />
                            登録
                        </Button>
                    </Tooltip>
                ) : (
                    <Button
                        isIconOnly
                        color="primary"
                        variant="flat"
                        onPress={addItem}
                        isDisabled={isReadOnly || !inputValue.trim() || values.length >= maxItems}
                    >
                        <Plus size={16} />
                    </Button>
                )}
            </div>

            {isNewConnector && (
                <p className="text-xs text-success-600">
                    「{inputValue}」は新しいコネクタです。「登録」ボタンでマスターに追加されます。
                </p>
            )}

            {values.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {values.map((value, index) => (
                        <Chip
                            key={index}
                            variant="flat"
                            color="secondary"
                            startContent={<Plug size={12} />}
                            endContent={!isReadOnly ? (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        removeItem(index)
                                    }}
                                    className="ml-1 hover:bg-red-100 dark:hover:bg-red-900 rounded-full p-0.5"
                                >
                                    <X size={12} />
                                </button>
                            ) : undefined}
                        >
                            {value}
                        </Chip>
                    ))}
                </div>
            )}

            <p className="text-xs text-default-500">
                {values.length}/{maxItems} 端子 • Enterで追加 • マスターから選択可能
            </p>
        </div>
    )
}
