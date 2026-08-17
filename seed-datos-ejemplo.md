# Datos de ejemplo para probar la app

Podés cargarlos a mano en la consola de Firebase (Firestore → Iniciar colección) o adaptarlos a la base de datos que me pases más adelante. Los IDs de documento pueden ser automáticos; lo importante es que `players.teamId` y `matches.homeTeamId/awayTeamId` apunten a IDs reales de `teams`.

## Colección `teams`
```
{ name: "Tiburones",  color: "#1B4FD1" }
{ name: "Cóndores",   color: "#FF5A5F" }
{ name: "Halcones",   color: "#12B886" }
{ name: "Pumas",      color: "#FFC043" }
```

## Colección `players`
```
{ name: "Ana Ríos",     number: 7,  teamId: "<ID de Tiburones>", role: "OH" }
{ name: "Lucía Paz",    number: 10, teamId: "<ID de Tiburones>", role: "S"  }
{ name: "María Soto",   number: 4,  teamId: "<ID de Tiburones>", role: "MB" }
{ name: "Carla Vega",   number: 12, teamId: "<ID de Cóndores>",  role: "OPP" }
{ name: "Sofía León",   number: 9,  teamId: "<ID de Cóndores>",  role: "OH" }
```
Roles válidos: `S` (colocador), `OH` (punta), `OPP` (opuesto), `MB` (central), `L` (líbero), `DS` (defensivo).

## Colección `matches`
```
{ homeTeamId: "<Tiburones>", awayTeamId: "<Cóndores>",
  date: "2026-08-20T19:00:00.000Z", court: "Cancha 1",
  status: "scheduled", sets: [] }
```
Valores de `status`: `scheduled` (programado), `live` (en vivo), `finished` (finalizado).
El campo `sets` es un arreglo como `[{ home: 25, away: 20 }, { home: 23, away: 25 }]`.

## Tu usuario admin
Después de crear tu cuenta en **Authentication**, entrá una vez a la app (para que se cree tu doc en `users/{uid}`) y luego, en Firestore, editá ese documento:
```
users/<tu-uid>  ->  role: "admin"
```
Recargá la app y verás la pestaña **Mesa técnica**.
