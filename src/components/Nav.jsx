"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const items = [
  { href: "/", label: "Tabla", icon: TableIcon },
  { href: "/calendario", label: "Partidos", icon: CalIcon },
  { href: "/estadisticas", label: "Stats", icon: ChartIcon },
  { href: "/equipos", label: "Equipos", icon: TeamIcon },
];

export default function Nav() {
  const pathname = usePathname();
  const { isAdmin, user } = useAuth();

  const links = [...items];
  if (isAdmin) links.push({ href: "/mesa-tecnica", label: "Mesa", icon: WhistleIcon });
  links.push({ href: user ? "/cuenta" : "/login", label: user ? "Cuenta" : "Entrar", icon: UserIcon });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 backdrop-blur">
      <div className="container-app flex items-stretch justify-between py-1.5">
        {links.map((it) => {
          const active = pathname === it.href;
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[11px] font-medium ${
                active ? "text-court" : "text-muted"
              }`}
            >
              <Icon active={active} />
              <span className="leading-none">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function base(active) {
  return { width: 22, height: 22, fill: "none", stroke: "currentColor", strokeWidth: active ? 2.4 : 2, strokeLinecap: "round", strokeLinejoin: "round" };
}
function TableIcon({ active }) {
  return (<svg {...base(active)} viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>);
}
function CalIcon({ active }) {
  return (<svg {...base(active)} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>);
}
function ChartIcon({ active }) {
  return (<svg {...base(active)} viewBox="0 0 24 24"><path d="M5 21V9M12 21V4M19 21v-7" /></svg>);
}
function TeamIcon({ active }) {
  return (<svg {...base(active)} viewBox="0 0 24 24"><circle cx="9" cy="8" r="3" /><circle cx="17" cy="10" r="2.2" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5M15.5 20c0-2 1.5-3.5 3.5-3.5" /></svg>);
}
function WhistleIcon({ active }) {
  return (<svg {...base(active)} viewBox="0 0 24 24"><circle cx="9" cy="14" r="6" /><path d="M14 12l7-3M9 8V5h4" /></svg>);
}
function UserIcon({ active }) {
  return (<svg {...base(active)} viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>);
}
