export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      colors: {
        background: "#0a0a0f", // Deep futuristic dark background
        glass: "rgba(255, 255, 255, 0.05)",
        glassBorder: "rgba(255, 255, 255, 0.1)",
        primary: "#425F76", // Slate Blue
        primaryGlow: "#54C6BE", // Cyan
        secondary: "#2A2146", // Deep Dark Purple
        secondaryGlow: "#D2F6F0", // Very Light Cyan
        neonAccent: "#54C6BE",
        adminBg: "#FDF1D5",
        adminSidebar: "#0BB3CA",
        adminAccent1: "#DD3A26",
        adminAccent2: "#FA8D09",
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'neon': '0 0 10px rgba(139, 92, 246, 0.5), 0 0 20px rgba(139, 92, 246, 0.3)',
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
      }
    },
  },
  plugins: [],
}
