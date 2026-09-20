import { useState } from 'react'
import { Button, Chip, Autocomplete, AutocompleteItem, Tooltip } from '@heroui/react'
import { Plus, X, Plug } from 'lucide-react'
import { useAllConnectors, useCreateConnector } from '@/hooks/useConnectors'

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
    const { data: connectorsData, isLoading } = useAllConnectors()
    const createConnector = useCreateConnector()

    const connectors = connectorsData?.data || []
    const normalizeConnectorName = (value: string) => value.trim().toLocaleLowerCase('ja-JP')
    const connectorOptions = connectors.map(connector => ({
        connector,
        label: connector.name,
    }))
    const connectorNameSet = new Set(connectorOptions.map(option => normalizeConnectorName(option.label)))

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
        if (key && values.length < maxItems) {
            const selectedOption = connectorOptions.find(
                option => String(option.connector.id) === String(key)
            )
            const selectedValue = selectedOption?.label || String(key)

            if (values.includes(selectedValue)) return

            onChange([...values, selectedValue])
            // Autocompleteが選択名を入力欄へ反映した後で確実に空へ戻す
            window.setTimeout(() => setInputValue(''), 0)
        }
    }

    const handleAddAndRegister = async () => {
        if (!inputValue.trim() || values.length >= maxItems) return

        const trimmedValue = inputValue.trim()

        // Check if it's a new connector (not in master)
        if (!connectorNameSet.has(normalizeConnectorName(trimmedValue))) {
            try {
                await createConnector.mutateAsync({ name: trimmedValue })
            } catch (error) {
                console.error('Failed to register connector:', error)
            }
        }

        // Add to values
        if (!values.includes(trimmedValue)) {
            onChange([...values, trimmedValue])
        }
        setInputValue('')
    }

    // Filter suggestions based on input
    const filteredSuggestions = connectorOptions.filter(option =>
        normalizeConnectorName(option.label).includes(normalizeConnectorName(inputValue))
    )

    const isNewConnector = Boolean(
        inputValue.trim() && !connectorNameSet.has(normalizeConnectorName(inputValue))
    )

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
                    menuTrigger="focus"
                    isDisabled={isReadOnly}
                    isLoading={isLoading}
                    startContent={<Plug size={14} className="text-default-400" />}
                >
                    {filteredSuggestions.map(({ connector, label: connectorLabel }) => (
                        <AutocompleteItem key={String(connector.id)} textValue={connectorLabel}>
                            {connectorLabel}
                        </AutocompleteItem>
                    ))}
                </Autocomplete>

                {isNewConnector && (
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
                {values.length}/{maxItems} 端子 • 候補を選ぶとすぐ追加 • 新しい端子はEnterで追加
            </p>
        </div>
    )
}
