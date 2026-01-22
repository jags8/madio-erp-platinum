/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(40, 20%, 98%)',
        foreground: 'hsl(220, 15%, 10%)',
        card: 'hsl(0, 0%, 100%)',
        'card-foreground': 'hsl(220, 15%, 10%)',
        primary: 'hsl(160, 35%, 25%)',
        'primary-foreground': 'hsl(0, 0%, 100%)',
        secondary: 'hsl(35, 30%, 90%)',
        'secondary-foreground': 'hsl(220, 15%, 10%)',
        muted: 'hsl(40, 10%, 94%)',
        'muted-foreground': 'hsl(220, 10%, 40%)',
        accent: 'hsl(35, 60%, 50%)',
        'accent-foreground': 'hsl(0, 0%, 100%)',
        destructive: 'hsl(0, 84%, 60%)',
        'destructive-foreground': 'hsl(0, 0%, 98%)',
        border: 'hsl(220, 10%, 90%)',
        input: 'hsl(220, 10%, 90%)',
        ring: 'hsl(160, 35%, 25%)',
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '2px',
        md: '6px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}