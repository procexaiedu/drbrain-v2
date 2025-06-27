/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'playground-bg': '#f8fafc',
        'surface-default': '#ffffff',
        'surface-raised': '#f8fafc',
        'border-default': '#e2e8f0',
        'border-subtle': '#f1f5f9',
        'text-primary': '#0f172a',
        'text-secondary': '#475569',
        'text-tertiary': '#94a3b8',
        
        'brand-primary': '#3b82f6',
        'brand-secondary': '#06b6d4',
        'success': '#10b981',
        'warning': '#f59e0b',
        'danger': '#ef4444',
      },
      borderRadius: {
        'xl': '0.75rem', // 12px
        '2xl': '1rem',    // 16px
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 4px 16px 0 rgba(22, 22, 22, 0.05)',
        'card-hover': '0 6px 20px 0 rgba(22, 22, 22, 0.07)',
      }
    },
  },
  plugins: [],
} 