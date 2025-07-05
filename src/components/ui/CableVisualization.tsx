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
  const { data: cableColorsData } = useCableColors()
  const cableColors = cableColorsData?.data || []

  // Get color hex code by name
  const getColorHex = (colorName: string) => {
    const color = cableColors.find(c => c.name === colorName)
    return color?.hex_code || '#000000'
  }

  if (!colorNames.length) {
    return (
      <div className="text-xs text-gray-500">
        ケーブル色パターンなし
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
      connector: 'w-2 h-0.5'
    },
    md: {
      height: 'h-3',
      width: 'w-4',
      gap: 'gap-1',
      text: 'text-xs',
      connector: 'w-3 h-0.5'
    },
    lg: {
      height: 'h-4',
      width: 'w-6',
      gap: 'gap-1',
      text: 'text-sm',
      connector: 'w-4 h-0.5'
    }
  }

  const config = sizeConfig[size]

  return (
    <div className="flex flex-col gap-1">
      {/* Cable visualization */}
      <div className={`flex items-center ${config.gap}`}>
        {/* Left connector (端子) */}
        <div className={`${config.connector} bg-gray-400 rounded-sm`} />
        
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
        <div className={`${config.connector} bg-gray-400 rounded-sm`} />
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