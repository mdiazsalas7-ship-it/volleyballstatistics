/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta "Medianoche eléctrica" (dark-first)
        bg: "#0B1524",       // fondo de página
        surface: "#0B1524",  // fondo / insets
        card: "#15233F",     // tarjetas (tinte azulado, más claras que el fondo)
        ink: "#0B1524",      // paneles oscuros (header, marcador, chips) y texto sobre ámbar
        snow: "#EAF1FB",     // texto principal (claro)
        court: "#2F6BFF",    // azul eléctrico (acento primario / botones)
        amber: "#FFC043",    // ámbar (números LED / marca)
        teal: "#22D3A0",     // verde acento
        coral: "#FF5A5F",    // errores / en vivo
        line: "#27374F",     // borde fino sobre oscuro
        muted: "#8FA6C9",    // texto secundario (azulado)
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.3), 0 12px 30px -18px rgba(0,0,0,0.6)",
      },
      keyframes: {
        pulseLive: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.35" } },
      },
      animation: { live: "pulseLive 1.4s ease-in-out infinite" },
    },
  },
  plugins: [],
};
