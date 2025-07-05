module.exports = {
  plugins: {
    "@tailwindcss/postcss": {
      base: './src/index.css',
      config: './tailwind.config.cjs'
    },
  },
};