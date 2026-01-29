/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '480px',    // Extra small devices
        'sm': '640px',    // Small devices
        'md': '768px',    // Medium devices
        'lg': '1024px',   // Large devices
        'xl': '1280px',   // Extra large devices
        '2xl': '1536px',  // 2K and above
        '4k': '2160px',   // 4K displays
        // Max-width breakpoints
        'max-xl': { 'max': '1280px' },  // 1280px and below
        'max-2xl': { 'max': '1600px' }, // 1600px and below
      },
      colors: {
        "sro-primary": "var(--sro-primary)",
        "sro-secondary": "var(--sro-secondary)",
        "sro-accent": "var(--sro-accent)",
        "status-pending": "var(--status-pending-bg)",
        "status-pending-text": "var(--status-pending-text)",
        "status-neutral-text": "var(--status-neutral-text)",
        "sro-text-dark": "var(--sro-text-dark)",
        "sro-border-light": "var(--sro-border-light)",
        "sro-bg-off-white": "var(--sro-bg-off-white)",
      },
    },
  },
  plugins: [],
}
