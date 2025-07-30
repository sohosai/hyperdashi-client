import { useCableColors } from '@/hooks'

interface CableVisualizationProps {
  colorNames: string[]
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
}

export function CableVisualization({ 
  colorNames, 
  size = 'md', 
  showLabels = false 
}: CableVisualizationProps) {
  const { data: cableColorsData, isLoading, error } = useCableColors()
  const cableColors = cableColorsData?.data || []

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

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('CableVisualization Debug:', {
      colorNames,
      cableColorsData,
      isLoading,
      error,
      cableColors: cableColors.length,
      sampleColors: colorNames.slice(0, 3).map(name => ({ name, hex: getColorHex(name) }))
    })
  }

  if (!colorNames.length) {
    return (
      <div className="text-xs text-gray-500">
        ケーブル色パターンなし
      </div>
    )
  }

  // Show loading state if data is still loading
  if (isLoading) {
    return (
      <div className="text-xs text-gray-500">
        ケーブル色データを読み込み中...
      </div>
    )
  }

  // Size configurations
  const sizeConfig = {
    sm: {
      height: 'h-2',
      width: 'w-3',
      gap: 'gap-0.5',
      text: 'text-xs',
      connectorl: 'w-2 h-1.5',
      connectorr: 'w-2 h-0.5'
    },
    md: {
      height: 'h-3',
      width: 'w-4',
      gap: 'gap-1',
      text: 'text-xs',
      connectorl: 'w-3 h-1.5',
      connectorr: 'w-3 h-0.5'
    },
    lg: {
      height: 'h-4',
      width: 'w-6',
      gap: 'gap-1',
      text: 'text-sm',
      connectorl: 'w-4 h-1.5',
      connectorr: 'w-4 h-0.5'
    }
  }

  const config = sizeConfig[size]

  return (
    <div className="flex flex-col gap-1">
      {/* Cable visualization */}
      <div className={`flex items-center ${config.gap}`}>
        {/* Left connector (端子) */}
        <div className={`${config.connectorl} bg-gray-400 rounded-sm`} />
        
        {/* Cable segments */}
        {colorNames.map((colorName, index) => (
          <div
            key={index}
            className={`${config.height} ${config.width} border border-gray-300 shadow-sm`}
            style={{ 
              backgroundColor: getColorHex(colorName),
              borderRadius: index === 0 ? '2px 0 0 2px' : 
                            index === colorNames.length - 1 ? '0 2px 2px 0' : '0'
            }}
            title={`${index + 1}. ${colorName}`}
          />
        ))}
        
        {/* Right connector (端子) */}
        <div className={`${config.connectorr} bg-gray-400 rounded-sm`} />
      </div>

      {/* Labels (optional) */}
      {showLabels && (
        <div className={`flex items-center ${config.gap} ${config.text} text-gray-600`}>
          <span className="text-xs">端子側</span>
          {colorNames.map((_, index) => (
            <span key={index} className="text-center" style={{ minWidth: config.width.replace('w-', '') + 'rem' }}>
              {index + 1}
            </span>
          ))}
          <span className="text-xs">ケーブル側</span>
        </div>
      )}

      {/* Color names (for reference) */}
      {showLabels && (
        <div className="text-xs text-gray-500">
          端子側から順に: {colorNames.map((name, index) => (
            <span key={index}>
              {index + 1}.{name}
              {index < colorNames.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
