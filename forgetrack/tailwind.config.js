/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#07070B',
        canvas: '#0B0B11',
        surface: {
          DEFAULT: '#111118',
          raised: '#16161F',
          inset: '#0E0E14',
        },
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          DEFAULT: 'rgba(255,255,255,0.10)',
          strong: 'rgba(255,255,255,0.16)',
        },
        fg: {
          primary: '#F5F5F7',
          secondary: '#8A8A94',
          tertiary: '#52525B',
        },
        accent: {
          glow: '#6366F1',
          'glow-soft': 'rgba(99,102,241,0.15)',
        },
        success: {
          DEFAULT: '#10B981',
          bg: 'rgba(16,185,129,0.12)',
          border: 'rgba(16,185,129,0.25)',
        },
        danger: {
          DEFAULT: '#F43F5E',
          bg: 'rgba(244,63,94,0.12)',
          border: 'rgba(244,63,94,0.25)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          bg: 'rgba(245,158,11,0.12)',
          border: 'rgba(245,158,11,0.25)',
        },
        info: {
          DEFAULT: '#3B82F6',
          bg: 'rgba(59,130,246,0.12)',
          border: 'rgba(59,130,246,0.25)',
        },
      },
      fontFamily: {
        display: ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      fontSize: {
        'display-hero': ['4.5rem', { lineHeight: '1.0', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-lg': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.025em', fontWeight: '700' }],
        'display-md': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-sm': ['2rem', { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '600' }],
        'h1': ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h2': ['1.375rem', { lineHeight: '1.3', letterSpacing: '-0.005em', fontWeight: '600' }],
        'h3': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.45', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.01em' }],
        'label': ['0.6875rem', { lineHeight: '1.3', letterSpacing: '0.08em', fontWeight: '500' }],
        'micro': ['0.625rem', { lineHeight: '1.2', letterSpacing: '0.06em', fontWeight: '600' }],
      },
      borderRadius: {
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '18px',
        '2xl': '24px',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },
      backgroundImage: {
        'cosmic-glow': 'radial-gradient(ellipse 600px 300px at 50% -100px, rgba(99,102,241,0.18), rgba(99,102,241,0) 70%)',
        'card-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 50%)',
        'dot-grid': 'radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)',
      },
      backgroundSize: {
        'dot-grid': '24px 24px',
      },
      boxShadow: {
        'card': '0 1px 2px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.06)',
        'raised': '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.10)',
        'focus': '0 0 0 3px rgba(99, 102, 241, 0.25)',
      },
    },
  },
  plugins: [],
};
