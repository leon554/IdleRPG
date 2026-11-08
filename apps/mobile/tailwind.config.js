const { colors, rarityColors } = require('./src/theme/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // NativeWind's web runtime throws on load with the default 'media' mode.
  darkMode: 'class',
  theme: {
    extend: {
      colors: { ...colors, rarity: rarityColors },
      fontFamily: {
        mono: ["JetBrainsMono_400Regular", "monospace"],
        "mono-medium": ["JetBrainsMono_500Medium", "monospace"],
        "mono-bold": ["JetBrainsMono_700Bold", "monospace"],
      },
    },
  },
  plugins: [],
};
