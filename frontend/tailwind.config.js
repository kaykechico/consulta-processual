export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      screens: {
        xs: "380px"
      },
      boxShadow: {
        premium: "0 24px 90px rgba(0,0,0,.55)",
        insetPremium: "inset 0 1px 0 rgba(255,255,255,.07)"
      },
      colors: {
        carbon: {
          950: "#020202",
          900: "#070707",
          800: "#111111"
        }
      }
    }
  },
  plugins: []
};