/** @type {import('tailwindcss').Config} */
const survivorPreset = {
  theme: {
    extend: {
      // ---------------------------------------------------------------
      // Brand palette
      // "b" = brown tones, "g" = green tones (used for sidebar / nature)
      // ---------------------------------------------------------------
      colors: {
        // Brown scale (light -> dark is b4 -> b1)
        b1: '#684528',
        'b1-light': '#8c6d4d',
        b2: '#b09472',
        b3: '#e5bc8f',
        b4: '#eed9bf',

        // Green scale
        g1: '#3d5540',
        g2: '#7d9277',
        g3: '#a9cf9f',

        // Semantic UI colors
        primary: '#674528',
        'primary-foreground': '#FFFFFF',
        secondary: '#B58553',
        'secondary-foreground': '#FFFFFF',
        accent: '#DCC0A2',
        background: '#E5BC8F',
        foreground: '#000000',
        card: '#EDD9BF',
        muted: '#F5F5F4',
        'muted-foreground': '#5E5955',

        // Feedback
        positive: '#28A53F',
        destructive: '#E03B30',
        'destructive-foreground': '#FFFFFF',
        error: 'rgba(248, 113, 113, 0.6)',
        neutral: '#4b5563',

        // Navigation highlight
        navigation: '#CBFFC2',
      },

      // ---------------------------------------------------------------
      // Rank / podium badge colors (gold, silver, bronze, default)
      // Exposed as standalone values for programmatic use.
      // ---------------------------------------------------------------
      // (These aren't Tailwind theme keys, but we keep them in extend so
      //  consuming code can import the preset and read them if needed.)

      // ---------------------------------------------------------------
      // Spacing additions
      // ---------------------------------------------------------------
      padding: {
        18: '4.5rem',
        22: '5.5rem',
        26: '6.5rem',
        30: '7.5rem',
      },

      // ---------------------------------------------------------------
      // Typography
      // ---------------------------------------------------------------
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-1px',
      },

      // ---------------------------------------------------------------
      // Border radius
      // ---------------------------------------------------------------
      borderRadius: {
        lg: '0.5rem',
        md: 'calc(0.5rem - 2px)',
        sm: 'calc(0.5rem - 4px)',
      },

      // ---------------------------------------------------------------
      // Animations & keyframes
      // ---------------------------------------------------------------
      animation: {
        'fade-in': 'fade-in 0.25s ease-in forwards',
        'scale-in': 'scale-in 2s ease-out',
        'scale-in-fast': 'scale-in 0.1s ease-out',
        'scale-out': 'scale-out 2s ease-out',
        'scale-out-fast': 'scale-out 0.1s ease-out',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0)' },
          '100%': { transform: 'scale(1)' },
        },
        'scale-out': {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(0)' },
        },
      },
    },
  },
};

module.exports = survivorPreset;
