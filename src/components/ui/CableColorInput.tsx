import { useState, useEffect } from 'react'
import { Button, Chip, Select, SelectItem, Alert } from '@heroui/react'
import { Plus, X, AlertTriangle, Shuffle } from 'lucide-react'
import { useCableColors } from '@/hooks'
import { useItems } from '@/hooks'

interface CableColorInputProps {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  maxItems?: number
  connectionNames?: string[] // Required for conflict detection
  currentItemId?: string // To exclude current item from conflict check
}

export function CableColorInput({ 
  label, 
  values, 
  onChange, 
  maxItems = 10,
  connectionNames = [],
  currentItemId
}: CableColorInputProps) {
  const [selectedColorId, setSelectedColorId] = useState<string>('')
  const [conflictItems, setConflictItems] = useState<any[]>([])
  
  const { data: cableColorsData } = useCableColors()
  const { data: itemsData } = useItems({ per_page: 1000 }) // Get all items for conflict detection
  
  const cableColors = cableColorsData?.data || []
  const allItems = itemsData?.data || []
  
  const addColor = () => {
    if (selectedColorId && values.length < maxItems) {
      const selectedColor = cableColors.find(color => color.id.toString() === selectedColorId)
      if (selectedColor) {
        onChange([...values, selectedColor.name])
        setSelectedColorId('')
      }
    }
  }

  const removeColor = (index: number) => {
    const newValues = values.filter((_, i) => i !== index)
    onChange(newValues)
  }

  // Check for color combination conflicts
  useEffect(() => {
    if (values.length === 0 || connectionNames.length === 0) {
      setConflictItems([])
      return
    }

    const conflicts = allItems.filter(item => {
      // Skip current item being edited
      if (currentItemId && item.id === currentItemId) return false
      
      // Check if connections match (order-independent)
      const itemConnections = item.connection_names || []
      const sortedItemConnections = [...itemConnections].sort()
      const sortedConnectionNames = [...connectionNames].sort()
      
      const hasMatchingConnections = 
        sortedItemConnections.length === sortedConnectionNames.length &&
        sortedItemConnections.every((conn, index) => conn === sortedConnectionNames[index])
      
      if (!hasMatchingConnections) return false
      
      // Check if color pattern matches exactly (order-dependent)
      const itemColors = item.cable_color_pattern || []
      if (itemColors.length !== values.length) return false
      
      return itemColors.every((color, index) => color === values[index])
    })
    
    setConflictItems(conflicts)
  }, [values, connectionNames, allItems, currentItemId])

  // Generate random color combination
  const generateRandomColors = () => {
    if (cableColors.length < 3) return
    
    const availableColors = cableColors.filter(color => 
      !['pink', 'skyblue'].includes(color.name.toLowerCase())
    )
    
    if (availableColors.length < 3) return
    
    // Try to find non-conflicting combination
    let attempts = 0
    const maxAttempts = 50
    
    while (attempts < maxAttempts) {
      const shuffled = [...availableColors].sort(() => Math.random() - 0.5)
      const selectedColors = shuffled.slice(0, 3).map(c => c.name)
      
      // Check if this combination conflicts
      const wouldConflict = allItems.some(item => {
        if (currentItemId && item.id === currentItemId) return false
        
        const itemConnections = item.connection_names || []
        const sortedItemConnections = [...itemConnections].sort()
        const sortedConnectionNames = [...connectionNames].sort()
        
        const hasMatchingConnections = 
          sortedItemConnections.length === sortedConnectionNames.length &&
          sortedItemConnections.every((conn, index) => conn === sortedConnectionNames[index])
        
        if (!hasMatchingConnections) return false
        
        const itemColors = item.cable_color_pattern || []
        if (itemColors.length !== selectedColors.length) return false
        
        // Color pattern must match exactly (order-dependent)
        return itemColors.every((color, index) => color === selectedColors[index])
      })
      
      if (!wouldConflict) {
        onChange(selectedColors)
        return
      }
      
      attempts++
    }
    
    // If no non-conflicting combination found, just use random colors
    const shuffled = [...availableColors].sort(() => Math.random() - 0.5)
    const selectedColors = shuffled.slice(0, 3).map(c => c.name)
    onChange(selectedColors)
  }

  // Fallback colors when data is not available
  const fallbackColors: Record<string, string> = {
    '赤': '#FF0000',
    '青': '#0000FF',
    '緑': '#008000',
    '黄': '#FFFF00',
    '白': '#FFFFFF',
    '黒': '#000000',
    'オレンジ': '#FFA500',
    '紫': '#800080',
    '茶': '#A52A2A',
    'ピンク': '#FFC0CB',
    'グレー': '#808080',
    '水色': '#87CEEB'
  }

  // Get color hex code by name
  const getColorHex = (colorName: string) => {
    // First try to find in loaded cable colors data
    const color = cableColors.find(c => c.name === colorName)
    if (color?.hex_code) {
      return color.hex_code
    }
    
    // Fallback to predefined colors
    const fallbackColor = fallbackColors[colorName]
    if (fallbackColor) {
      return fallbackColor
    }
    
    // Last resort: generate a hash-based color from the name
    let hash = 0
    for (let i = 0; i < colorName.length; i++) {
      hash = colorName.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 70%, 50%)`
  }

  // All colors are available for selection
  const availableColors = cableColors

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <Button
          size="sm"
          variant="flat"
          color="secondary"
          startContent={<Shuffle size={14} />}
          onPress={generateRandomColors}
          isDisabled={cableColors.length < 3}
        >
          ランダム3色
        </Button>
      </div>
      
      {/* Conflict Warning */}
      {conflictItems.length > 0 && (
        <Alert
          color="warning"
          variant="flat"
          startContent={<AlertTriangle size={16} />}
          title="色の組み合わせが重複しています"
          description={
            <div className="mt-1">
              <p className="text-sm">
                同じ端子の組み合わせで既に使用されている色パターンです:
              </p>
              <ul className="mt-1 text-sm">
                {conflictItems.slice(0, 3).map((item, index) => (
                  <li key={index} className="text-gray-600">
                    • {item.name} ({item.label_id})
                  </li>
                ))}
                {conflictItems.length > 3 && (
                  <li className="text-gray-600">他 {conflictItems.length - 3} 件</li>
                )}
              </ul>
            </div>
          }
        />
      )}
      
      <div className="flex gap-2">
        <Select
          placeholder="色を選択してください"
          selectedKeys={selectedColorId ? [selectedColorId] : []}
          onSelectionChange={(keys) => {
            const key = Array.from(keys)[0] as string
            setSelectedColorId(key || '')
          }}
          className="flex-1"
          renderValue={(items) => {
            const item = items[0]
            if (!item) return null
            const color = cableColors.find(c => c.id.toString() === item.key)
            return (
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded border border-gray-300"
                  style={{ backgroundColor: color?.hex_code }}
                />
                <span>{color?.name}</span>
              </div>
            )
          }}
        >
          {availableColors.map((color) => (
            <SelectItem 
              key={color.id} 
              startContent={
                <div 
                  className="w-4 h-4 rounded border border-gray-300"
                  style={{ backgroundColor: color.hex_code }}
                />
              }
            >
              {color.name}
            </SelectItem>
          ))}
        </Select>
        <Button
          isIconOnly
          color="primary"
          variant="flat"
          onPress={addColor}
          isDisabled={!selectedColorId || values.length >= maxItems}
        >
          <Plus size={16} />
        </Button>
      </div>

      {values.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-gray-600">選択された色の順序（左:端子側 → 右:ケーブル側）:</div>
          <div className="flex flex-wrap gap-2">
            {values.map((colorName, index) => (
              <Chip
                key={index}
                variant="flat"
                color="primary"
                startContent={
                  <div 
                    className="w-3 h-3 rounded border border-gray-300"
                    style={{ backgroundColor: getColorHex(colorName) }}
                  />
                }
                endContent={
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      removeColor(index)
                    }}
                    className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                  >
                    <X size={10} />
                  </button>
                }
              >
                {index + 1}. {colorName}
              </Chip>
            ))}
          </div>
        </div>
      )}
      
      <p className="text-xs text-gray-500">
        {values.length}/{maxItems} 色選択済み
      </p>
    </div>
  )
}