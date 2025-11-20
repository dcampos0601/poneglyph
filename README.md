🧭 Fase 0 — Punto de partida (dónde estás hoy)
Check rápido:
✅ create-next-app corriendo en poneglyph/ (App Router + TS).
✅ Prisma instalado y configurado.
✅ schema.prisma razonablemente armado.
✅ npx prisma generate funciona.
✅ Script test-import.ts listo para insertar y leer AccountList + Account.
Micro-paso inmediato:
Correr test-import.ts.
Abrir npx prisma studio y confirmar que:
Se creó un AccountList.
Se creó al menos 1 Account.
Si eso no funciona, no sigas. Arreglas primero el round-trip básico.

⚙️ Fase 1 — Modelo de datos final (Account + Lead + PlayerType)
Objetivo: tener un esquema Prisma coherente con Sales Console + ICP + HubSpot, no solo con el Excel.
1.1. Definir enums clave (incluye PlayerType)
En schema.prisma:
PlayerType:
ASSET_MANAGER
DEVELOPER
FAMILY_OFFICE
OTHER
AumBucket (como ya lo tengas: <1B, 1_3B, 3_5B, GT_5B, etc.).
LeadRouteType: WARM, DIRECT_AFFINITY, COLD.
LeadWorkStatus: PENDING, IN_PROGRESS, CLOSED_IN_HUBSPOT, LOST.
LeadPriority: HIGH, MEDIUM, LOW (o 1–3, como prefieras).
1.2. Modelo Account con ICP completo
Account debe cubrir:
Identidad: id name website market / country
ICP:
playerType: PlayerType ⬅️ NUEVO y obligatorio
residentialOperation: Boolean?
multifamilyExposure: Boolean?
affordableOnly: Boolean?
sunbeltFlag: Boolean?
Scoring:
aumBucket: AumBucket?
fitScore: Int? (o enum si quieres discretizar)
Meta:
sourceList: String?
notesAnalyst: String?
timestamps (createdAt, updatedAt)
Relación:
leads: Lead[]
1.3. Modelo Lead centrado en Sales Console
Lead tiene que alinearse con cómo vas a trabajar en /sales:
FK: accountId → Account
Datos del contacto:
fullName
title
email
linkedinUrl
Routing:
routeType: LeadRouteType
leadOwner: String o enum de owners
priority: LeadPriority
Estado operativo (para la Sales Console, no para HubSpot):
workStatus: LeadWorkStatus
lastTouchDate: DateTime?
HubSpot:
hubspotContactId: String?
hubspotContactUrl: String?
Meta:
sourceList: String?
internalNotes: String?
timestamps
NO dupliques playerType en Lead; viene del Account.
1.4. Empujar schema y seed
npx prisma db push contra tu Postgres local.
npx prisma studio → revisas Account y Lead.
Ajustas test-import.ts para crear:
1–2 Account con playerType distintos (ej. ASSET_MANAGER y DEVELOPER).
3–5 Lead repartidos por routeType, workStatus, priority.
✅ Criterio de salida Fase 1:
En Prisma Studio ves cuentas con ICP completo (incluyendo playerType) y leads con toda la info que quieres explotar en la consola.

📡 Fase 2 — Capa de acceso a datos (API interna orientada a Sales Console)
Objetivo: tener un mini backend limpio que responda a la pregunta: “Dame los leads para este owner, con estos filtros (incluyendo playerType).”
2.1. lib/db.ts
Crear un módulo con:
Instancia singleton de Prisma.
Tipos de filtro:
type LeadFilters = {
owner?: string;
routeType?: LeadRouteType;
workStatus?: LeadWorkStatus[];
market?: string;
minFitScore?: number;
playerTypes?: PlayerType[]; // <--- aquí entra PlayerType
search?: string;
};
Funciones clave:
async function getLeadsForOwner(owner: string, filters: LeadFilters): Promise<LeadWithAccount[]> {}
async function markLeadWorkedToday(leadId: string): Promise<LeadWithAccount> {}
LeadWithAccount debe incluir campos del Account que quieres mostrar:
account.name
account.market
account.fitScore
account.playerType ⬅️ para filtro/columna
account.aumBucket
account.sunbeltFlag, etc.
2.2. Endpoints de API (Next App Router)
app/api/leads/route.ts
GET: lee owner, routeType, workStatus, market, minFitScore, playerTypes, search de los query params. llama a getLeadsForOwner. devuelve JSON.
app/api/leads/[id]/work/route.ts
POST: llama a markLeadWorkedToday (set lastTouchDate = now, y opcionalmente workStatus = IN_PROGRESS si venía PENDING). devuelve el lead actualizado.
En la query Prisma, playerType entra en el where del account:
account: {
...(filters.market && { market: filters.market }),
...(filters.minFitScore && { fitScore: { gte: filters.minFitScore } }),
...(filters.playerTypes && { playerType: { in: filters.playerTypes } }),
}
✅ Criterio de salida Fase 2:
Si haces un curl a /api/leads?owner=Capitan&playerTypes=ASSET_MANAGER&routeType=WARM, te devuelve solo los leads correctos, con sus cuentas y playerType bien seteado.

🧾 Fase 3 — Sales Console /sales usando la BD (incluye filtro por Player Type)
Objetivo: que tu jefe pueda usar /sales en vez de pelearse con el dashboard de HubSpot.
3.1. Pantalla principal /sales
Filtros superiores:
Lead Owner (dropdown).
Route Type (chips: Warm / Affinity / Cold / All).
Work Status (Pendiente / En curso / Lost / Cerrado).
Fit Score (High/Med/Low o rango numérico).
Market.
Player Type (Asset Manager / Developer / Family Office / Other) ⬅️ NUEVO filtro importante.
Tabla:
Columnas recomendadas:
Account_Name
Player_Type (pill: Asset Manager / Developer / Family Office / Other)
Lead_Name
Title
Market
Fit_Score (badge con color)
Route_Type (badge)
Work_Status (badge)
Last_Touch_Date
Orden por defecto: priority (HIGH primero), luego lastTouchDate (antiguos / nunca tocados primero).
Acciones por fila:
“Open in HubSpot” → abre hubspotContactUrl en pestaña nueva.
“Mark as worked today”: POST a /api/leads/[id]/work. Optimistic update de lastTouchDate y, si aplica, workStatus.
3.2. Panel de detalle de lead
Clic en la fila abre un drawer o página /sales/[leadId] con:
Lead: nombre, cargo, email, LinkedIn
routeType, leadOwner, priority, workStatus, lastTouchDate
Account (incluyendo ICP):
Account_Name
playerType ⬅️ se ve clarito qué tipo de jugador es
market, country
aumBucket
flags (residential, multifamily, affordable, sunbelt)
fitScore
Meta:
sourceList
internalNotes
Acciones:
“Open in HubSpot”
“Mark as worked today”
✅ Criterio de salida Fase 3:
Tu jefe puede filtrar, por ejemplo: “Owner: Martín, Player Type: Asset Manager, Route: Warm, FitScore alto” y ver una cola razonable de leads, sin tocar HubSpot.

📥 Fase 4 — Importar lista enriquecida (Excel/CSV → Prisma) con Player Type
Objetivo: conectar tu pipeline offline (Excel/Sheets) con la BD real, sin perder playerType.
4.1. Formato de entrada canónico
Define un solo formato por ahora:
accounts.csv con columnas:
Account_Name
Domain
Market
Country
Player_Type (valores: Asset Manager, Developer, Family Office, Other)
Residential_Operation
Multifamily_Exposure
Affordable_Only
Sunbelt_Flag
AUM_Bucket
Fit_Score
Source_List
Notes_Analyst
leads.csv con columnas que mapeen a Lead (account link, fullName, title, email, routeType, owner, etc.).
Si hoy todo está en Sheets, exportas esos tabs con esas columnas.
4.2. Script de import (CLI primero)
scripts/import-from-csv.ts:
Lee accounts.csv y leads.csv.
Para Account: mapear Player_Type → enum PlayerType:
function mapPlayerType(raw: string): PlayerType {
  const v = raw.trim().toLowerCase();
  if (v.includes("asset")) return "ASSET_MANAGER";
  if (v.includes("develop")) return "DEVELOPER";
  if (v.includes("family")) return "FAMILY_OFFICE";
  return "OTHER";
}
upsert por website o Account_Name.
Para Lead: resolver accountId por nombre/domain. upsert por (email + accountId) o similar.
4.3. (Opcional) Endpoint /import
Más adelante, cuando el script CLI esté estable:
Página /import con upload.
Endpoint app/api/import/route.ts que: recibe archivo, invoca el mismo módulo de import.
✅ Criterio de salida Fase 4:
Puedes tomar una lista enriquecida con Player_Type, correr el script y ver inmediatamente esos leads y cuentas reflejados en /sales, con Player_Type correcto filtrable.

🚀 Fase 5 — Pulido, HubSpot mínimo y deploy estable
5.1. UX / ergonomía
Dropdown de Lead Owner persistido en localStorage.
Chips claros para:
Route Type
Work Status
Player Type
Toasters: Éxito / error al marcar como trabajado.
Loading spinners claros al cambiar filtros.
5.2. HubSpot (v1 muy simple)
Usas solo hubspotContactUrl para abrir HubSpot.
(Opcional v1.1): Script para backfillear hubspotContactId desde un export de HubSpot.
Más adelante, un job que lea por API la etapa del contacto y la muestre como columna extra (hubspotStage).
5.3. Deploy
Mover Postgres a un servicio remoto (Supabase / Render / lo que uses).
Setear DATABASE_URL en Vercel.
Deployar y probar /sales con un subconjunto real de cuentas/leads.
✅ Criterio de salida Fase 5:
El equipo comercial puede usar solo /sales + HubSpot para operar su día a día, filtrando por Player_Type cuando hace sentido, y tú puedes seguir alimentando la BD con nuevas listas enriquecidas sin tocar nada a mano.
