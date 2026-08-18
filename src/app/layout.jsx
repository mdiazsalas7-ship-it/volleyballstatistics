import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { BrandingProvider } from "@/context/BrandingContext";
import Nav from "@/components/Nav";
import AppHeader from "@/components/AppHeader";
import RegisterSW from "@/components/RegisterSW";
import ConfigBanner from "@/components/ConfigBanner";

export const metadata = {
  title: "Torneo Voley — Estadísticas",
  description: "Resultados, tabla de posiciones, estadísticas y noticias de tu liga de voleibol.",
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
          <BrandingProvider>
            <RegisterSW />
            <AppHeader />
            <main className="container-app pt-5">
              <ConfigBanner />
              {children}
            </main>
            <Nav />
          </BrandingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
