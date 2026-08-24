/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: '#12100E',
        panel: '#1C1815',
        raised: '#241F1B',
        rail: '#2E2822',
        ember: {
          DEFAULT: '#E8863A',
          dim: '#B8622A',
          soft: '#F2A968'
        },
        chili: '#C1440E',
        sage: '#7C9473',
        paper: '#F5EFE6',
        muted: '#9C9086'
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      backgroundImage: {
        'ember-glow': 'radial-gradient(circle at 20% 20%, rgba(232,134,58,0.14), transparent 55%)'
      },
      boxShadow: {
        ticket: '0 1px 0 0 rgba(245,239,230,0.04), 0 8px 24px -8px rgba(0,0,0,0.55)'
      }
    }
  },
  plugins: []
}
