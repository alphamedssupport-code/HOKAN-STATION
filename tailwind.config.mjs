import typography from '@tailwindcss/typography';

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
          200: '#bae6fd',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        accent: {
          50: '#ecfdf5',
          500: '#10b981',
          600: '#059669',
        },
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#374151',
            lineHeight: '2',
            fontSize: '1rem',
            '--tw-prose-body': '#374151',
            '--tw-prose-headings': '#111827',
            '--tw-prose-bold': '#111827',
            '--tw-prose-links': '#0284c7',
            '--tw-prose-code': '#be185d',
            '--tw-prose-quotes': '#374151',
            '--tw-prose-quote-borders': '#10b981',
            p: {
              marginTop: '1.25em',
              marginBottom: '1.25em',
            },
            h2: {
              fontSize: '1.35rem',
              fontWeight: '700',
              marginTop: '2.5em',
              marginBottom: '0.75em',
              paddingLeft: '0.875rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              borderLeft: `4px solid ${theme('colors.primary.500')}`,
              backgroundColor: theme('colors.primary.50'),
              borderRadius: '0 6px 6px 0',
              color: theme('colors.primary.800'),
            },
            h3: {
              fontSize: '1.1rem',
              fontWeight: '700',
              marginTop: '2em',
              marginBottom: '0.5em',
              paddingLeft: '0.75rem',
              borderLeft: `3px solid ${theme('colors.accent.500')}`,
              color: '#1f2937',
            },
            h4: {
              fontSize: '1rem',
              fontWeight: '700',
              color: '#374151',
            },
            a: {
              color: theme('colors.primary.600'),
              textDecoration: 'underline',
              textDecorationColor: theme('colors.primary.200'),
              '&:hover': {
                color: theme('colors.primary.800'),
                textDecorationColor: theme('colors.primary.500'),
              },
            },
            strong: {
              color: '#111827',
              fontWeight: '700',
              backgroundColor: '#fef9c3',
              paddingLeft: '2px',
              paddingRight: '2px',
              borderRadius: '2px',
            },
            blockquote: {
              borderLeftColor: theme('colors.accent.500'),
              borderLeftWidth: '4px',
              backgroundColor: theme('colors.accent.50'),
              borderRadius: '0 8px 8px 0',
              padding: '1rem 1.25rem',
              fontStyle: 'normal',
              color: '#374151',
              p: {
                margin: '0',
              },
              '&::before': { content: 'none' },
            },
            table: {
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.9rem',
            },
            'thead th': {
              backgroundColor: theme('colors.primary.700'),
              color: '#fff',
              padding: '0.625rem 1rem',
              fontWeight: '600',
              textAlign: 'left',
            },
            'tbody tr': {
              borderBottomWidth: '1px',
              borderBottomColor: '#e5e7eb',
            },
            'tbody tr:nth-child(even)': {
              backgroundColor: theme('colors.primary.50'),
            },
            'tbody td': {
              padding: '0.625rem 1rem',
              verticalAlign: 'top',
            },
            ul: {
              paddingLeft: '1.5rem',
              listStyleType: 'none',
              li: {
                paddingLeft: '1.25rem',
                position: 'relative',
                '&::before': {
                  content: '"✦"',
                  position: 'absolute',
                  left: '-0.25rem',
                  color: theme('colors.primary.400'),
                  fontSize: '0.6rem',
                  top: '0.5rem',
                },
              },
            },
            ol: {
              paddingLeft: '1.5rem',
              'li::marker': {
                color: theme('colors.primary.600'),
                fontWeight: '700',
              },
            },
            code: {
              backgroundColor: '#f1f5f9',
              borderRadius: '4px',
              padding: '0.125rem 0.375rem',
              fontSize: '0.875em',
              color: '#be185d',
              fontWeight: '500',
            },
            'code::before': { content: 'none' },
            'code::after': { content: 'none' },
            hr: {
              borderColor: '#e5e7eb',
              marginTop: '2.5em',
              marginBottom: '2.5em',
            },
          },
        },
      }),
    },
  },
  plugins: [typography],
};
