/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        jollibee: {
          yellow: "#FFC200",
          "yellow-light": "#FFD84D",
          "yellow-dark": "#E6A800",
          red: "#CC0000",
          "red-light": "#FF1A1A",
          "red-dark": "#990000",
          orange: "#FF6B00",
          cream: "#FFF8E7",
          brown: "#4A2800",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      backgroundImage: {
        "jollibee-gradient": "linear-gradient(135deg, #FFC200 0%, #FF6B00 50%, #CC0000 100%)",
        "jollibee-subtle": "linear-gradient(135deg, #FFF8E7 0%, #FFF3CC 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
