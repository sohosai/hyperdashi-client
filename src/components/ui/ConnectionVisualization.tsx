import React from 'react'
import { Cable, Usb, Monitor, Wifi, Bluetooth, Headphones, Mic, Volume2, Power, Tv, HardDrive, Radio } from 'lucide-react'

interface ConnectionVisualizationProps {
  connections: string[]
  size?: 'sm' | 'md' | 'lg'
}

export function ConnectionVisualization({ connections, size = 'md' }: ConnectionVisualizationProps) {
  if (!connections || connections.length === 0) {
    return <span className="text-gray-400 dark:text-gray-600">-</span>
  }

  const sizeClasses = {
    sm: 'text-xs gap-1',
    md: 'text-sm gap-2',
    lg: 'text-base gap-2'
  }

  const iconSize = {
    sm: 14,
    md: 16,
    lg: 20
  }

  const getConnectionIcon = (connection: string) => {
    const lowerConnection = connection.toLowerCase()
    
    if (lowerConnection.includes('hdmi')) {
      return <Monitor size={iconSize[size]} />
    } else if (lowerConnection.includes('usb')) {
      return <Usb size={iconSize[size]} />
    } else if (lowerConnection.includes('lan') || lowerConnection.includes('ethernet') || lowerConnection.includes('rj45')) {
      return <Cable size={iconSize[size]} />
    } else if (lowerConnection.includes('wifi') || lowerConnection.includes('wi-fi')) {
      return <Wifi size={iconSize[size]} />
    } else if (lowerConnection.includes('bluetooth')) {
      return <Bluetooth size={iconSize[size]} />
    } else if (lowerConnection.includes('audio') || lowerConnection.includes('jack') || lowerConnection.includes('3.5mm') || lowerConnection.includes('6.35mm')) {
      return <Headphones size={iconSize[size]} />
    } else if (lowerConnection.includes('xlr') || lowerConnection.includes('mic')) {
      return <Mic size={iconSize[size]} />
    } else if (lowerConnection.includes('speaker') || lowerConnection.includes('スピーカー')) {
      return <Volume2 size={iconSize[size]} />
    } else if (lowerConnection.includes('displayport') || lowerConnection.includes('dp')) {
      return <Tv size={iconSize[size]} />
    } else if (lowerConnection.includes('vga') || lowerConnection.includes('d-sub')) {
      return <Monitor size={iconSize[size]} />
    } else if (lowerConnection.includes('dvi')) {
      return <Monitor size={iconSize[size]} />
    } else if (lowerConnection.includes('sdi')) {
      return <Radio size={iconSize[size]} />
    } else if (lowerConnection.includes('rca') || lowerConnection.includes('赤白') || lowerConnection.includes('コンポジット')) {
      return <Cable size={iconSize[size]} />
    } else if (lowerConnection.includes('電源') || lowerConnection.includes('power') || lowerConnection.includes('ac')) {
      return <Power size={iconSize[size]} />
    } else if (lowerConnection.includes('sata') || lowerConnection.includes('ide')) {
      return <HardDrive size={iconSize[size]} />
    } else {
      return <Cable size={iconSize[size]} />
    }
  }

  const getConnectionType = (connection: string) => {
    const lowerConnection = connection.toLowerCase()
    
    if (lowerConnection.includes('オス') || lowerConnection.includes('male') || lowerConnection.includes('♂')) {
      return 'male'
    } else if (lowerConnection.includes('メス') || lowerConnection.includes('female') || lowerConnection.includes('♀')) {
      return 'female'
    }
    return 'neutral'
  }

  const getConnectionColor = (connection: string) => {
    const lowerConnection = connection.toLowerCase()
    
    if (lowerConnection.includes('hdmi')) {
      return 'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-950 dark:border-purple-800'
    } else if (lowerConnection.includes('usb')) {
      return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800'
    } else if (lowerConnection.includes('lan') || lowerConnection.includes('ethernet') || lowerConnection.includes('rj45')) {
      return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800'
    } else if (lowerConnection.includes('wifi') || lowerConnection.includes('wi-fi')) {
      return 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-950 dark:border-indigo-800'
    } else if (lowerConnection.includes('bluetooth')) {
      return 'text-blue-500 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-800'
    } else if (lowerConnection.includes('audio') || lowerConnection.includes('jack') || lowerConnection.includes('3.5mm') || lowerConnection.includes('6.35mm')) {
      return 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950 dark:border-orange-800'
    } else if (lowerConnection.includes('xlr') || lowerConnection.includes('mic')) {
      return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800'
    } else if (lowerConnection.includes('speaker') || lowerConnection.includes('スピーカー')) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-800'
    } else if (lowerConnection.includes('displayport') || lowerConnection.includes('dp')) {
      return 'text-cyan-600 bg-cyan-50 border-cyan-200 dark:text-cyan-400 dark:bg-cyan-950 dark:border-cyan-800'
    } else if (lowerConnection.includes('vga') || lowerConnection.includes('d-sub')) {
      return 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-950 dark:border-gray-800'
    } else if (lowerConnection.includes('dvi')) {
      return 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800'
    } else if (lowerConnection.includes('sdi')) {
      return 'text-teal-600 bg-teal-50 border-teal-200 dark:text-teal-400 dark:bg-teal-950 dark:border-teal-800'
    } else if (lowerConnection.includes('rca') || lowerConnection.includes('赤白') || lowerConnection.includes('コンポジット')) {
      return 'text-pink-600 bg-pink-50 border-pink-200 dark:text-pink-400 dark:bg-pink-950 dark:border-pink-800'
    } else if (lowerConnection.includes('電源') || lowerConnection.includes('power') || lowerConnection.includes('ac')) {
      return 'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-950 dark:border-slate-800'
    } else if (lowerConnection.includes('sata') || lowerConnection.includes('ide')) {
      return 'text-violet-600 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-950 dark:border-violet-800'
    } else {
      return 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-950 dark:border-gray-800'
    }
  }

  const parseConnectionName = (connection: string) => {
    // Handle various connection name formats
    // Format examples: "HDMIオス", "microHDMIオス", "miniHDMIオス", "USB Type-C メス", "LAN(RJ45)オス", "3.5mmジャック"
    
    // Try to extract gender marker
    let gender = ''
    let cleanType = connection
    
    if (connection.includes('オス') || connection.includes('♂')) {
      gender = 'オス'
      cleanType = connection.replace(/オス|♂/g, '').trim()
    } else if (connection.includes('メス') || connection.includes('♀')) {
      gender = 'メス'
      cleanType = connection.replace(/メス|♀/g, '').trim()
    } else if (connection.toLowerCase().includes('male')) {
      gender = 'Male'
      cleanType = connection.replace(/male/gi, '').trim()
    } else if (connection.toLowerCase().includes('female')) {
      gender = 'Female'
      cleanType = connection.replace(/female/gi, '').trim()
    }
    
    // Clean up common patterns
    cleanType = cleanType
      .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
    
    return {
      type: cleanType || connection,
      gender: gender
    }
  }

  return (
    <div className={`flex flex-wrap items-center ${sizeClasses[size]}`}>
      {connections.map((connection, index) => {
        const parsed = parseConnectionName(connection)
        const type = getConnectionType(connection)
        const colorClass = getConnectionColor(connection)
        
        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <span className="text-gray-400 dark:text-gray-600 mx-1">→</span>
            )}
            <div 
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${colorClass}`}
              title={connection}
            >
              {getConnectionIcon(connection)}
              <span className="font-medium">{parsed.type}</span>
              {parsed.gender && (
                <span className={`text-xs ${
                  type === 'male' ? 'text-blue-600 dark:text-blue-400' : 
                  type === 'female' ? 'text-pink-600 dark:text-pink-400' : 
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {parsed.gender}
                </span>
              )}
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}