import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Nav from "@/components/Nav";
import RegisterSW from "@/components/RegisterSW";

export const metadata = {
  title: "Torneo Voley — Estadísticas",
  description: "Tabla de posiciones, calendario y estadísticas del torneo amateur de voleibol.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Torneo Voley" },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport = {
  themeColor: "#0E1726",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen pb-24">
        <AuthProvider>
          <RegisterSW />
          <main className="container-app pt-6">{children}</main>
          <Nav />
        </AuthProvider>
      </body>
    </html>
  );
}
