/** IDs fijos del seed `npm run seed:demo` */
export const DEMO_IDS = {
  clients: {
    acme: "b1000001-0001-4001-8001-000000000001",
    norte: "b1000001-0001-4001-8001-000000000002",
    patagonia: "b1000001-0001-4001-8001-000000000003",
  },
  contracts: {
    locacion: "b3000001-0001-4001-8001-000000000001",
    cloudAudited: "b3000001-0001-4001-8001-000000000002",
    transporte: "b3000001-0001-4001-8001-000000000004",
    deposito: "b3000001-0001-4001-8001-000000000006",
  },
} as const;

export const DEMO_SEARCH_SUGGESTIONS = ["penalidad", "rescisión", "confidencialidad"] as const;

export const DEMO_FLOW_STEPS = [
  {
    step: 1,
    title: "Panel ejecutivo",
    description: "Mostrá vencimientos, riesgo y estado del portfolio en el dashboard.",
    href: "/",
  },
  {
    step: 2,
    title: "Búsqueda híbrida",
    description: 'Buscá "penalidad" o "rescisión" y abrí un resultado.',
    href: "/",
  },
  {
    step: 3,
    title: "Cliente 360",
    description: "Entrá a Acme y exportá informe HTML del portfolio.",
    href: `/clients/${DEMO_IDS.clients.acme}`,
  },
  {
    step: 4,
    title: "Auditoría lista",
    description: "Contrato Cloud ya auditado — exportá informe sin esperar IA.",
    href: `/contracts/${DEMO_IDS.contracts.cloudAudited}`,
  },
  {
    step: 5,
    title: "Tareas y bitácora",
    description: "Revisá responsables en Tareas y trazabilidad en la bitácora.",
    href: "/tareas",
  },
] as const;

export const DEMO_CLIENTS = [
  { name: "Acme Argentina S.A.", href: `/clients/${DEMO_IDS.clients.acme}` },
  { name: "Grupo Norte Logística", href: `/clients/${DEMO_IDS.clients.norte}` },
  { name: "Inversiones Patagonia", href: `/clients/${DEMO_IDS.clients.patagonia}` },
] as const;
