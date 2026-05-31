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
        ink: "#111111",
        mist: "#f4f1ea",
        fern: "#7cc47c",
        ember: "#e85d3d",
        coral: "#ff5c5c",
        lake: "#59a5d8"
      }
    }
  },
  plugins: []
};

export default config;
