/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Sampled straight from the AFENET logo (src/assets/images/afenet-logo.jpeg)
        // — brand-700 (#21409A) is the exact logo blue; the rest of the scale
        // is interpolated from it so every shade stays in the same hue family.
        brand: {
          50: "#F2F4F9",
          100: "#DFE4F2",
          200: "#B5C2E8",
          300: "#849BDF",
          400: "#486CD3",
          500: "#284DBA",
          600: "#2344A3",
          700: "#21409A",
          800: "#1C347A",
          900: "#17295D",
          950: "#121D3D",
        },
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "backdrop-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(-8px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.16s ease-out",
        "backdrop-in": "backdrop-in 0.15s ease-out",
        "toast-in": "toast-in 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
