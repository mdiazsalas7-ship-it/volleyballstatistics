"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const items = [
  { href: "/", label: "Inicio", icon: "home" },
  { href: "/tabla", label: "Tabla", icon: "leaderboard" },
  { href: "/calendario", label: "Partidos", icon: "sports_volleyball" },
  { href: "/estadisticas", label: "Stats", icon: "analytics" },
  { href: "/equipos", label: "Equipos", icon: "groups" },
];

export default function Nav() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();

  const links = [...items];
  if (isAdmin) links.push({ href: "/mesa-tecnica", label: "Mesa", icon: "sports_gymnastics" });

  const isActive = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 backdrop-blur">
      <div className="container-app flex items-stretch justify-between py-1.5">
        {links.map((it) => {
          const active = isActive(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-[11px] font-semibold ${
                active ? "text-court" : "text-muted"
              }`}
            >
              <span className={`mi ${active ? "mi-fill" : ""}`} style={{ fontSize: 24 }}>{it.icon}</span>
              <span className="leading-none">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
