/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0E1726", // paneles oscuros / marcador
        court: "#1B4FD1", // azul cancha (primario)
        amber: "#FFC043", // energia / LED / acento
        coral: "#FF5A5F", // errores / en vivo
        surface: "#F5F7FB", // fondo
        card: "#FFFFFF",
        line: "#E3E8EF", // bordes
        muted: "#5B6675", // texto secundario
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(14,23,38,0.06), 0 8px 24px -12px rgba(14,23,38,0.18)",
      },
      keyframes: {
        pulseLive: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        live: "pulseLive 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
