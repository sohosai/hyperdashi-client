import { useState } from 'react'
import { Button, Chip, Autocomplete, AutocompleteItem, Tooltip } from '@heroui/react'
import { Plus, X, Tag as TagIcon } from 'lucide-react'
import { useTags, useCreateTag } from '@/hooks/useTags'
import { Tag } from '@/types'

interface TagInputProps {
    label?: string
    placeholder?: string
    selectedTags: Tag[]
    onChange: (tags: Tag[]) => void
    maxItems?: number
    isReadOnly?: boolean
    description?: string
}

const PRESET_COLORS = [
    '#EF4444', // red
    '#F97316', // orange
    '#F59E0B', // amber
    '#10B981', // emerald
    '#06B6D4', // cyan
    '#3B82F6', // blue
    '#6366F1', // indigo
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#64748B', // slate
]

export function TagInput({
    label = 'タグ',
    placeholder = 'タグ名を入力...',
    selectedTags,
    onChange,
    maxItems = 10,
    isReadOnly = false,
    description
}: TagInputProps) {
    const [inputValue, setInputValue] = useState('')

    // Fetch tags from master
    const { data: tagsData, isLoading } = useTags({ per_page: 100 })
    const createTag = useCreateTag()

    const allTags = tagsData?.data || []
    const existingTagNames = allTags.map(t => t.name)

    const addTag = (tag: Tag) => {
        if (selectedTags.some(t => t.id === tag.id)) return
        if (selectedTags.length >= maxItems) return
        onChange([...selectedTags, tag])
        setInputValue('')
    }

    const removeTag = (tagId: number) => {
        onChange(selectedTags.filter(t => t.id !== tagId))
    }

    const handleSelectionChange = (key: React.Key | null) => {
        if (!key) return

        const selectedId = Number(key)
        const tag = allTags.find(t => t.id === selectedId)
        if (tag) {
            addTag(tag)
            // Autocomplete selection resets input value, but we might want to manually clear it if needed
            // setInputValue('') 
        }
    }

    const handleAddAndRegister = async () => {
        if (!inputValue.trim()) return

        const trimmedName = inputValue.trim()

        // Check if tag already exists in master (case insensitive check usually handled by backend, but here simple check)
        const existingTag = allTags.find(t => t.name.toLowerCase() === trimmedName.toLowerCase())
        if (existingTag) {
            addTag(existingTag)
            return
        }

        // Create new tag with random color
        const randomColor = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]

        try {
            const newTag = await createTag.mutateAsync({
                name: trimmedName,
                color: randomColor
            })
            addTag(newTag)
        } catch (error) {
            console.error('Failed to create tag:', error)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            const existingTag = allTags.find(t => t.name === inputValue)
            if (existingTag) {
                addTag(existingTag)
            } else {
                handleAddAndRegister()
            }
        }
    }

    // Filter suggestions: exclude already selected tags and filter by input
    const filteredSuggestions = allTags.filter(tag =>
        !selectedTags.some(selected => selected.id === tag.id) &&
        tag.name.toLowerCase().includes(inputValue.toLowerCase())
    )

    const isNewTag = inputValue.trim() && !existingTagNames.includes(inputValue.trim()) && !selectedTags.some(t => t.name === inputValue.trim())

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
                <TagIcon size={14} className="text-primary" />
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
                    startContent={<TagIcon size={14} className="text-default-400" />}
                >
                    {filteredSuggestions.map((tag) => (
                        <AutocompleteItem key={tag.id} textValue={tag.name}>
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: tag.color || '#ccc' }}
                                />
                                {tag.name}
                            </div>
                        </AutocompleteItem>
                    ))}
                </Autocomplete>

                {isNewTag ? (
                    <Tooltip content="新しいタグとして登録して追加">
                        <Button
                            color="success"
                            variant="flat"
                            onPress={handleAddAndRegister}
                            isDisabled={isReadOnly || selectedTags.length >= maxItems}
                            isLoading={createTag.isPending}
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
                        isDisabled={true} // Add button is only for new tags, selection handles existing
                        className="opacity-50"
                    >
                        <Plus size={16} />
                    </Button>
                )}
            </div>

            {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                        <Chip
                            key={tag.id}
                            variant="flat"
                            startContent={<TagIcon size={12} />}
                            style={{
                                backgroundColor: tag.color ? `${tag.color}20` : undefined, // 20 for transparency
                                color: tag.color,
                                borderColor: tag.color
                            }}
                            className="border-1"
                            endContent={!isReadOnly ? (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        removeTag(tag.id)
                                    }}
                                    className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                                >
                                    <X size={12} />
                                </button>
                            ) : undefined}
                        >
                            {tag.name}
                        </Chip>
                    ))}
                </div>
            )}

            <p className="text-xs text-default-500">
                {selectedTags.length}/{maxItems} タグ • 入力してEnterで作成または選択
            </p>
        </div>
    )
}
