/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        marquee: 'marquee 30s linear infinite',
        'scroll-up': 'scroll-up var(--scroll-duration, 20s) linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'scroll-up': {
          '0%, 10%': { transform: 'translateY(0)' },
          '90%, 100%': { transform: 'translateY(var(--scroll-offset, -50%))' },
        },
      },
    },
  },
  plugins: [],
}
