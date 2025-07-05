import { useState } from 'react'
import { Button, Chip, Select, SelectItem } from '@heroui/react'
import { Plus, X } from 'lucide-react'
import { useCableColors } from '@/hooks'

interface CableColorInputProps {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  maxItems?: number
}

export function CableColorInput({ 
  label, 
  values, 
  onChange, 
  maxItems = 10 
}: CableColorInputProps) {
  const [selectedColorId, setSelectedColorId] = useState<string>('')
  const { data: cableColorsData } = useCableColors()
  
  const cableColors = cableColorsData?.data || []
  
  const addColor = () => {
    if (selectedColorId && values.length < maxItems) {
      const selectedColor = cableColors.find(color => color.id.toString() === selectedColorId)
      if (selectedColor && !values.includes(selectedColor.name)) {
        onChange([...values, selectedColor.name])
        setSelectedColorId('')
      }
    }
  }

  const removeColor = (index: number) => {
    const newValues = values.filter((_, i) => i !== index)
    onChange(newValues)
  }

  // Get color hex code by name
  const getColorHex = (colorName: string) => {
    const color = cableColors.find(c => c.name === colorName)
    return color?.hex_code || '#000000'
  }

  // Get available colors (not already selected)
  const availableColors = cableColors.filter(color => 
    !values.includes(color.name)
  )

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">{label}</label>
      
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
                    onClick={() => removeColor(index)}
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