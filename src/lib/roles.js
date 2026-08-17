// Roles de voleibol para el roster.
export const ROLES = [
  { value: "S", label: "Colocador" },
  { value: "OH", label: "Punta" },
  { value: "OPP", label: "Opuesto" },
  { value: "MB", label: "Central" },
  { value: "L", label: "Líbero" },
  { value: "DS", label: "Def. específico" },
];

export function roleLabel(value) {
  return ROLES.find((r) => r.value === value)?.label || value || "";
}
