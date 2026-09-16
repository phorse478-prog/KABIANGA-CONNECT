import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#effcfb",
          100: "#d8f5f2",
          200: "#b2ebe5",
          300: "#78d9d0",
          400: "#40c2b9",
          500: "#1da79f",
          600: "#138b87",
          700: "#11706f",
          800: "#13595a",
          900: "#12494b",
        },
        accent: {
          50: "#fff9eb",
          100: "#fff0c7",
          500: "#e6a51f",
          600: "#c88712",
          700: "#a66a0f",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,89,90,0.06), 0 8px 20px rgba(15,89,90,0.06)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
