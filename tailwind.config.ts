import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Apple Design System color tokens
      colors: {
        primary: {
          DEFAULT: '#0071E3',
          hover: '#006EDB',
          press: '#0076DF',
        },
        text: {
          dominant: '#1D1D1F',
          secondary: '#333336',
          tertiary: '#6E6E73',
        },
        neutral: {
          lightest: '#FFFFFF',
          surface: '#EDEDF2',
          'dark-medium': '#272729',
        },
        overlay: {
          soft: 'rgba(0,0,0,0.8)',
        },
      },
      // Typography
      fontFamily: {
        sans: [
          'SF Pro Text',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        display: [
          'SF Pro Display',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      fontSize: {
        'display-hero': ['40px', { lineHeight: '44px', fontWeight: '600' }],
        'heading-large': ['28px', { lineHeight: '32px', fontWeight: '400' }],
        'heading-primary': ['24px', { lineHeight: '28px', fontWeight: '600' }],
        'heading-secondary': ['34px', { lineHeight: '50px', fontWeight: '600' }],
        'body-default': ['17px', { lineHeight: '25px', fontWeight: '400' }],
        'body-compact': ['17px', { lineHeight: '21px', fontWeight: '400' }],
        'small-label': ['12px', { lineHeight: '16px', fontWeight: '400' }],
      },
      // Spacing
      maxWidth: {
        container: '1262px',
      },
      // Responsive breakpoints
      screens: {
        mobile: '320px',
        tablet: '768px',
        desktop: '1024px',
        'large-desktop': '1441px',
      },
      // Backdrop blur for sticky nav
      backdropBlur: {
        nav: '20px',
      },
    },
  },
  plugins: [],
};

export default config;
