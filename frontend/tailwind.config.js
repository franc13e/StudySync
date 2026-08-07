/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FFF8E7",
        butter: "#FFF2D6",
        espresso: "#3D271D",
        chocolate: "#7C6154",
        sage: "#A2C997",
        sunset: "#FFC285",
        petal: "#FFD2D7",
        lavender: "#C2C9EC",
        border: "#F0E0C6",
        inactive: "#EFE3CE",
      },
      fontFamily: {
        display: ['"Outfit"', "sans-serif"],
        body: ['"Nunito"', "sans-serif"],
      },
      borderRadius: {
        squircle: "20px",
        "squircle-lg": "24px",
      },
    },
  },
  plugins: [],
};
