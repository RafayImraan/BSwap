module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#081018",
        steel: "#9eb5cc",
        glow: "#5cf2c7",
        ember: "#ff8a4c"
      },
      fontFamily: {
        sans: ["Space Grotesk", "ui-sans-serif", "system-ui"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"]
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        pulseline: "pulseline 1.8s ease-in-out infinite"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        pulseline: {
          "0%, 100%": { opacity: "0.35", transform: "scaleX(0.98)" },
          "50%": { opacity: "1", transform: "scaleX(1)" }
        }
      }
    }
  },
  plugins: []
};
