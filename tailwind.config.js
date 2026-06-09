/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        background: {
          primary: "#0A1628",
          secondary: "#0F1E36",
          tertiary: "#152A45",
          elevated: "#1A3150",
        },
        primary: {
          DEFAULT: "#00D4FF",
          light: "#4DE2FF",
          dark: "#00A8CC",
        },
        success: {
          DEFAULT: "#2ED573",
          light: "#5FE39A",
          dark: "#24A85B",
        },
        warning: {
          DEFAULT: "#FFA502",
          light: "#FFBE4D",
          dark: "#CC8400",
        },
        danger: {
          DEFAULT: "#FF4757",
          light: "#FF7A86",
          dark: "#CC3945",
        },
        purple: {
          DEFAULT: "#A55EEA",
          light: "#C08EF0",
          dark: "#844ABB",
        },
        text: {
          primary: "#F0F4F8",
          secondary: "#A0AEC0",
          tertiary: "#718096",
          disabled: "#4A5568",
        },
        border: {
          DEFAULT: "#2D3748",
          light: "#4A5568",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "slide-in": "slide-in 0.3s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "count-up": "count-up 1s ease-out",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0, 212, 255, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(0, 212, 255, 0.6)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "glow": {
          "0%": { textShadow: "0 0 10px rgba(0, 212, 255, 0.5)" },
          "100%": { textShadow: "0 0 20px rgba(0, 212, 255, 0.8)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)",
        "gradient-radial": "radial-gradient(circle at center, rgba(0, 212, 255, 0.1) 0%, transparent 70%)",
      },
    },
  },
  plugins: [],
};
