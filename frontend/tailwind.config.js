/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  corePlugins: {
    preflight: false,   // keeps our existing vanilla CSS base styles intact
  },
  theme: {
    extend: {
      fontFamily: {
        quando:  ['Quando', 'serif'],
        maitree: ['Maitree', 'serif'],
        baloo:   ['"Baloo Chettan 2"', 'sans-serif'],
      },
      colors: {
        mist:    '#F8FBFF',
        sky:     '#B7D7E8',
        ocean:   '#4A90B8',
        deep:    '#1a3a5c',
        midblue: '#4a6a8a',
        softblue:'#7a9ab0',
      },
      backgroundImage: {
        'morning-mist': 'linear-gradient(to bottom, #F8FBFF 0%, #B7D7E8 100%)',
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        card:  '0 4px 24px rgba(74,144,184,.12), 0 1px 4px rgba(74,144,184,.08)',
        'card-hover': '0 8px 40px rgba(74,144,184,.20), 0 2px 8px rgba(74,144,184,.12)',
      },
    },
  },
  plugins: [],
}
