/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        'foreground': '#000000',
        'primary': '#674528',
        'primary-foreground': '#FFFFFF',
        'primaryForeground': '#FFFFFF',
        'secondary': '#B58553',
        'secondary-foreground': '#FFFFFF',
        'secondaryForeground': '#FFFFFF',
        'accent': '#DCC0A2',
        'navigation': '#CBFFC2',
        'background': '#E5BC8F',
        'card': '#EDD9BF',
        'muted': '#F5F5F4',
        'muted-foreground': '#5E5955',
        'mutedForeground': '#5E5955',
        'positive': '#28A53F',
        'destructive': '#E03B30',
        'destructive-foreground': '#FFFFFF',
        'destructiveForeground': '#FFFFFF',
        'neutral': '#4b5563',
      },
      padding: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      letterSpacing: {
        'tightest': '-1px',
      },
      animation: {
        "fade-in": 'fade-in 0.25s ease-in forwards',
      },
      keyframes: {
        "fade-in": {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    }
  },
  future: { hoverOnlyWhenSupported: true },
  plugins: []
};
