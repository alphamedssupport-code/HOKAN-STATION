/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans JP"', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        accent: {
          500: '#10b981',
          600: '#059669',
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#374151',
            lineHeight: '1.8',
            h2: {
              fontSize: '1.5rem',
              fontWeight: '700',
              marginTop: '2.5rem',
              marginBottom: '1rem',
              paddingLeft: '0.75rem',
              borderLeft: '4px solid #0ea5e9',
            },
            h3: {
              fontSize: '1.2rem',
              fontWeight: '600',
              marginTop: '2rem',
              marginBottom: '0.75rem',
            },
          },
        },
      },
    },
  },
  plugins: [],
};
