import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        mist: "#eef2f7",
        fern: "#14b8a6",
        ember: "#7c3aed",
        coral: "#6366f1",
        lake: "#0891b2"
      }
    }
  },
  plugins: []
};

export default config;
