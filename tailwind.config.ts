import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#18211d",
        paper: "#f4f3ec",
        acid: "#d7ff4f",
        coral: "#ff6b4a",
        mist: "#e9ebe4"
      },
      boxShadow: {
        soft: "0 24px 70px rgba(24, 33, 29, 0.09)"
      }
    }
  },
  plugins: []
};

export default config;
