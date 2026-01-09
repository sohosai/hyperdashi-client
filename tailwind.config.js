const { heroui } = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Slate scale for manual usage if needed
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      }
    },
  },
  darkMode: "class",
  plugins: [heroui({
    themes: {
      light: {
        colors: {
          background: "#FFFFFF",
          foreground: "#0F172A", // slate-900
          primary: {
            DEFAULT: "#3B82F6", // blue-500
            foreground: "#FFFFFF",
          },
        }
      },
      dark: {
        colors: {
          background: "#18181b", // zinc-900
          foreground: "#fafafa", // zinc-50
          content1: "#27272a", // zinc-800 (cards, modal backgrounds)
          content2: "#3f3f46", // zinc-700 (secondary backgrounds)
          content3: "#52525b", // zinc-600
          content4: "#71717a", // zinc-500
          default: {
            50: "#27272a", // zinc-800 - Was #fafafa (White), causing bright white hovers
            100: "#3f3f46", // zinc-700 - Input background (flat) - Lighter for better contrast
            200: "#52525b", // zinc-600 - Input border (bordered) / hover
            300: "#71717a", // zinc-500
            400: "#a1a1aa", // zinc-400
            500: "#d4d4d8", // zinc-300
            600: "#e4e4e7", // zinc-200
            DEFAULT: "#52525b", // zinc-600
            foreground: "#fafafa",
          },
          primary: {
            50: "#172554", // blue-950
            100: "#1e3a8a", // blue-900
            DEFAULT: "#3B82F6", // blue-500
            foreground: "#FFFFFF",
          },
          secondary: {
            DEFAULT: "#71717a", // zinc-500
            foreground: "#FFFFFF",
          },
          success: {
            50: "#052e16", // green-950
            100: "#14532d", // green-900
            DEFAULT: "#22c55e", // green-500
            foreground: "#FFFFFF",
          },
          warning: {
            50: "#451a03", // amber-950 (using amber for warning)
            100: "#78350f", // amber-900
            DEFAULT: "#f59e0b", // amber-500
            foreground: "#FFFFFF",
          },
          danger: {
            50: "#450a0a", // red-950
            100: "#7f1d1d", // red-900
            DEFAULT: "#ef4444", // red-500
            foreground: "#FFFFFF",
          },
          divider: "rgba(255, 255, 255, 0.15)", // Slightly lighter divider for dark mode
          focus: "#3B82F6", // blue-500
        }
      }
    }
  })],
}