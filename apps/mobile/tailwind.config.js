/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  // NativeWind's web runtime throws on load with the default 'media' mode.
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
};
