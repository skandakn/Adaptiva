import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#142322",
        moss: "#2F6B57",
        mint: "#53BFA5",
        coral: "#E76F61",
        amber: "#F2B84B",
        sky: "#5A8FD8",
        paper: "#F8FAF7",
        cloud: "#EEF5F2",
        graphite: "#4A5552"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(20, 35, 34, 0.10)",
        lift: "0 10px 24px rgba(20, 35, 34, 0.14)"
      },
      borderRadius: {
        card: "8px"
      }
    }
  },
  plugins: []
};

export default config;
