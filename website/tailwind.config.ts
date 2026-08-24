import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cutcare: {
          background: "#FFFFFF",
          soft: "#F3F7FB",
          mist: "#E8F2FF",
          primary: "#1677FF",
          primaryPressed: "#0F5FD1",
          ink: "#0B1F3A",
          body: "#52657A",
          muted: "#8292A6",
          border: "#D8E2EE",
          cyan: "#0E7490",
          green: "#22A06B",
          amber: "#E69B19",
          deep: "#020F14",
        },
      },
      boxShadow: {
        soft: "0 24px 80px rgba(11, 31, 58, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
