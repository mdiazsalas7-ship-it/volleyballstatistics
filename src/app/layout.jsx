import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Nav from "@/components/Nav";
import RegisterSW from "@/components/RegisterSW";
import ConfigBanner from "@/components/ConfigBanner";

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
      <body className="min-h-screen pb-24">
        <AuthProvider>
          <RegisterSW />
          <main className="container-app pt-6">
            <ConfigBanner />
            {children}
          </main>
          <Nav />
        </AuthProvider>
      </body>
    </html>
  );
}
